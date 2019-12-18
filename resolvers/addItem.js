const uuid = require('uuid/v4');

const gql = String.raw;

const {getUserId, isCustomerTask} = require('../utils');
const {NotFoundError} = require('../errors');

const addItem = async (
	parent,
	{
		projectId,
		sectionId,
		name,
		type,
		description,
		unit,
		position: wantedPosition,
		linkedCustomerId,
		linkedCustomer,
		dueDate,
		dailyRate,
		tags,
	},
	ctx,
) => {
	const userId = getUserId(ctx);

	let position = 0;

	if (projectId && !sectionId) {
		let [section] = await ctx.db.sections({
			where: {project: {id: projectId}},
			orderBy: 'position_DESC', // last section in project
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
		sectionId = section.id;
		// eslint-disable-next-line no-param-reassign
		wantedPosition = wantedPosition || Infinity;
	}

	if (sectionId) {
		const [section] = await ctx.db.sections({
			where: {
				id: sectionId,
				project: {
					OR: [
						{
							owner: {id: userId},
						},
						{
							customer: {
								serviceCompany: {
									owner: {id: userId},
								},
							},
						},
					],
				},
			},
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
					notifyActivityToCustomer
				}
			}
		`);

		if (!section) {
			throw new NotFoundError(
				`No section with id '${sectionId}' has been found`,
			);
		}

		if (section.project.status === 'FINISHED') {
			throw new Error('Item cannot be added in this project state.');
		}

		if (!section.project.notifyActivityToCustomer && isCustomerTask({type})) {
			throw new Error(
				'Project needs to have notifyActivityToCustomer activated to add customer tasks.',
			);
		}

		// default position: end of the list
		position = section.items.length;

		if (typeof wantedPosition === 'number') {
			const wantedPositionItemIndex = section.items.findIndex(
				item => item.position === wantedPosition,
			);

			if (wantedPositionItemIndex !== -1) {
				position = wantedPosition;

				// updating all the positions from the item position
				await Promise.all(
					section.items.slice(position).map((item, index) => ctx.db.updateItem({
						where: {id: item.id},
						data: {position: position + index + 1},
					})),
				);
			}
		}
	}

	const {defaultDailyPrice} = await ctx.db.user({id: userId});
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

	const createdItem = await ctx.db.createItem({
		section: sectionId && {connect: {id: sectionId}},
		linkedCustomer: variables.linkedCustomer,
		owner: {connect: {id: userId}},
		name,
		type,
		status: 'PENDING',
		description,
		unit,
		position,
		dueDate,
		dailyRate: dailyRate || defaultDailyPrice,
		tags: tags && {connect: tags.map(tag => ({id: tag}))},
	});

	await ctx.db.createUserEvent({
		type: 'ADDED_TASK',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: createdItem.id,
			name: createdItem.name,
		},
		task: {
			connect: {id: createdItem.id},
		},
		project: projectId && {connect: {id: projectId}},
	});

	return createdItem;
};

module.exports = {
	addItem,
};
