const {verify} = require('jsonwebtoken');
const moment = require('moment');
const {
	rule, shield, and, or, chain,
} = require('graphql-shield');

const {AuthError, PaymentError} = require('./errors');

const {APP_SECRET, ADMIN_TOKEN} = process.env;

const getUserId = (ctx) => {
	const Authorization = ctx.request.get('Authorization');

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');
		const verifiedToken = verify(token, APP_SECRET);

		return verifiedToken.userId;
	}

	return null;
};

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
	if (
		info.operation.name !== undefined
		&& info.operation.name.value === 'login'
	) {
		return true;
	}

	const exists = await ctx.db.$exists.user({id: getUserId(ctx)});

	if (exists) return true;

	return new AuthError();
});

const isPayingOrInTrial = rule()(async (parent, args, ctx, info) => {
	if (
		info.operation.name !== undefined
		&& info.operation.name.value === 'login'
	) {
		return true;
	}

	const user = await ctx.db.user({id: getUserId(ctx)});

	if (
		user.lifetimePayment
		|| moment().diff(moment(user.createdAt), 'days') <= 21
	) {
		return true;
	}

	return new PaymentError();
});

const isAdmin = rule()((parent, {token = null}) => ADMIN_TOKEN === token);

const isCustomer = rule()((parent, {token = null}, ctx) => ctx.db.$exists.customer({token}));

const isItemOwner = and(
	isAuthenticated,
	isPayingOrInTrial,
	rule()((parent, {id}, ctx) => ctx.db.$exists.item({id, owner: {id: getUserId(ctx)}})),
);

const isItemCustomer = rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.item({
	id,
	OR: [
		{
			section: {
				project: {
					OR: [
						{
							token,
						},
						{
							customer: {token},
						},
					],
				},
			},
		},
		{
			linkedCustomer: {token},
		},
	],
}));

const isProjectOwner = and(
	isAuthenticated,
	isPayingOrInTrial,
	rule()((parent, {id}, ctx) => ctx.db.$exists.project({
		id,
		OR: [
			{
				owner: {id: getUserId(ctx)},
			},
			{
				customer: {
					serviceCompany: {
						owner: {id: getUserId(ctx)},
					},
				},
			},
		],
	})),
);

const isCustomerOwner = and(
	isAuthenticated,
	rule()((parent, {id, token}, ctx) => ctx.db.$exists.customer({
		id,
		token,
		serviceCompany: {
			owner: {id: getUserId(ctx)},
		},
	})),
);

const isProjectCustomer = rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.project({
	id,
	OR: [
		{
			customer: {
				token,
			},
		},
		{
			token,
		},
	],
}));

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: or(isAdmin, or(isCustomerOwner, isCustomer)),
			project: or(isAdmin, or(isProjectOwner, isProjectCustomer)),
			item: or(isAdmin, or(isItemOwner, isItemCustomer)),
		},
		User: {
			id: or(isAuthenticated, isItemCustomer, isProjectCustomer),
			email: or(isAuthenticated, isItemCustomer, isProjectCustomer),
			hmacIntercomId: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			firstName: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			lastName: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			workingDays: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			startWorkAt: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			endWorkAt: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			timeZone: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			customers: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			company: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			projects: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			defaultVatRate: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			workingFields: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			jobType: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			interestedFeatures: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			hasUpcomingProject: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			settings: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			tasks: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			focusedTasks: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			notifications: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			tags: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			signedUpAt: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			lifetimePayment: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
			defaultDailyPrice: or(
				chain(isAuthenticated, isPayingOrInTrial),
				isItemCustomer,
				isProjectCustomer,
			),
		},
	},
	{
		allowExternalErrors: true,
		debug: true,
		fallbackError: 'Non autorisé',
	},
);

module.exports = {
	permissions,
};
