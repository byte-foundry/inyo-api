class AuthError extends Error {
	constructor() {
		super('Not authorized');
	}
}

function getUserId(context) {
	const Authorization = context.request.get('Authorization');

	if (Authorization) {
		return Authorization.replace('Bearer ', '');
	}

	throw new AuthError();
}

function getAppUrl(uri) {
	return uri;
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

const isCustomerTask = task => [
	'CUSTOMER',
	'CONTENT_ACQUISITION',
	'CUSTOMER_REMINDER',
	'VALIDATION',
].includes(task.type);

module.exports = {
	getUserId,
	getAppUrl,
	APP_SECRET: 'Z',
	formatTitle,
	formatName,
	formatFullName,
	createItemOwnerFilter,
	isCustomerTask,
};
