const uuid = require('uuid/v4');

const {getUserId, getAppUrl} = require('../utils');
const {sendProjectCreatedEmail} = require('../emails/ProjectEmail');

const createProject = async (
	parent,
	{
		customerId,
		customer,
		name,
		sharedNotes,
		personalNotes,
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

	const createdProject = await ctx.db.createProject({
		...variables,
		name: name || 'Nom du projet',
		sharedNotes,
		personalNotes,
		template,
		token: uuid(),
		owner: {connect: {id: userId}},
		sections: sections && {
			create: sections.map((section, sectionIndex) => ({
				...section,
				items: section.items && {
					create: section.items.map((item, index) => ({
						...item,
						owner: {connect: {id: userId}},
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

		await sendProjectCreatedEmail(
			{
				meta: {userId},
				userEmail: user.email,
				name: createdProject.name,
				url: getAppUrl(
					`/${token || createdProject.token}/tasks?projectId=${
						createdProject.id
					}`,
				),
			},
			ctx,
		);
	}
	catch (err) {
		console.log(err);
	}

	await ctx.db.createUserEvent({
		type: 'CREATED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: createdProject.id,
		},
	});

	return createdProject;
};

module.exports = {
	createProject,
};
