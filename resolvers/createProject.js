const uuid = require('uuid/v4');

const {getUserId, getAppUrl} = require('../utils');
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
		status: 'ONGOING',
		notifyActivityToCustomer,
		deadline,
	});

	try {
		const user = await ctx.db.user({id: userId});
		let token;

		if (customerId) {
			({token} = await ctx.db.customer({id: customerId}));
		}
		else if (customer) {
			({token} = variables.customer.create);
		}

		await sendProjectCreatedEmail({
			userEmail: user.email,
			name: result.name,
			url: token
				? getAppUrl(`/${token}/tasks?projectId=${result.id}`)
				: 'Pas de client',
		});
	}
	catch (err) {
		console.log(err);
	}

	sendMetric({metric: 'inyo.project.created'});

	return result;
};

module.exports = {
	createProject,
};
