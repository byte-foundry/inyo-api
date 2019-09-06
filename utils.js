const {verify} = require('jsonwebtoken');

const {AuthError} = require('./errors');

const {APP_SECRET} = process.env;

function getUserId(context) {
	const Authorization = context.request.get('Authorization');

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');
		const verifiedToken = verify(token, APP_SECRET);

		return verifiedToken && verifiedToken.userId;
	}

	throw new AuthError();
}

function getRootUrl(uri) {
	if (process.env.NODE_ENV === 'development') {
		return `https://dev.inyo.me${uri}`;
	}

	return `https://app.inyo.me${uri}`;
}

function getAppUrl(uri) {
	return getRootUrl(`/app${uri}`);
}

const normalizeFalsyParams = f => (...args) => f(...args.map(v => v || undefined));

const formatTitle = (title) => {
	if (title === 'MONSIEUR') {
		return 'M.';
	}

	if (title === 'MADAME') {
		return 'Mme';
	}

	return '';
};

const formatName = normalizeFalsyParams((firstName = '', lastName = '') => `${firstName} ${lastName}`.trim());

const formatFullName = normalizeFalsyParams(
	(title = '', firstName = '', lastName = '') => `${formatTitle(title)} ${formatName(firstName, lastName)}`.trim(),
);

const createItemOwnerFilter = ownerId => ({
	OR: [
		{
			owner: {id: ownerId},
		},
		{
			section: {
				project: {
					OR: [
						{
							owner: {id: ownerId},
						},
						{
							customer: {
								serviceCompany: {
									owner: {id: ownerId},
								},
							},
						},
					],
				},
			},
		},
	],
});

const createItemCollaboratorFilter = id => ({
	assignee: {id},
});

const isCustomerTask = task => [
	'CUSTOMER',
	'CONTENT_ACQUISITION',
	'INVOICE',
	'CUSTOMER_REMINDER',
	'VALIDATION',
].includes(task.type);

const filterDescription = description => description.split(/# content-acquisition-list[\s\S]+/).join('');

const reorderList = async (list, position, nextPosition, updateItem) => {
	const initialPosition = typeof position === 'number' ? position : list.length;
	const wantedPosition
		= typeof nextPosition === 'number' ? nextPosition : list.length;

	const itemsToUpdate
		= wantedPosition > initialPosition
			? list.slice(initialPosition + 1, wantedPosition + 1)
			: list.slice(wantedPosition, initialPosition);

	const startIndex
		= wantedPosition > initialPosition ? initialPosition : wantedPosition + 1;

	await Promise.all(
		itemsToUpdate.map((item, index) => updateItem(item, startIndex + index, initialPosition)),
	);
};

const TAG_COLOR_PALETTE = [
	[[244, 67, 54], [255, 255, 255]],
	[[233, 30, 99], [255, 255, 255]],
	[[156, 39, 176], [255, 255, 255]],
	[[103, 58, 183], [255, 255, 255]],
	[[63, 81, 181], [255, 255, 255]],
	[[33, 150, 243], [255, 255, 255]],
	[[3, 169, 244], [255, 255, 255]],
	[[0, 188, 212], [255, 255, 255]],
	[[0, 150, 136], [255, 255, 255]],
	[[76, 175, 80], [255, 255, 255]],
	[[139, 195, 74], [255, 255, 255]],
	[[205, 220, 57], [51, 51, 51]],
	[[255, 235, 59], [51, 51, 51]],
	[[255, 193, 7], [51, 51, 51]],
	[[255, 152, 0], [255, 255, 255]],
	[[255, 87, 34], [255, 255, 255]],
	[[121, 85, 72], [255, 255, 255]],
	[[158, 158, 158], [255, 255, 255]],
	[[96, 125, 139], [255, 255, 255]],
];

module.exports = {
	getUserId,
	APP_SECRET,
	getRootUrl,
	getAppUrl,
	formatTitle,
	formatName,
	formatFullName,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
	isCustomerTask,
	filterDescription,
	reorderList,
	TAG_COLOR_PALETTE,
};
