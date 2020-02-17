const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');
const {renderTemplate} = require('../utils');

async function sendCustomerEveningEmail(
	{
		email, meta, userId, customerId, tasks, projects, ...data
	},
	ctx,
) {
	const [template] = await ctx.db.emailTemplates({
		where: {
			type: {
				category: 'CUSTOMER_REPORT',
				name: 'CUSTOMER_REPORT',
			},
			owner: {id: userId},
		},
	});

	if (template) {
		const [renderedSubject, renderedContent] = await renderTemplate({
			template,
			userId,
			customerId,
			tasks,
			projects,
			ctx,
		});

		return sendEmail({
			email,
			meta,
			data: {
				subject: renderedSubject,
				content: renderedContent,
			},
			templateId: 'd-9feaaa66a50a4dd0bcde2d98d41b3737',
		});
	}

	return sendEmail(
		{
			email,
			meta,
			data: {
				tasks,
				projects,
				...data,
			},
			templateId: getTemplateId('d-ce9155013d1e4f77920aa27685757a6e', ctx),
		},
		ctx,
	);
}

module.exports = {
	sendCustomerEveningEmail,
};
