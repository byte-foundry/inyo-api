const JSON = require('jsdom');
const React = require('react');
const Html = require('slate-html-serializer').default;

const contentSerializer = new Html({
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

module.exports = contentSerializer;
