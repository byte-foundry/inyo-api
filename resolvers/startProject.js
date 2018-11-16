const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {sendMetric} = require('../stats');
const {sendProjectStartedEmail} = require('../emails/ProjectEmail');

const inyoProjectBaseUrl = 'https://app.inyo.me/app/projects';

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const startProject = async (parent, {id}, ctx) => {
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

	const {customer} = project;
	const {serviceCompany} = customer;
	const user = serviceCompany.owner;

	// sending the quote via sendgrid
	// this use the quote template
	try {
		await sendProjectStartedEmail({
			email: customer.email,
			customerName: String(
				` ${titleToCivilite[customer.title]} ${customer.firstName} ${
					customer.lastName
				}`,
			).trimRight(),
			projectName: project.name,
			user: `${user.firstName} ${user.lastName}`,
			url: `${inyoProjectBaseUrl}/${project.id}/view/${project.token}`,
		});
		console.log(`Project email sent to ${customer.email}`);
	}
	catch (error) {
		console.log('Error: Project email not sent', error);
	}

	sendMetric({metric: 'inyo.project.sent'});

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
