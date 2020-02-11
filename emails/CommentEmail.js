const getTemplateId = require('./getTemplateId');
const sendEmail = require('./SendEmail.js');
const {
	getAppUrl,
	formatFullName,
	formatName,
	renderTemplate,
} = require('../utils');

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
	const [template] = await ctx.db.emailTemplates({
		where: {
			type: {
				category: 'COMMENT_ADDED',
				name: 'COMMENT_ADDED',
			},
			owner: {id: userId},
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
			author = await ctx.db.customer({id: authorId});
		}

		if (recipientIsUser) {
			recipient = await ctx.db.user({id: recipientId});
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
				replyTo: `suivi+${taskId}_${
					recipientIsUser ? 'U' : 'C'
				}_${recipientId}@inyo.me`,
				templateId: getTemplateId('d-9037dcd4a6d4435a93546a891cfc1037', ctx),
			},
			ctx,
		);
	}

	const [renderedSubject, renderedContent] = await renderTemplate({
		template,
		authorId,
		recipientId,
		taskId,
		projectId,
		commentId,
		authorIsUser,
		recipientIsUser,
		ctx,
	});

	return sendEmail(
		{
			data: {
				subject: renderedSubject,
				content: renderedContent,
			},
			replyTo: `suivi+${taskId}_${
				recipientIsUser ? 'U' : 'C'
			}_${recipientId}@inyo.me`,
			meta,
			templateId: 'd-9feaaa66a50a4dd0bcde2d98d41b3737',
			email,
		},
		ctx,
	);
}

module.exports = {
	sendNewCommentEmail,
};
