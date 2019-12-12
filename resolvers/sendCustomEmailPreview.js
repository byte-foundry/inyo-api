const hogan = require('hogan.js');

const sendEmail = require('../emails/SendEmail');
const {baseArguments} = require('../emails/templates');
const {contentSerializer, subjectSerializer} = require('../emails/serializers');

const sendCustomEmailPreview = async (parent, {subject, content}, ctx) => {
	const htmlSubject = subjectSerializer.serialize(subject);
	const htmlContent = contentSerializer.serialize(content);

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
