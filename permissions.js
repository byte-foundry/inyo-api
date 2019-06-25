const {verify} = require('jsonwebtoken');
const moment = require('moment');
const {
	rule, shield, and, or, not, deny, allow,
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

const isAuthenticated = rule()(async (parent, args, ctx) => {
	const exists = await ctx.db.$exists.user({id: getUserId(ctx)});

	if (exists) return true;

	return new AuthError();
});

const isPayingOrInTrial = rule()(async (parent, args, ctx) => {
	const exists = await ctx.db.$exists.user({id: getUserId(ctx)});

	if (!exists) return new AuthError();

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
		id,
		customer: {
			token,
		},
	})),
);

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: isAuthenticated,
			project: or(isAdmin, or(isProjectOwner, isProjectCustomer)),
			item: or(isAdmin, or(isItemOwner, isItemCustomer)),
		},
		User: {
			id: isAuthenticated,
			email: isAuthenticated,
			firstName: and(isAuthenticated, isPayingOrInTrial),
			lastName: and(isAuthenticated, isPayingOrInTrial),
			customers: and(isAuthenticated, isPayingOrInTrial),
			projects: and(isAuthenticated, isPayingOrInTrial),
			defaultVatRate: and(isAuthenticated, isPayingOrInTrial),
			startWorkAt: and(isAuthenticated, isPayingOrInTrial),
			endWorkAt: and(isAuthenticated, isPayingOrInTrial),
			workingDays: and(isAuthenticated, isPayingOrInTrial),
			timeZone: and(isAuthenticated, isPayingOrInTrial),
			workingFields: and(isAuthenticated, isPayingOrInTrial),
			jobType: and(isAuthenticated, isPayingOrInTrial),
			interestedFeatures: and(isAuthenticated, isPayingOrInTrial),
			hasUpcomingProject: and(isAuthenticated, isPayingOrInTrial),
			settings: and(isAuthenticated, isPayingOrInTrial),
			hmacIntercomId: and(isAuthenticated, isPayingOrInTrial),
			tasks: and(isAuthenticated, isPayingOrInTrial),
			focusedTasks: and(isAuthenticated, isPayingOrInTrial),
			notifications: and(isAuthenticated, isPayingOrInTrial),
			tags: and(isAuthenticated, isPayingOrInTrial),
			signedUpAt: and(isAuthenticated, isPayingOrInTrial),
			lifetimePayment: and(isAuthenticated, isPayingOrInTrial),
			company: and(isAuthenticated, isPayingOrInTrial),
			defaultDailyPrice: and(isAuthenticated, isPayingOrInTrial),
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
