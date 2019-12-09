const hogan = require('hogan.js');

const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');
const {
	getAppUrl,
	formatFullName,
	formatName,
	createCustomEmailArguments,
	reminderTypesTemplateIds,
} = require('../utils');
const {contentSerializer, subjectSerializer} = require('../emails/serializers');

async function sendNewCommentEmail(
	{
		email,
		meta,
		commentId,
		authorId,
		recipientId,
		authorIsUser,
		recipientIsUser,
		userId,
		taskId,
		projectId,
	},
	ctx,
) {
	const [template] = await ctx.db.templates({
		where: {
			type: 'COMMENT_ADDED',
			name: 'COMMENT_ADDED',
		},
	});

	if (!template) {
		let author;

		let recipient;

		let project;

		const user = await ctx.db.user({id: userId});

		if (authorIsUser) {
			author = await ctx.db.user({id: authorId});
		}
		else {
			author = await ctx.db.customer({id: recipientId});
		}

		if (recipientIsUser) {
			recipient = await ctx.db.user({id: authorId});
		}
		else {
			recipient = await ctx.db.customer({id: recipientId});
		}

		if (projectId) {
			project = await ctx.db.project({id: projectId});
		}

		const comment = await ctx.db.comment({id: commentId});
		const item = await ctx.db.item({id: taskId});
		const params = {
			authorName: author.title
				? formatFullName(author.title, author.firstName, author.lastName)
				: formatName(author.firstName, author.lastName),
			recipientName: recipient.title
				? formatFullName(
					recipient.title,
					recipient.firstName,
					recipient.lastName,
				  )
				: formatName(recipient.firstName, recipient.lastName),
			userName: formatName(user.firstName, user.lastName),
			itemName: item.name,
			comment,
			project,
			url: recipientIsUser
				? getAppUrl(`/tasks/${item.id}`)
				: getAppUrl(
					`/${recipient.token}/tasks/${item.id}${
						projectId ? `?projectId=${projectId}` : ''
					}`,
				  ),
		};

		return sendEmail(
			{
				email,
				meta,
				data: params,
				templateId: getTemplateId('d-9037dcd4a6d4435a93546a891cfc1037', ctx),
			},
			ctx,
		);
	}

	const emailArgs = await createCustomEmailArguments({
		authorId,
		recipientId,
		taskId,
		projectId,
		commentId,
		authorIsUser,
		recipientIsUser,
		ctx,
	});
	const htmlSubject = subjectSerializer.serialize(template.subject);
	const htmlContent = contentSerializer.serialize(template.content);

	const compiledSubject = hogan.compile(htmlSubject);
	const compiledContent = hogan.compile(htmlContent);

	const renderedSubject = compiledSubject.render(emailArgs);
	const renderedContent = compiledContent.render(emailArgs);

	return sendEmail({
		data: {
			subject: renderedSubject,
			content: renderedContent,
		},
		meta,
		templateId: reminderTypesTemplateIds.CUSTOM,
		email: emailArgs.recipient.email,
	});
}

module.exports = {
	sendNewCommentEmail,
};
