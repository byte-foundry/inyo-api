const Html = require('slate-html-serializer').default;
const JSON = require('jsdom');
const React = require('react');

const sendEmail = require('../emails/SendEmail');
const {baseArguments} = require('../emails/templates');

const serializer = new Html({
	rules: [
		{
			serialize: (object, children) => {
				if (object.type && object.type === 'param') {
					return React.createElement(
						'span',
						null,
						'{{'.concat(object.data.param.name, '}}'),
					);
				}
				if (object.type && object.type === 'paragraph') {
					return React.createElement('p', null, children);
				}
				return undefined;
			},
		},
	],
	defaultBlock: 'paragraph',
	parseHtml: JSON.fragment,
});

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

	const htmlSubject = serializer.serialize(template.subject);
	const htmlContent = serializer.serialize(template.content);

	sendEmail(
		{
			email: 'yannick@inyo.me',
			data: {
				subject: htmlSubject,
				content: htmlContent,
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
