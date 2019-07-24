const gql = String.raw;

const {
	getUserId,
	getAppUrl,
	formatFullName,
	formatName,
	createItemOwnerFilter,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendNewCommentEmail} = require('../emails/CommentEmail');

const postComment = async (parent, {itemId, token, comment}, ctx) => {
	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id: itemId,
				OR: [
					{
						section: {
							project: {
								OR: [
									{
										token,
									},
									{
										customer: {token},
									},
								],
							},
						},
					},
					{
						linkedCustomer: {token},
					},
				],
			},
		}).$fragment(gql`
			fragment ItemAndAuthorsForUser on Item {
				id
				name
				owner {
					id
					email
					firstName
					lastName
				}
				linkedCustomer {
					id
					firstName
					lastName
					email
				}
				section {
					project {
						token
						customer {
							id
							firstName
							lastName
							email
							token
						}
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${itemId}' has not been found`);
		}

		const user = item.owner;

		let customer = item.linkedCustomer;

		if (item.section) {
			const {project} = item.section;

			if (project.customer && project.customer.token === token) {
				({customer} = project);
			}
		}

		if (!customer) {
			throw new NotFoundError('Your token is invalid');
		}

		const result = await ctx.db.updateItem({
			where: {id: itemId},
			data: {
				comments: {
					create: {
						text: comment.text,
						authorCustomer: {
							connect: {id: customer.id},
						},
						views: {
							create: {
								customer: {
									connect: {id: customer.id},
								},
							},
						},
					},
				},
			},
		});

		try {
			const params = {
				meta: {
					userId: user.id,
				},
				email: user.email,
				recipientName: formatName(user.firstName, user.lastName),
				authorName: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				itemName: item.name,
				comment,
			};

			sendNewCommentEmail(
				{
					...params,
					url: getAppUrl(`/tasks/${item.id}`),
				},
				ctx,
			);

			console.log(`New comment email sent to ${user.email}`);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		await ctx.db.createCustomerEvent({
			type: 'POSTED_COMMENT',
			customer: {
				connect: {id: customer.id},
			},
			metadata: {
				itemId,
				commentId: result.id,
			},
			notifications: {
				create: {
					user: {connect: {id: user.id}},
				},
			},
		});

		return result;
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			AND: [{id: itemId}, createItemOwnerFilter(userId)],
		},
	}).$fragment(gql`
		fragment ItemAndAuthorsForCustomer on Item {
			id
			name
			owner {
				firstName
				lastName
				email
			}
			linkedCustomer {
				id
				token
				firstName
				lastName
				email
			}
			section {
				project {
					id
					name
					notifyActivityToCustomer
					owner {
						firstName
						lastName
						email
					}
					customer {
						id
						token
						firstName
						lastName
						email
						serviceCompany {
							owner {
								firstName
								lastName
								email
							}
						}
					}
				}
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${itemId}' has not been found.`);
	}

	let user = item.owner;

	if (item.section) {
		const {project} = item.section;
		const customer = item.linkedCustomer || project.customer;

		user = user || project.owner || customer.serviceCompany.owner;
	}

	const result = await ctx.db.updateItem({
		where: {id: itemId},
		data: {
			comments: {
				create: {
					text: comment.text,
					authorUser: {
						connect: {id: userId},
					},
					views: {
						create: {
							user: {
								connect: {id: userId},
							},
						},
					},
				},
			},
		},
	});

	try {
		const params = {
			meta: {userId},
			authorName: formatName(user.firstName, user.lastName),
			itemName: item.name,
			comment,
		};

		if (item.section && item.section.project.notifyActivityToCustomer) {
			const {linkedCustomer, section} = item;
			const {customer} = section.project;

			// send to project customer
			if (customer) {
				await sendNewCommentEmail(
					{
						...params,
						email: customer.email,
						recipientName: formatFullName(
							customer.title,
							customer.firstName,
							customer.lastName,
						),
						url: getAppUrl(
							`/${customer.token}/tasks/${item.id}?projectId=${
								section.project.id
							}`,
						),
					},
					ctx,
				);

				console.log(`New comment email sent to ${customer.email}`);
			}

			// send to linked
			if (linkedCustomer) {
				await sendNewCommentEmail(
					{
						...params,
						email: linkedCustomer.email,
						recipientName: formatFullName(
							linkedCustomer.title,
							linkedCustomer.firstName,
							linkedCustomer.lastName,
						),
						url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
					},
					ctx,
				);

				console.log(`New comment email sent to ${linkedCustomer.email}`);
			}
		}
		else if (!item.section && item.linkedCustomer) {
			const {linkedCustomer} = item;

			// send to linked
			await sendNewCommentEmail(
				{
					...params,
					email: linkedCustomer.email,
					recipientName: formatFullName(
						linkedCustomer.title,
						linkedCustomer.firstName,
						linkedCustomer.lastName,
					),
					url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
				},
				ctx,
			);

			console.log(`New comment email sent to ${linkedCustomer.email}`);
		}
	}
	catch (error) {
		console.log(`New comment email not because with error ${error}`);
	}

	await ctx.db.createUserEvent({
		type: 'POSTED_COMMENT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			itemId: result.id,
		},
	});

	return result;
};

module.exports = {
	postComment,
};
