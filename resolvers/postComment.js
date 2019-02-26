const gql = String.raw;

const {
	getUserId,
	getAppUrl,
	formatFullName,
	formatName,
	createItemOwnerFilter,
} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendNewCommentEmail} = require('../emails/CommentEmail');

const postComment = async (parent, {itemId, token, comment}, ctx) => {
	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id: itemId,
				OR: [
					{
						section: {
							project: {token},
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
					email
					firstName
					lastName
				}
				customer {
					firstName
					lastName
					email
				}
				section {
					project {
						token
						customer {
							firstName
							lastName
							email
							serviceCompany {
								owner {
									email
									firstName
									lastName
								}
							}
						}
					}
				}
			}
		`);

		if (!item) {
			throw new NotFoundError(`Item '${itemId}' has not been found`);
		}

		let user;
		let customer;

		if (item.section) {
			const {project} = item.section;

			user = customer.serviceCompany.owner;
			({customer} = project);
		}
		else {
			user = item.owner;
			customer = item.linkedCustomer;
		}

		const result = ctx.db.updateItem({
			where: {id: itemId},
			data: {
				comments: {
					create: {
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
					},
				},
			},
		});

		try {
			const params = {
				email: user.email,
				recipientName: formatName(user.firstName, user.lastName),
				authorName: formatFullName(
					customer.title,
					customer.firstName,
					customer.lastName,
				),
				itemName: item.name,
				comment,
			};

			sendNewCommentEmail({
				...params,
				url: getAppUrl(`/tasks/${item.id}`),
			});

			console.log(`New comment email sent to ${user.email}`);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		return result;
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			AND: [{id: itemId}, createItemOwnerFilter(userId)],
		},
	}).$fragment(gql`
		fragment ItemAndAuthorsForCustomer on Item {
			id
			name
			owner {
				firstName
				lastName
				email
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
					name
					token
					notifyActivityToCustomer
					customer {
						id
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

	let user;
	let customer;

	if (item.section) {
		const {project} = item.section;

		user = customer.serviceCompany.owner;
		({customer} = project);
	}
	else {
		user = item.owner;
		customer = item.linkedCustomer;
	}

	const result = ctx.db.updateItem({
		where: {id: itemId},
		data: {
			comments: {
				create: {
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
				},
			},
		},
	});

	try {
		const params = {
			email: customer.email,
			recipientName: formatFullName(
				customer.title,
				customer.firstName,
				customer.lastName,
			),
			authorName: formatName(user.firstName, user.lastName),
			itemName: item.name,
			comment,
		};

		if (!item.section || !item.section.project.notifyActivityToCustomer) {
			const customerToken = (item.section && item.section.project.token) || '';

			await sendNewCommentEmail({
				...params,
				url: getAppUrl(`/tasks/${item.id}?token=${customerToken}`),
			});

			console.log(`New comment email sent to ${customer.email}`);
		}
	}
	catch (error) {
		console.log(`New comment email not because with error ${error}`);
	}

	return result;
};

module.exports = {
	postComment,
};
