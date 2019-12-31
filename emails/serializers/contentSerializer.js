const JSON = require('jsdom');
const React = require('react');
const Html = require('slate-html-serializer').default;

const contentSerializer = new Html({
	rules: [
		{
			serialize: (object, children) => {
				if (object.type && object.type === 'param') {
					if (object.data.param.name === 'user.listOfTasksCompletedOnDay') {
						return React.createElement(
							React.Fragment,
							null,
							'{{#user.listOfTasksCompletedOnDay.projects.length}}',
							'{{#user.listOfTasksCompletedOnDay.projects}}',
							React.createElement(
								'h3',
								null,
								React.createElement(
									'a',
									{
										style: {
											color: '#ff3366',
											fontWeight: 'normal',
										},
										href: '{{url}}',
									},
									'{{name}}',
								),
							),
							React.createElement(
								'p',
								null,
								'Dans ce projet ',
								'{{user.fullname}}',
								' a termin\xE9 les t\xE2ches suivantes :',
							),
							React.createElement(
								'ul',
								null,
								'{{#sections}}{{#items}}',
								React.createElement('li', null, '{{name}}'),
								'{{/items}}{{/sections}}',
							),
							'{{/user.listOfTasksCompletedOnDay.projects}}',
							'{{/user.listOfTasksCompletedOnDay.projects.length}}',
							React.createElement('br', null),
							'{{#user.listOfTasksCompletedOnDay.tasks.length}}',
							React.createElement(
								'p',
								null,
								'Ces t\xE2ches non li\xE9es \xE0 un projet ont \xE9t\xE9 termin\xE9es :',
							),
							React.createElement(
								'ul',
								null,
								'{{#user.listOfTasksCompletedOnDay.tasks}}',
								React.createElement('li', null, '{{name}}'),
								'{{/user.listOfTasksCompletedOnDay.tasks}}',
							),
							'{{/user.listOfTasksCompletedOnDay.tasks.length}}',
						);
					}

					if (object.data.param.name === 'task.attachments') {
						return React.createElement(
							'ul',
							null,
							'{{#task.attachments}}',
							React.createElement(
								'li',
								null,
								React.createElement(
									'a',
									{
										href: '{{url}}',
									},
									'{{filename}}',
								),
							),
							'{{/task.attachments}}',
						);
					}

					if (object.data.param.name === 'task.listOfAttachmentNotUploaded') {
						return React.createElement(
							'a',
							{
								href: '{{task.link}}',
							},
							'{{#task.listOfAttachmentNotUploaded}}',
							React.createElement(
								'label',
								null,
								React.createElement('input', {
									type: 'checkbox',
								}),
								' ',
								'{{name}}',
							),
							React.createElement('br', null),
							'{{/task.listOfAttachmentNotUploaded}}',
						);
					}

					if (object.data.param.name === 'task.link') {
						return React.createElement(
							'a',
							{
								href: '{{task.link}}',
							},
							'{{task.name}}',
						);
					}

					if (object.data.param.name === 'task.threadOfComments') {
						return React.createElement(
							'ul',
							{
								style: {
									listStyleType: 'none',
									margin: 0,
									padding: 0,
								},
							},
							'{{#task.threadOfComments}}',
							React.createElement(
								'li',
								{
									style: {
										border: 'solid 1px #5020ee',
										padding: '5px 0',
										borderRadius: '3px',
										maxWidth: '700px',
										marginBottom: '10px',
									},
								},
								React.createElement(
									'div',
									{
										style: {
											borderBottom: 'solid 1px #5020ee',
											padding: '0 5px 5px',
										},
									},
									React.createElement(
										'em',
										null,
										'{{author}} le {{createdAt}}',
									),
								),
								React.createElement(
									'div',
									{
										style: {
											padding: '0 5px',
										},
									},
									'{{text}}',
								),
							),
							'{{/task.threadOfComments}}',
						);
					}

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

module.exports = contentSerializer;
