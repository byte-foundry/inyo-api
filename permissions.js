const moment = require('moment');
const {
	rule, shield, and, or, chain,
} = require('graphql-shield');

const {AuthError, PaymentError} = require('./errors');

const {ADMIN_TOKEN} = process.env;

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
	if (ctx.token) {
		return new AuthError();
	}

	if (
		info.operation.name !== undefined
		&& (info.operation.name.value === 'login'
			|| info.operation.name.value === 'signup'
			|| info.operation.name.value === 'resetPassword'
			|| info.operation.name.value === 'updatePassword')
	) {
		return true;
	}

	const exists = await ctx.db.$exists.user({id: ctx.userId});

	if (exists) return true;

	return new AuthError();
});

const isPayingOrInTrial = rule()(async (parent, args, ctx, info) => {
	if (ctx.token) {
		return new AuthError();
	}

	if (
		info.operation.name !== undefined
		&& (info.operation.name.value === 'login'
			|| info.operation.name.value === 'signup'
			|| info.operation.name.value === 'resetPassword'
			|| info.operation.name.value === 'updatePassword')
	) {
		return true;
	}

	const user = await ctx.db.user({id: ctx.userId});

	if (
		user.lifetimePayment
		|| moment().diff(moment(user.createdAt), 'days') < 21
	) {
		return true;
	}

	return new PaymentError();
});

const isAdmin = rule()(
	(parent, {token = null}, ctx) => ADMIN_TOKEN === token || ADMIN_TOKEN === ctx.token,
);

const isCustomer = rule()((parent, {token = null}, ctx) => ctx.db.$exists.customer({token}));

const isItemOwner = and(
	isAuthenticated,
	isPayingOrInTrial,
	rule()((parent, {id}, ctx) => ctx.db.$exists.item({id, owner: {id: ctx.userId}})),
);

const isItemCollaborator = and(
	isAuthenticated,
	isPayingOrInTrial,
	rule()((parent, {id}, ctx) => ctx.db.$exists.item({id, assignee: {id: ctx.userId}})),
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
				owner: {id: ctx.userId},
			},
			{
				customer: {
					serviceCompany: {
						owner: {id: ctx.userId},
					},
				},
			},
		],
	})),
);

const isProjectCollaborator = and(
	isAuthenticated,
	isPayingOrInTrial,
	rule()((parent, {id}, ctx) => ctx.db.$exists.project({
		id,
		linkedCollaborators_some: {id: ctx.userId},
	})),
);

const isCustomerOwner = and(
	isAuthenticated,
	rule()((parent, {id, token}, ctx) => ctx.db.$exists.customer({
		id,
		token,
		serviceCompany: {
			owner: {id: ctx.userId},
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

const isUserCustomer = rule()(async (parent, args, ctx) => {
	const hasProjects = await ctx.db.$exists.project({
		owner: {
			id: parent.id,
		},
		OR: [
			{
				token: ctx.token,
			},
			{
				customer: {
					token: ctx.token,
				},
			},
		],
	});
	const hasTasks = await ctx.db.$exists.item({
		owner: {
			id: parent.id,
		},
		OR: [
			{
				linkedCustomer: {
					token: ctx.token,
				},
			},
		],
	});

	return hasTasks || hasProjects;
});

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: or(isAdmin, isCustomerOwner, isCustomer),
			project: or(
				isAdmin,
				isProjectOwner,
				isProjectCustomer,
				isProjectCollaborator,
			),
			item: or(isAdmin, isItemOwner, isItemCustomer, isItemCollaborator),
		},
		User: {
			id: or(isAdmin, isAuthenticated, isUserCustomer),
			email: or(isAdmin, isAuthenticated, isUserCustomer),
			lastName: or(isAdmin, isAuthenticated, isUserCustomer),
			firstName: or(isAdmin, isAuthenticated, isUserCustomer),
			'*': or(isAdmin, chain(isAuthenticated, isPayingOrInTrial)),
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
