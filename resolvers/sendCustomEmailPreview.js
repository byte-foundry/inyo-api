const hogan = require('hogan.js');

const sendEmail = require('../emails/SendEmail');
const {baseArguments} = require('../emails/templates');
const {contentSerializer, subjectSerializer} = require('../emails/serializers');

const sendCustomEmailPreview = async (parent, {templateId}, ctx) => {
	const [template] = await ctx.db.emailTemplates({
		where: {
			id: templateId,
			owner: {
				id: ctx.userId,
			},
		},
	});

	if (!template) {
		throw new Error(`Template '${templateId}' has not been found`);
	}

	const htmlSubject = subjectSerializer.serialize(template.subject);
	const htmlContent = contentSerializer.serialize(template.content);

	const compiledSubject = hogan.compile(htmlSubject);
	const compiledContent = hogan.compile(htmlContent);

	const renderedSubject = compiledSubject.render(baseArguments[ctx.language]);
	const renderedContent = compiledContent.render(baseArguments[ctx.language]);

	sendEmail(
		{
			email: 'francois@inyo.me',
			data: {
				subject: renderedSubject,
				content: renderedContent,
			},
			templateId: 'd-9feaaa66a50a4dd0bcde2d98d41b3737',
		},
		ctx,
	);

	return true;
};

module.exports = {
	sendCustomEmailPreview,
};
