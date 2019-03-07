const uuid = require('uuid/v4');

const {getUserId} = require('../utils');
const {sendMetric} = require('../stats');
const {sendProjectCreatedEmail} = require('../emails/ProjectEmail');

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
	const userId = getUserId(ctx);
	const userCompany = await ctx.db.user({id: userId}).company();

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
				token: uuid(),
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
		owner: {connect: {id: userId}},
		sections: sections && {
			create: sections.map((section, sectionIndex) => ({
				...section,
				items: section.items && {
					create: section.items.map((item, index) => ({
						...item,
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

	const user = await ctx.db.user({id: userId});

	await sendProjectCreatedEmail({
		userEmail: user.email,
		...result,
	});
	console.log('Project created email sent to us');

	sendMetric({metric: 'inyo.project.created'});

	return result;
};

module.exports = {
	createProject,
};
