const uuid = require('uuid/v4');
const {getUserId} = require('../utils');
const {NotFoundError} = require('../errors');

const gql = String.raw;

const updateProject = async (
	parent,
	{
		id,
		name,
		sharedNotes,
		personalNotes,
		quoteHeader,
		quoteFooter,
		customerId,
		customer,
		deadline,
		budget,
		notifyActivityToCustomer,
	},
	ctx,
) => {
	if (ctx.token) {
		const projectExists = await ctx.db.$exists.project({
			where: {
				id,
				customer: {token: ctx.token},
			},
		});

		if (projectExists) {
			throw new NotFoundError(`Project '${id}' has not been found.`);
		}

		return ctx.db.updateProject({
			where: {id},
			data: {sharedNotes},
		});
	}

	const userId = getUserId(ctx);
	const [project] = await ctx.db.projects({
		where: {
			id,
			OR: [
				{
					owner: {id: userId},
				},
				{
					customer: {
						serviceCompany: {
							owner: {
								id: userId,
							},
						},
					},
				},
			],
		},
	}).$fragment(gql`
		fragment ProjectToBeUpdated on Project {
			id
			notifyActivityToCustomer
			customer {
				id
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project ${id} has not been found.`);
	}

	if (typeof name === 'string' && name.length === 0) {
		throw new Error('The new project name must not be empty.');
	}

	if (!project.notifyActivityToCustomer || notifyActivityToCustomer === false) {
		// TODO: Might need to reset some data (linkedCustomer, files list, ...)
		await ctx.db.updateManyItems({
			where: {
				section: {project: {id}},
				type_in: [
					'CUSTOMER',
					'CONTENT_ACQUISITION',
					'CUSTOMER_REMINDER',
					'VALIDATION',
					'USER_REMINDER',
					'INVOICE',
				],
			},
			data: {type: 'DEFAULT'},
		});
	}

	const variables = {};

	if (customerId) {
		variables.customer = {
			connect: {id: customerId},
		};
	}
	else if (customer) {
		const userCompany = await ctx.db.user({id: userId}).company();

		variables.customer = {
			create: {
				...customer,
				email: String(customer.email || '').toLowerCase(),
				token: uuid(),
				serviceCompany: {connect: {id: userCompany.id}},
				address: {
					create: customer.address,
				},
			},
		};
	}
	else if (customerId === null || customer === null) {
		variables.customer = {
			disconnect: true,
		};
	}

	const updatedProject = await ctx.db.updateProject({
		where: {id},
		data: {
			...variables,
			name,
			sharedNotes,
			personalNotes,
			quoteHeader,
			quoteFooter,
			deadline,
			budget,
			notifyActivityToCustomer,
		},
	});

	await ctx.db.createUserEvent({
		type: 'UPDATED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: updatedProject.id,
		},
		project: {
			connect: {id: updatedProject.id},
		},
	});

	if (customerId || customer) {
		const projectCustomer = await ctx.db.project({id}).customer();

		await ctx.db.createUserEvent({
			type: 'LINKED_CUSTOMER_TO_PROJECT',
			user: {connect: {id: ctx.userId}},
			metadata: {
				projectId: id,
				customerId: projectCustomer.id,
			},
			project: {connect: {id}},
			customer: {connect: {id: projectCustomer.id}},
		});
	}
	else if (project.customer && (customerId === null || customer === null)) {
		await ctx.db.createUserEvent({
			type: 'UNLINKED_CUSTOMER_TO_PROJECT',
			user: {connect: {id: ctx.userId}},
			metadata: {
				projectId: id,
				customerId: project.customer.id,
			},
			project: {connect: {id}},
			customer: {connect: {id: project.customer.id}},
		});
	}

	return updatedProject;
};

module.exports = {
	updateProject,
};
