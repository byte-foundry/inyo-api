const JSON = require('jsdom');
const React = require('react');
const Html = require('slate-html-serializer').default;

const contentSerializer = new Html({
	rules: [
		{
			serialize: (object, children) => {
				if (object.type && object.type === 'param') {
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
							null,
							'{{#task.threadOfComments}}',
							React.createElement(
								'li',
								null,
								React.createElement(
									'div',
									null,
									React.createElement(
										'em',
										null,
										'{{author}} le {{createdAt}}',
									),
								),
								React.createElement('div', null, '{{text}}'),
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
