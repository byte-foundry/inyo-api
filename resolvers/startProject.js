const moment = require('moment');

const gql = String.raw;

const {getUserId} = require('../utils');
const {NotFoundError, InsufficientDataError} = require('../errors');
const {sendMetric} = require('../stats');
const {
	sendQuoteEmail: sendProjectEmail,
	setupQuoteReminderEmail: setupProjectReminderEmail,
} = require('../emails/QuoteEmail');

const inyoProjectBaseUrl = 'https://app.inyo.me/app/projects';

const titleToCivilite = {
	MONSIEUR: 'M.',
	MADAME: 'Mme',
};

const sendProject = async (parent, {id}, ctx) => {
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

	if (
		!serviceCompany.siret
		|| !serviceCompany.name
		|| !serviceCompany.address.street
		|| !serviceCompany.address.city
		|| !serviceCompany.address.country
	) {
		throw new InsufficientDataError(
			"It's not possible to send a project without company info",
		);
	}

	// sending the quote via sendgrid
	// this use the quote template
	try {
		await sendProjectEmail({
			email: customer.email,
			customerName: String(
				` ${titleToCivilite[customer.title]} ${customer.firstName} ${
					customer.lastName
				}`,
			).trimRight(),
			projectName: project.name,
			user: `${user.firstName} ${user.lastName}`,
			projectUrl: `${inyoProjectBaseUrl}/${project.id}/view/${project.token}`,
		});
		console.log(`Project email sent to ${customer.email}`);
	}
	catch (error) {
		console.log('Project email not sent with error', error);
	}

	try {
		setupProjectReminderEmail(
			{
				email: customer.email,
				customerName: customer.name,
				projectName: project.name,
				user: `${user.firstName} ${user.lastName}`,
				issueDate: moment().format(),
				projectId: project.id,
				quoteUrl: `${inyoProjectBaseUrl}/${project.id}/view/${project.token}`,
			},
			ctx,
		);
		console.log('Project reminder setup finished');
	}
	catch (error) {
		console.log('Project reminder setup errored with error', error);
	}

	// send mail with token

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
	sendProject,
};
