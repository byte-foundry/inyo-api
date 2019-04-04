const gql = String.raw;

const {
	getUserId, getAppUrl, formatFullName, formatName,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendProjectStartedEmail} = require('../emails/ProjectEmail');

const startProject = async (parent, {id, notifyCustomer = true}, ctx) => {
	const [project] = await ctx.db.projects({
		where: {
			id,
			customer: {
				serviceCompany: {
					owner: {
						id: getUserId(ctx),
					},
				},
			},
		},
	}).$fragment(gql`
		fragment ProjectWithUserAndCustomer on Project {
			id
			name
			token
			status
			customer {
				name
				title
				firstName
				lastName
				email
				serviceCompany {
					siret
					name
					owner {
						firstName
						lastName
					}
					address {
						street
						city
						country
					}
				}
			}
		}
	`);

	if (!project) {
		throw new NotFoundError(`Project '${id}' has not been found.`);
	}

	if (project.status !== 'DRAFT') {
		throw new Error('This project has already been sent.');
	}

	if (notifyCustomer) {
		const {customer} = project;
		const {serviceCompany} = customer;
		const user = serviceCompany.owner;

		try {
			await sendProjectStartedEmail({
				email: customer.email,
				customerName: String(
					` ${formatFullName(
						customer.title,
						customer.firstName,
						customer.lastName,
					)}`,
				).trimRight(),
				projectName: project.name,
				user: formatName(user.firstName, user.lastName),
				url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
			});
			console.log(`Project email sent to ${customer.email}`);
		}
		catch (error) {
			console.log('Error: Project email not sent', error);
		}
	}

	return ctx.db.updateProject({
		where: {id},
		data: {
			status: 'ONGOING',
			issuedAt: new Date(),
		},
	});
};

module.exports = {
	startProject,
};
