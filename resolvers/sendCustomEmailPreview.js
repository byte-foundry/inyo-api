const gql = String.raw;
const hogan = require('hogan.js');

const {formatName} = require('../utils.js');
const sendEmail = require('../emails/SendEmail');
const {baseArguments} = require('../emails/templates');
const {contentSerializer, subjectSerializer} = require('../emails/serializers');

const sendCustomEmailPreview = async (parent, {subject, content}, ctx) => {
	const user = await ctx.db.user({id: ctx.userId}).$fragment(gql`
		fragment UserWithCompany on User {
			id
			firstName
			lastName
			email
			company {
				id
				phone
			}
		}
	`);

	const htmlSubject = subjectSerializer.serialize(subject);
	const htmlContent = contentSerializer.serialize(content);

	const compiledSubject = hogan.compile(htmlSubject);
	const compiledContent = hogan.compile(htmlContent);

	const renderedSubject = compiledSubject.render({
		...baseArguments[ctx.language],
		user: {
			...baseArguments[ctx.language].user,
		},
	});
	const renderedContent = compiledContent.render({
		...baseArguments[ctx.language],
		user: {
			...baseArguments[ctx.language].user,
			firstname: user.firstName,
			lastname: user.lastName,
			email: user.email,
			phone: user.company.phone,
			fullname: formatName(user.firstName, user.lastName),
		},
	});

	sendEmail(
		{
			email: ctx.email,
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
