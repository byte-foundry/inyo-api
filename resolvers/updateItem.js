const uuid = require('uuid/v4');

const gql = String.raw;

const {getUserId, createItemOwnerFilter} = require('../utils');
const {NotFoundError} = require('../errors');

const reorderSection = async (
	section,
	initialPosition,
	wantedPosition,
	ctx,
) => {
	const itemsToUpdate
		= wantedPosition > initialPosition
			? section.items.slice(initialPosition + 1, wantedPosition + 1)
			: section.items.slice(wantedPosition, initialPosition);

	const startIndex
		= wantedPosition > initialPosition ? initialPosition : wantedPosition + 1;

	await Promise.all(
		itemsToUpdate.map((sectionItem, index) => ctx.db.updateItem({
			where: {id: sectionItem.id},
			data: {position: startIndex + index},
		})),
	);
};

const updateItem = async (
	parent,
	{
		id,
		sectionId,
		projectId,
		name,
		type,
		description,
		unit,
		timeItTook,
		comment,
		position: wantedPosition,
		linkedCustomerId,
		linkedCustomer,
		dueDate,
		dailyRate,
		tags,
	},
	ctx,
) => {
	const {token} = ctx;

	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id,
				OR: [
					{
						section: {
							project: {
								token,
							},
						},
					},
					{
						linkedCustomer: {
							token,
						},
					},
				],
			},
		});

		if (!item) {
			throw new NotFoundError(`Item '${id}' has not been found.`);
		}

		// TODO: additional check

		if (!description) {
			throw new Error('A customer can only update files.');
		}

		return ctx.db.updateItem({
			where: {id},
			data: {description},
		});
	}

	const user = await ctx.db.user({id: getUserId(ctx)});
	const [item] = await ctx.db.items({
		where: {
			AND: [{id}, createItemOwnerFilter(user.id)],
		},
	}).$fragment(gql`
		fragment ItemWithProject on Item {
			id
			status
			position
			linkedCustomer {
				id
			}
			section {
				id
				items(orderBy: position_ASC) {
					id
					position
				}
				project {
					id
					status
					sections(orderBy: position_ASC, where: {id: "${sectionId}"}) {
						id
						items(orderBy: position_ASC) {
							id
						}
					}
				}
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${id}' has not been found.`);
	}

	if (item.status !== 'FINISHED' && typeof timeItTook === 'number') {
		throw new Error('Cannot update timeItTook in this state.');
	}

	if (unit === null) {
		throw new Error('Unit cannot be null, specify a number.');
	}

	if (timeItTook === null) {
		throw new Error('timeItTook cannot be null, specify a number.');
	}

	let position;
	let wantedSection;
	let initialPosition = Infinity;

	// the item has a section but can we update the project in the first place?
	if (item.section) {
		const {project} = item.section;

		if (project.status === 'FINISHED') {
			throw new Error(
				`Item '${id}' cannot be updated when the project is finished.`,
			);
		}

		// no we're good, let's get the initial position
		initialPosition = item.section.items.findIndex(
			sectionItem => sectionItem.id === item.id,
		);
	}

	// we want to link the item to a project but without specifying where
	// let's put it at the end then!
	if (projectId && !sectionId) {
		// last section in project
		let [section] = await ctx.db.sections({
			where: {project: {id: projectId}},
			orderBy: 'position_DESC',
			first: 1,
		}).$fragment(gql`
			fragment SectionWithProject on Section {
				id
				items(orderBy: position_ASC) {
					id
					position
				}
				project {
					id
					status
					sections(orderBy: position_ASC, where: {id: "${sectionId}"}) {
						id
						items(orderBy: position_ASC) {
							id
						}
					}
				}
			}
		`);

		if (!section) {
			section = await ctx.db.createSection({
				project: projectId && {connect: {id: projectId}},
				name: 'Renommer cette section',
				position: 0,
			}).$fragment(gql`
				fragment SectionWithProject on Section {
					id
					items(orderBy: position_ASC) {
						id
						position
					}
					project {
						id
						status
						sections(orderBy: position_ASC, where: {id: "${sectionId}"}) {
							id
							items(orderBy: position_ASC) {
								id
							}
						}
					}
				}
			`);
		}

		if (section.project.status === 'FINISHED') {
			throw new Error(`Item '${id}' cannot be moved to a finished project.`);
		}

		// eslint-disable-next-line no-param-reassign
		wantedSection = section;
		// eslint-disable-next-line no-param-reassign
		position = wantedPosition || section.items.length;
	}
	// the user wants to remove item from the project
	else if (projectId === null) {
		// eslint-disable-next-line no-param-reassign
		wantedPosition = Infinity;
	}
	// we are moving to a different section in the same project
	else if (item.section && sectionId && sectionId !== item.section.id) {
		[wantedSection] = item.section.project.sections;

		if (!wantedSection) {
			throw new Error(
				`Item '${id}' cannot be moved into Section '${sectionId}', it has not been found in the project.`,
			);
		}

		if (item.section.project.status === 'FINISHED') {
			throw new Error(`Item '${id}' cannot be moved to a finished project.`);
		}
	}
	// or else we don't move from the section and project where we are
	else {
		wantedSection = item.section;
	}

	// if we change section, we need to re-order the previous one if it exists
	// putting it virtually at the end of the wanted section (for reordering)
	if (item.section && wantedSection && wantedSection.id !== item.section.id) {
		await reorderSection(
			item.section,
			initialPosition,
			item.section.items.length,
			ctx,
		);

		initialPosition = wantedSection.items && wantedSection.items.length;
	}

	// finally, we reorder the section to move the item to the right place
	if (
		wantedSection
		&& typeof wantedPosition === 'number'
		&& wantedPosition !== initialPosition
	) {
		if (wantedPosition < 0) {
			position = 0;
		}
		else if (wantedPosition > wantedSection.items.length) {
			position = wantedSection.items.length;
		}
		else {
			position = wantedPosition;
		}

		reorderSection(wantedSection, initialPosition, wantedPosition, ctx);
	}

	const userId = getUserId(ctx);
	const userCompany = await ctx.db.user({id: userId}).company();
	const variables = {};

	if (linkedCustomerId) {
		variables.linkedCustomer = {
			connect: {id: linkedCustomerId},
		};
	}
	else if (linkedCustomer) {
		variables.linkedCustomer = {
			create: {
				...linkedCustomer,
				email: String(linkedCustomer.email || '').toLowerCase(),
				token: uuid(),
				serviceCompany: {connect: {id: userCompany.id}},
				address: {
					create: linkedCustomer.address,
				},
			},
		};
	}
	else if (linkedCustomerId === null || linkedCustomer === null) {
		variables.linkedCustomer = {
			disconnect: true,
		};
	}

	const updatedItem = await ctx.db.updateItem({
		where: {id},
		data: {
			...variables,
			section:
				item.section && projectId === null
					? {disconnect: true}
					: wantedSection && {connect: {id: wantedSection.id}},
			assignee: item.assignee && projectId === null && {disconnect: true},
			name,
			type,
			description,
			unit,
			timeItTook,
			position: projectId === null ? 0 : position,
			dueDate,
			dailyRate,
			tags: tags
				? {
					set: tags.map(tag => ({id: tag})),
				  }
				: undefined,
			comments: {
				create: comment && {
					text: comment.text,
					authorUser: {
						connect: {id: user.id},
					},
					views: {
						create: {
							user: {
								connect: {id: user.id},
							},
						},
					},
				},
			},
		},
	});

	await ctx.db.createUserEvent({
		type: 'UPDATED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: updatedItem.id,
		},
		task: {
			connect: {id: updatedItem.id},
		},
	});

	if (linkedCustomerId || linkedCustomer) {
		const taskCustomer = await ctx.db.item({id}).linkedCustomer();

		await ctx.db.createUserEvent({
			type: 'LINKED_CUSTOMER_TO_TASK',
			user: {connect: {id: ctx.userId}},
			metadata: {
				taskId: id,
				customerId: taskCustomer.id,
			},
			task: {connect: {id}},
			customer: {connect: {id: taskCustomer.id}},
			project: item.section && {connect: {id: item.section.project.id}},
		});
	}
	else if (
		item.linkedCustomer
		&& (linkedCustomerId === null || linkedCustomer === null)
	) {
		await ctx.db.createUserEvent({
			type: 'UNLINKED_CUSTOMER_TO_TASK',
			user: {connect: {id: ctx.userId}},
			metadata: {
				projectId: id,
				customerId: item.linkedCustomer.id,
			},
			task: {connect: {id}},
			customer: {connect: {id: item.linkedCustomer.id}},
			project: item.section && {connect: {id: item.section.project.id}},
		});
	}

	return updatedItem;
};

module.exports = {
	updateItem,
};
