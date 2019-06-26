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

const isItemCustomer = and(
	isCustomer,
	rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.item({
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
	})),
);

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

const isProjectCustomer = and(
	isCustomer,
	rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.project({
		AND: [
			{
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

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: or(isAdmin, or(isCustomerOwner, isCustomer)),
			project: or(isAdmin, or(isProjectOwner, isProjectCustomer)),
			item: or(isAdmin, or(isItemOwner, isItemCustomer)),
		},
		User: {
			id: isAuthenticated,
			email: or(isAuthenticated, isItemCustomer, isProjectCustomer),
			hmacIntercomId: chain(isAuthenticated, isPayingOrInTrial),
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
			workingDays: chain(isAuthenticated, isPayingOrInTrial),
			startWorkAt: chain(isAuthenticated, isPayingOrInTrial),
			endWorkAt: chain(isAuthenticated, isPayingOrInTrial),
			timeZone: chain(isAuthenticated, isPayingOrInTrial),
			customers: chain(isAuthenticated, isPayingOrInTrial),
			company: chain(isAuthenticated, isPayingOrInTrial),
			projects: chain(isAuthenticated, isPayingOrInTrial),
			defaultVatRate: chain(isAuthenticated, isPayingOrInTrial),
			workingFields: chain(isAuthenticated, isPayingOrInTrial),
			jobType: chain(isAuthenticated, isPayingOrInTrial),
			interestedFeatures: chain(isAuthenticated, isPayingOrInTrial),
			hasUpcomingProject: chain(isAuthenticated, isPayingOrInTrial),
			settings: chain(isAuthenticated, isPayingOrInTrial),
			tasks: chain(isAuthenticated, isPayingOrInTrial),
			focusedTasks: chain(isAuthenticated, isPayingOrInTrial),
			notifications: chain(isAuthenticated, isPayingOrInTrial),
			tags: chain(isAuthenticated, isPayingOrInTrial),
			signedUpAt: chain(isAuthenticated, isPayingOrInTrial),
			lifetimePayment: chain(isAuthenticated, isPayingOrInTrial),
			defaultDailyPrice: chain(isAuthenticated, isPayingOrInTrial),
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
