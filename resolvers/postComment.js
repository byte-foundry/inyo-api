const gql = String.raw;

const {
	getUserId,
	getAppUrl,
	formatFullName,
	formatName,
	createItemOwnerFilter,
	createItemCollaboratorFilter,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendNewCommentEmail} = require('../emails/CommentEmail');

const postComment = async (parent, {itemId, comment}, ctx) => {
	const {token} = ctx;

	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id: itemId,
				type_not: 'PERSONAL',
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
			},
		}).$fragment(gql`
			fragment ItemAndAuthorsForUser on Item {
				id
				name
				owner {
					id
					email
					firstName
					lastName
				}
				assignee {
					id
					email
					firstName
					lastName
				}
				linkedCustomer {
					id
					firstName
					lastName
					email
				}
				section {
					project {
						id
						token
						customer {
							id
							title
							firstName
							lastName
							email
							token
						}
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${itemId}' has not been found`);
		}

		const user = item.owner;

		let customer = item.linkedCustomer;

		if (item.section) {
			const {project} = item.section;

			if (project.customer && project.customer.token === token) {
				({customer} = project);
			}
		}

		if (!customer) {
			throw new NotFoundError('Your token is invalid');
		}

		const result = await ctx.db.createComment({
			item: {connect: {id: itemId}},
			text: comment.text,
			authorCustomer: {
				connect: {id: customer.id},
			},
			views: {
				create: {
					customer: {
						connect: {id: customer.id},
					},
				},
			},
		});

		const params = {
			authorName: formatFullName(
				customer.title,
				customer.firstName,
				customer.lastName,
			),
			userName: formatName(user.firstName, user.lastName),
			itemName: item.name,
			comment,
			url: getAppUrl(`/tasks/${item.id}`),
		};

		try {
			await sendNewCommentEmail(
				{
					meta: {
						userId: user.id,
					},
					email: user.email,
					commentId: result.id,
					authorId: customer.id,
					recipientId: user.id,
					authorIsUser: false,
					recipientIsUser: true,
					taskId: item.id,
					userId: user.id,
					projectId: item.section && item.section.project.id,
				},
				ctx,
			);

			console.log(`New comment email sent to ${user.email}`);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		// notify collaborator
		if (item.assignee) {
			try {
				await sendNewCommentEmail(
					{
						meta: {
							userId: user.id,
						},
						email: item.assignee.email,
						commentId: result.id,
						recipientId: item.assignee.id,
						authorId: customer.id,
						authorIsUser: false,
						recipientIsUser: true,
						taskId: item.id,
						userId: user.id,
						projectId: item.section && item.section.project.id,
					},
					ctx,
				);

				console.log(`New comment email sent to ${item.assignee.email}`);
			}
			catch (error) {
				console.log(`New comment email not because with error ${error}`);
			}
		}

		await ctx.db.createCustomerEvent({
			type: 'POSTED_COMMENT',
			customer: {
				connect: {id: customer.id},
			},
			metadata: {
				itemId,
				commentId: result.id,
			},
			notifications: {
				create: {
					user: {connect: {id: user.id}},
				},
			},
			comment: {
				connect: {id: result.id},
			},
			project: item.section && {connect: {id: item.section.project.id}},
		});

		// TODO: should return the comment instead
		return ctx.db.item({id: itemId});
	}

	const {userId} = ctx;
	const [item] = await ctx.db.items({
		where: {
			AND: [
				{id: itemId},
				{
					OR: [
						createItemOwnerFilter(userId),
						createItemCollaboratorFilter(userId),
					],
				},
			],
		},
	}).$fragment(gql`
		fragment ItemAndAuthorsForCustomer on Item {
			id
			name
			type
			owner {
				id
				firstName
				lastName
				email
			}
			assignee {
				id
				firstName
				lastName
				email
			}
			linkedCustomer {
				id
				token
				firstName
				lastName
				email
			}
			section {
				project {
					id
					name
					notifyActivityToCustomer
					owner {
						firstName
						lastName
						email
					}
					customer {
						id
						token
						firstName
						lastName
						email
						serviceCompany {
							owner {
								firstName
								lastName
								email
							}
						}
					}
				}
			}
		}
	`);

	if (!item) {
		throw new NotFoundError(`Item '${itemId}' has not been found.`);
	}

	if (item.type === 'PERSONAL') {
		throw new Error('Commenting on personal tasks is not allowed.');
	}

	let user = item.owner;

	if (item.section) {
		const {project} = item.section;
		const customer = item.linkedCustomer || project.customer;

		user = user || project.owner || customer.serviceCompany.owner;
	}

	const result = await ctx.db.createComment({
		item: {connect: {id: itemId}},
		text: comment.text,
		authorUser: {
			connect: {id: userId},
		},
		views: {
			create: {
				user: {
					connect: {id: userId},
				},
			},
		},
	});

	if (item.section) {
		const {assignee, linkedCustomer, section} = item;

		// notify collaborator or owner
		if (assignee) {
			const author = assignee.id === userId ? assignee : user;
			const userToNotify = assignee.id === userId ? user : assignee;

			try {
				await sendNewCommentEmail(
					{
						meta: {
							userId: user.id,
						},
						email: userToNotify.email,
						commentId: result.id,
						authorId: author.id,
						recipientId: userToNotify.id,
						taskId: item.id,
						projectId: item.section && item.section.project.id,
						userId: user.id,
						authorIsUser: true,
						recipientIsUser: true,
					},
					ctx,
				);

				console.log(`New comment email sent to ${userToNotify.email}`);
			}
			catch (error) {
				console.log(`New comment email not because with error ${error}`);
			}
		}

		if (section.project.notifyActivityToCustomer) {
			const {customer} = section.project;

			// send to project customer
			if (customer) {
				try {
					await sendNewCommentEmail(
						{
							meta: {
								userId: user.id,
							},
							email: customer.email,
							commentId: result.id,
							authorId: user.id,
							recipientId: customer.id,
							taskId: item.id,
							projectId: item.section && item.section.project.id,
							userId: user.id,
							authorIsUser: true,
							recipientIsUser: false,
						},
						ctx,
					);
				}
				catch (error) {
					console.log(`New comment email not because with error ${error}`);
				}

				console.log(`New comment email sent to ${customer.email}`);
			}

			// send to linked
			if (linkedCustomer) {
				try {
					await sendNewCommentEmail(
						{
							meta: {
								userId: user.id,
							},
							email: linkedCustomer.email,
							commentId: result.id,
							authorId: user.id,
							recipientId: linkedCustomer.id,
							taskId: item.id,
							projectId: item.section && item.section.project.id,
							userId: user.id,
							authorIsUser: true,
							recipientIsUser: false,
						},
						ctx,
					);

					console.log(`New comment email sent to ${linkedCustomer.email}`);
				}
				catch (error) {
					console.log(`New comment email not because with error ${error}`);
				}
			}
		}
	}
	else if (!item.section && item.linkedCustomer) {
		const {linkedCustomer} = item;

		// send to linked
		try {
			await sendNewCommentEmail(
				{
					meta: {
						userId: user.id,
					},
					email: linkedCustomer.email,
					commentId: comment.id,
					authorId: user.id,
					recipientId: linkedCustomer.id,
					taskId: item.id,
					projectId: item.section && item.section.project.id,
					userId: user.id,
					authorIsUser: true,
					recipientIsUser: false,
				},
				ctx,
			);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		console.log(`New comment email sent to ${linkedCustomer.email}`);
	}

	await ctx.db.createUserEvent({
		type: 'POSTED_COMMENT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			itemId,
		},
		notifications: item.assignee && {
			create: {
				user: {
					connect: {
						id: userId === item.assignee.id ? item.owner.id : item.assignee.id,
					},
				},
			},
		},
		comment: {
			connect: {id: result.id},
		},
		project: item.section && {connect: {id: item.section.project.id}},
	});

	// TODO: should return the comment instead
	return ctx.db.item({id: itemId});
};

module.exports = {
	postComment,
};
