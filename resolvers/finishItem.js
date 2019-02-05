const gql = String.raw;

const {
	getUserId, getAppUrl, formatFullName, formatName,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
const {
	legacy_sendTaskValidationEmail, // eslint-disable-line
	sendTaskValidationEmail,
	sendTaskValidationWaitCustomerEmail,
	setupItemReminderEmail,
	sendItemContentAcquisitionEmail,
} = require('../emails/TaskEmail');
const cancelReminder = require('../reminders/cancelReminder');

const filterDescription = description => description.split(/# content-acquisition-list[\s\S]+/).join('');

const cancelPendingReminders = async (pendingReminders, itemId, ctx) => {
	try {
		await Promise.all(
			pendingReminders.map(reminder => cancelReminder(reminder.postHookId)),
		);

		const reminderIds = pendingReminders.map(r => r.id);

		await ctx.db.updateManyReminders({
			where: {id_in: reminderIds, status: 'PENDING'},
			data: {status: 'CANCELED'},
		});

		console.log(`Canceled pending reminders of Item '${itemId}'.`, reminderIds);
	}
	catch (err) {
		console.error(
			`Errors cancelling pending reminders of Item '${itemId}'`,
			err,
		);
	}
};

const finishItem = async (parent, {id, token, timeItTook}, ctx) => {
	const fragment = gql`
		fragment ItemWithQuoteAndProject on Item {
			name
			status
			reviewer
			unit
			pendingReminders: reminders(where: {status: PENDING}) {
				id
				postHookId
				type
				status
			}
			section {
				id
				option {
					sections {
						name
						items {
							name
							unit
							status
						}
					}
					quote {
						id
						token
						name
						customer {
							title
							firstName
							lastName
							email
							serviceCompany {
								owner {
									firstName
									lastName
								}
							}
						}
						status
					}
				}
				project {
					id
					token
					name
					customer {
						title
						firstName
						lastName
						email
						phone
						serviceCompany {
							owner {
								email
								firstName
								lastName
							}
						}
					}
					status
					sections(orderBy: position_ASC) {
						name
						items(orderBy: position_ASC) {
							name
							unit
							status
						}
					}
				}
			}
		}
	`;

	// Customer can finish item only in project
	// PROJECT
	if (token) {
		const [item] = await ctx.db
			.items({
				where: {
					id,
					OR: [
						{section: {option: {quote: {token}}}},
						{section: {project: {token}}},
					],
				},
			})
			.$fragment(fragment);

		if (item.reviewer !== 'CUSTOMER') {
			throw new Error('This item cannot be finished by the customer.');
		}

		const {project} = item.section;

		if (project.status !== 'ONGOING' || item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, customer} = project;
		const user = project.customer.serviceCompany.owner;

		try {
			await sendTaskValidationEmail({
				email: user.email,
				user: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				customerName: String(
					` ${formatName(user.firstName, user.lastName)}`,
				).trimRight(),
				projectName: project.name,
				itemName: item.name,
				sections: sections
					.map(section => ({
						name: section.name,
						timeLeft: section.items
							.filter(item => item.status === 'PENDING')
							.reduce((acc, item) => acc + item.unit, 0),
					}))
					.filter(section => section.timeLeft > 0),
				url: getAppUrl(`/projects/${project.id}/see`),
			});
			console.log(`Task validation email sent to ${user.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}

		sendMetric({metric: 'inyo.item.validated'});

		await cancelPendingReminders(item.pendingReminders, id, ctx);

		return ctx.db.updateItem({
			where: {id},
			data: {
				status: 'FINISHED',
				finishedAt: new Date(),
			},
		});
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db
		.items({
			where: {
				id,
				OR: [
					{
						section: {
							option: {
								quote: {
									customer: {
										serviceCompany: {
											owner: {id: userId},
										},
									},
								},
							},
						},
					},
					{
						section: {
							project: {
								customer: {
									serviceCompany: {
										owner: {id: userId},
									},
								},
							},
						},
					},
				],
			},
		})
		.$fragment(fragment);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	// PROJECT

	if (item.section.project) {
		const {project} = item.section;

		if (item.reviewer !== 'USER') {
			throw new Error('This item cannot be finished by the user.');
		}

		if (project.status !== 'ONGOING' || item.status !== 'PENDING') {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, customer} = project;
		const user = project.customer.serviceCompany.owner;

		// we ask for the next items in the section
		// or the items in the next section
		const nextItems = await ctx.db.item({id}).$fragment(gql`
			fragment NextItems on Item {
				section {
					items(orderBy: position_ASC, after: "${id}") {
						id
						name
						type
						description
						reviewer
					}
					project {
						sections(
							orderBy: position_ASC
							after: "${item.section.id}"
							where: { items_some: {} }
						) {
							items(orderBy: position_ASC) {
								id
								name
								type
								description
								reviewer
							}
						}
					}
				}
			}
		`);

		const nextItem
			= nextItems.section.items[0]
			|| (nextItems.section.project.sections[0]
				&& nextItems.section.project.sections[0].items[0]);

		// taking all items that needs to be done by the customer
		let nextItemsToDo = nextItems.section.items.concat(
			nextItems.section.project.sections.reduce(
				(acc, section) => acc.concat(section.items),
				[],
			),
		);

		nextItemsToDo = nextItemsToDo.slice(
			0,
			nextItemsToDo.findIndex(item => item.reviewer === 'USER'),
		);

		const basicInfo = {
			email: customer.email,
			userEmail: user.email,
			user: formatName(user.firstName, user.lastName),
			customerName: String(
				` ${
					formatFullName(customer.title, customer.firstName, customer.lastName)}`,
			).trimRight(),
			customerEmail: customer.email,
			customerPhone: customer.phone,
			projectName: project.name,
			itemName: item.name,
			url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
		};

		try {
			if (
				nextItem
				&& nextItem.type === 'CONTENT_ACQUISITION'
				&& nextItem.reviewer === 'CUSTOMER'
			) {
				await sendItemContentAcquisitionEmail({
					...basicInfo,
					nextItemName: nextItem.name,
					nextItemDescription: filterDescription(nextItem.description),
				});
				console.log('Content acquisition email sent to us');
			}
			else if (nextItem && nextItem.reviewer === 'CUSTOMER') {
				await setupItemReminderEmail(
					{
						...basicInfo,
						itemId: nextItem.id,
						items: nextItemsToDo,
						nextItemName: nextItem.name,
						nextItemDescription: filterDescription(nextItem.description),
						issueDate: new Date(),
					},
					ctx,
				);
				console.log(`Item '${nextItem.id}': Reminders set.`);

				await sendTaskValidationWaitCustomerEmail({
					...basicInfo,
					items: nextItemsToDo,
					nextItemName: nextItem.name,
					nextItemDescription: filterDescription(nextItem.description),
				});
				console.log(
					`Task validation email asking for action sent to ${customer.email}`,
				);
			}
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}
	}
	// QUOTE
	else {
		if (
			item.section.option.quote.status !== 'ACCEPTED'
			|| item.status !== 'PENDING'
		) {
			throw new Error(`Item '${id}' cannot be finished.`);
		}

		const {sections, quote} = item.section.option;
		const {customer} = quote;
		const user = customer.serviceCompany.owner;

		try {
			await legacy_sendTaskValidationEmail({
				email: customer.email,
				user: formatName(user.firstName, user.lastName),
				customerName: String(
					` ${
						formatFullName(
							quote.customer.title,
							quote.customer.firstName,
							quote.customer.lastName,
						)}`,
				).trimRight(),
				projectName: quote.name,
				itemName: item.name,
				sections: sections
					.map(section => ({
						name: section.name,
						timeLeft: section.items
							.filter(item => item.status === 'PENDING')
							.reduce((acc, item) => acc + item.unit, 0),
					}))
					.filter(section => section.timeLeft > 0),
				quoteUrl: getAppUrl(`/quotes/${quote.id}/view/${quote.token}`),
			});
			console.log(`Task validation email sent to ${customer.email}`);
		}
		catch (error) {
			console.log('Task validation email not sent', error);
		}
	}

	sendMetric({metric: 'inyo.item.validated'});

	await cancelPendingReminders(item.pendingReminders, id, ctx);

	return ctx.db.updateItem({
		where: {id},
		data: {
			status: 'FINISHED',
			finishedAt: new Date(),
			timeItTook: timeItTook || item.unit,
		},
	});
};

module.exports = {
	finishItem,
};
