const gql = String.raw;
const hogan = require('hogan.js');
const {verify} = require('jsonwebtoken');
const moment = require('moment');

const {AuthError} = require('./errors');
const {contentSerializer, subjectSerializer} = require('./emails/serializers');

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

const ensureKeyOrder = (
	keys,
	docs,
	error = key => `Document does not exist for ${key}`,
	keyName = 'id',
) => {
	const docsMap = new Map();

	docs.forEach(doc => docsMap.set(doc[keyName], doc));

	return keys.map(key => docsMap.get(key) || new Error(error(key)));
};

const createCustomEmailArguments = async ({
	taskId,
	projectId,
	userId,
	customerId,
	commentId,
	authorId,
	recipientId,
	recipientIsUser,
	authorIsUser,
	ctx,
}) => {
	const emailArgs = {};

	if (taskId) {
		const task = await ctx.db.item({id: taskId}).$fragment(gql`
			fragment TaskWithCommentAndAttachements on Item {
				id
				name
				description
				attachments {
					filename
					url
				}
				comments {
					authorUser {
						firstName
						lastName
					}
					authorCustomer {
						title
						firstName
						lastName
					}
					text
					createdAt
				}
			}
		`);

		emailArgs.task = {
			name: task.name,
			description: task.description,
			attachments: task.attachments,
			listOfAttachmentNotUploaded: '',
			threadOfComments: task.comments.map(c => ({
				text: c.text,
				author: c.authorUser
					? formatName(c.authorUser.firstName, c.authorUser.lastName)
					: formatFullName(
						c.authorCustomer.title,
						c.authorCustomer.firstName,
						c.authorCustomer.lastName,
					  ),
				createdAt: moment(c.createdAt).format('DD/MM/YYYY à HHhMM'),
			})),
		};
	}

	if (projectId) {
		const project = await ctx.db.project({id: projectId});

		emailArgs.project = {
			name: project.name,
			deadline: project.deadline
				? moment(project.deadline).format('DD/MM/YYYY')
				: '',
			budget: `${project.budget}€`,
		};
	}

	if (userId) {
		const user = await ctx.db.user({id: userId}).$fragment(gql`
			fragment UserWithCompany on User {
				id
				firstName
				lastName
				email
				company {
					id
					phone
				}
			}
		`);

		emailArgs.user = {
			firstname: user.firstName,
			lastname: user.lastName,
			fullname: formatName(user.firstName, user.lastName),
			phone: user.company.phone,
			email: user.email,
			listOfTasksCompletedOnDay: 'listoftasks',
		};
	}

	if (customerId) {
		const customer = await ctx.db.customer({id: customerId});

		emailArgs.customer = {
			firstname: customer.firstName,
			lastname: customer.lastName,
			fullname: formatFullName(
				customer.title,
				customer.firstName,
				customer.lastName,
			),
			phone: customer.phone,
			email: customer.email,
		};

		if (taskId) {
			emailArgs.task.link = getAppUrl(`/${customer.token}/tasks/${taskId}`);
		}

		if (taskId && projectId) {
			emailArgs.task.link = getAppUrl(
				`/${customer.token}/tasks/${taskId}?projectId=${projectId}`,
			);
		}

		if (projectId) {
			emailArgs.task.link = getAppUrl(
				`/${customer.token}/tasks?projectId=${projectId}`,
			);
		}
	}

	if (commentId) {
		const comment = await ctx.db.comment({id: commentId});

		emailArgs.comment = {
			text: comment.text,
			createdAt: moment(comment.createdAt).format('DD/MM/YYYY'),
		};
	}

	if (authorId) {
		if (authorIsUser) {
			const user = await ctx.db.user({id: authorId}).$fragment(gql`
				fragment UserWithCompany on User {
					id
					firstName
					lastName
					email
					company {
						id
						phone
					}
				}
			`);

			emailArgs.author = {
				firstname: user.firstName,
				lastname: user.lastName,
				fullname: formatName(user.firstName, user.lastName),
				phone: user.company.phone,
				email: user.email,
			};
		}
		else {
			const customer = await ctx.db.customer({id: authorId});

			emailArgs.author = {
				firstname: customer.firstName,
				lastname: customer.lastName,
				fullname: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				phone: customer.phone,
				email: customer.email,
			};
		}
	}

	if (recipientId) {
		if (recipientIsUser) {
			const user = await ctx.db.user({id: recipientId}).$fragment(gql`
				fragment UserWithCompany on User {
					id
					firstName
					lastName
					email
					company {
						id
						phone
					}
				}
			`);

			emailArgs.recipient = {
				firstname: user.firstName,
				lastname: user.lastName,
				fullname: formatName(user.firstName, user.lastName),
				phone: user.company.phone,
				email: user.email,
			};

			if (taskId) {
				emailArgs.task.link = getAppUrl(`/tasks/${taskId}`);
			}

			if (taskId && projectId) {
				emailArgs.task.link = getAppUrl(
					`/tasks/${taskId}?projectId=${projectId}`,
				);
			}
		}
		else {
			const customer = await ctx.db.customer({id: recipientId});

			emailArgs.recipient = {
				firstname: customer.firstName,
				lastname: customer.lastName,
				fullname: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				phone: customer.phone,
				email: customer.email,
			};

			if (taskId) {
				emailArgs.task.link = getAppUrl(`/${customer.token}/tasks/${taskId}`);
			}

			if (taskId && projectId) {
				emailArgs.task.link = getAppUrl(
					`/${customer.token}/tasks/${taskId}?projectId=${projectId}`,
				);
			}
		}
	}

	return emailArgs;
};

const renderTemplate = async ({
	template,
	taskId,
	projectId,
	userId,
	customerId,
	commentId,
	authorId,
	recipientId,
	recipientIsUser,
	authorIsUser,
	ctx,
}) => {
	const emailArgs = await createCustomEmailArguments({
		taskId,
		projectId,
		userId,
		customerId,
		commentId,
		authorId,
		recipientId,
		recipientIsUser,
		authorIsUser,
		ctx,
	});

	const htmlSubject = subjectSerializer.serialize(template.subject);
	const htmlContent = contentSerializer.serialize(template.content);

	const compiledSubject = hogan.compile(htmlSubject);
	const compiledContent = hogan.compile(htmlContent);

	const renderedSubject = compiledSubject.render(emailArgs);
	const renderedContent = compiledContent.render(emailArgs);

	return [renderedSubject, renderedContent, emailArgs];
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
	ensureKeyOrder,
	createCustomEmailArguments,
	TAG_COLOR_PALETTE,
	renderTemplate,
};
