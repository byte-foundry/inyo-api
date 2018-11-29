const uuid = require('uuid/v4');

const {getUserId} = require('../utils');
const {InsufficientDataError} = require('../errors');
const {sendMetric} = require('../stats');

const createProject = async (
	parent,
	{
		customerId, customer, name, template, sections, deadline,
	},
	ctx,
) => {
	const userCompany = await ctx.db.user({id: getUserId(ctx)}).company();

	if (!customerId && !customer) {
		throw new InsufficientDataError(
			'You must define either a customer or set an existing customer id.',
		);
	}

	const variables = {};

	if (customerId) {
		variables.customer = {
			connect: {id: customerId},
		};
	}
	else {
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
			create: sections.map(section => ({
				...section,
				items: section.items && {
					create: section.items,
				},
			})),
		},
		status: 'DRAFT',
		deadline,
	});

	sendMetric({metric: 'inyo.project.created'});

	return result;
};

module.exports = {
	createProject,
};
