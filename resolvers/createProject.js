const uuid = require('uuid/v4');

const {getUserId} = require('../utils');
const {sendMetric} = require('../stats');

const createProject = async (
	parent,
	{
		customerId,
		customer,
		name,
		template,
		sections,
		deadline,
		notifyActivityToCustomer,
	},
	ctx,
) => {
	const userCompany = await ctx.db.user({id: getUserId(ctx)}).company();

	const variables = {};

	if (customerId) {
		variables.customer = {
			connect: {id: customerId},
		};
	}
	else if (customer) {
		variables.customer = {
			create: {
				...customer,
				serviceCompany: {connect: {id: userCompany.id}},
				address: {
					create: customer.address,
				},
			},
		};
	}

	const result = await ctx.db.createProject({
		...variables,
		name: name || 'Nom du projet',
		template,
		token: uuid(),
		sections: sections && {
			create: sections.map((section, sectionIndex) => ({
				...section,
				items: section.items && {
					create: section.items.map((item, index) => ({
						...item,
						reviewer:
							notifyActivityToCustomer === false ? 'USER' : item.reviewer,
						position: index,
					})),
				},
				position: sectionIndex,
			})),
		},
		status: 'DRAFT',
		notifyActivityToCustomer,
		deadline,
	});

	sendMetric({metric: 'inyo.project.created'});

	return result;
};

module.exports = {
	createProject,
};
