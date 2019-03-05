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
		comment,
		position: wantedPosition,
		token,
		linkedCustomerId,
		linkedCustomer,
		dueDate,
	},
	ctx,
) => {
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

	let position;
	let wantedSection = item.section || {id: sectionId};

	if (projectId && !sectionId) {
		let [section] = await ctx.db.sections({
			where: {project: {id: projectId}},
			orderBy: 'position_ASC',
			first: 1,
		});

		if (!section) {
			section = await ctx.db.createSection({
				project: projectId && {connect: {id: projectId}},
				name: 'Renommer cette section',
				position: 0,
			});
		}

		// eslint-disable-next-line no-param-reassign
		wantedSection = section;
		// eslint-disable-next-line no-param-reassign
		wantedPosition = wantedPosition || 0;
	}

	if (item.section) {
		const {project} = item.section;

		if (project.status === 'FINISHED') {
			throw new Error(
				`Item '${id}' cannot be updated when the project is finished.`,
			);
		}

		position = wantedPosition;
		let initialPosition = item.section.items.findIndex(
			sectionItem => sectionItem.id === item.id,
		);

		if (initialPosition === -1) {
			throw new Error(
				`Item '${item.id}' has not been found in Section '${
					item.section.id
				}' items.`,
			);
		}

		if (sectionId && sectionId !== item.section.id) {
			[wantedSection] = project.sections;

			if (!wantedSection) {
				throw new Error(
					`Item '${id}' cannot be moved into Section '${sectionId}', it has not been found in the project.`,
				);
			}
		}

		if (wantedSection && wantedSection.id !== item.section.id) {
			// if we change section, we need to re-order the previous one
			// putting it at the end of the section first
			await reorderSection(
				item.section,
				initialPosition,
				item.section.items.length,
				ctx,
			);

			initialPosition = wantedSection.items && wantedSection.items.length;
		}

		if (
			(wantedSection.items
				&& (typeof wantedPosition === 'number'
					&& wantedPosition !== initialPosition))
			|| (sectionId && sectionId !== item.section.id)
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
			section: wantedSection && {connect: {id: wantedSection.id}},
			name,
			type,
			description,
			unit,
			position,
			dueDate,
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

	return updatedItem;
};

module.exports = {
	updateItem,
};
