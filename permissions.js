const {
	rule, shield, and, or, chain,
} = require('graphql-shield');

const {AuthError, PaymentError} = require('./errors');

const {ADMIN_TOKEN} = process.env;

const isAuthenticated = rule()((parent, args, ctx, info) => {
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

	if (ctx.isAuthenticated) return true;

	return new AuthError();
});

const isPayingOrInTrial = rule()((parent, args, ctx, info) => {
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

	if (ctx.isPayingOrInTrial) {
		return true;
	}

	return new PaymentError();
});

const isAdmin = rule()((parent, args, ctx) => ADMIN_TOKEN === ctx.token);

const hasToken = rule()((parent, args, {token = null}) => !!token);

const isCustomer = rule()(async (parent, args, ctx) => {
	try {
		const customer = await ctx.loaders.customerTokenLoader.load(ctx.token);

		return !!customer;
	}
	catch (err) {
		return false;
	}
});

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

const isItemCustomer = rule()(async (parent, {id}, ctx) => ctx.db.$exists.item({
	id,
	OR: [
		{
			section: {
				project: {
					OR: [
						{
							token: ctx.token,
						},
						{
							customer: {token: ctx.token},
						},
					],
				},
			},
		},
		{
			linkedCustomer: {token: ctx.token},
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
	rule()((parent, {id}, ctx) => ctx.db.$exists.customer({
		id,
		token: ctx.token,
		serviceCompany: {
			owner: {id: ctx.userId},
		},
	})),
);

const isProjectCustomer = rule()(async (parent, {id}, ctx) => ctx.db.$exists.project({
	id,
	OR: [
		{
			customer: {
				token: ctx.token,
			},
		},
		{
			token: ctx.token,
		},
	],
}));

const customerCanSeeContractors = rule()(async (parent, args, ctx) => {
	try {
		const projects = await ctx.loaders.projectTokenLoader.load(ctx.token);

		return projects.some(
			project => project.owner.id === parent.id
				|| project.linkedCollaborators.some(c => c.id === parent.id),
		);
	}
	catch (err) {
		return false;
	}
});

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: or(isAdmin, isCustomerOwner, isCustomer),
			emailTypes: isAuthenticated,
			emailTemplate: isAuthenticated,
			item: or(isAdmin, isItemOwner, isItemCustomer, isItemCollaborator),
			project: or(
				isAdmin,
				isProjectOwner,
				isProjectCustomer,
				isProjectCollaborator,
			),
		},
		User: {
			id: or(
				isAdmin,
				isAuthenticated,
				chain(hasToken, customerCanSeeContractors),
			),
			email: or(
				isAdmin,
				isAuthenticated,
				chain(hasToken, customerCanSeeContractors),
			),
			lastName: or(
				isAdmin,
				isAuthenticated,
				chain(hasToken, customerCanSeeContractors),
			),
			firstName: or(
				isAdmin,
				isAuthenticated,
				chain(hasToken, customerCanSeeContractors),
			),
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
