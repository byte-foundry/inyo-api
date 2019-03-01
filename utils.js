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

	return `https://beta.inyo.me${uri}`;
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

module.exports = {
	getUserId,
	APP_SECRET,
	getRootUrl,
	getAppUrl,
	formatTitle,
	formatName,
	formatFullName,
	createItemOwnerFilter,
};
