const gql = String.raw;

const {getUserId, getAppUrl} = require('../utils');
const {NotFoundError} = require('../errors');
const {sendMetric} = require('../stats');
const {
	legacy_sendNewCommentEmail, // eslint-disable-line
	sendNewCommentEmail,
} = require('../emails/CommentEmail');

const postComment = async (parent, {itemId, token, comment}, ctx) => {
	if (token) {
		const [item] = await ctx.db.items({
			where: {
				id: itemId,
				section: {
					OR: [{option: {quote: {token}}}, {project: {token}}],
				},
			},
		}).$fragment(gql`
			fragment ItemAndAuthorsForUser on Item {
				id
				name
				section {
					option {
						quote {
							id
							name
							token
							customer {
								id
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
					project {
						id
						name
						token
						customer {
							id
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

		const {project, option} = item.section;
		const {quote} = option || {};
		let customer;

		if (project) {
			({customer} = project);
		}
		else {
			({customer} = quote);
		}

		const user = customer.serviceCompany.owner;

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
				recipientName: String(`${user.firstName} ${user.lastName}`).trim(),
				authorName: String(`${customer.firstName} ${customer.lastName}`).trim(),
				projectName: project ? project.name : quote.name,
				itemName: item.name,
				comment,
			};

			if (project) {
				sendNewCommentEmail({
					...params,
					url: getAppUrl(`/projects/${project.id}/see`),
				});
			}
			else {
				legacy_sendNewCommentEmail({
					...params,
					quoteUrl: getAppUrl(`/quotes/${quote.id}/see`),
				});
			}

			console.log(`New comment email sent to ${user.email}`);
		}
		catch (error) {
			console.log(`New comment email not because with error ${error}`);
		}

		sendMetric({metric: 'inyo.comment.postedByCustomer'});

		return result;
	}

	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			id: itemId,
			section: {
				OR: [
					{
						option: {
							quote: {customer: {serviceCompany: {owner: {id: userId}}}},
						},
					},
					{
						project: {customer: {serviceCompany: {owner: {id: userId}}}},
					},
				],
			},
		},
	}).$fragment(gql`
		fragment ItemAndAuthorsForCustomer on Item {
			id
			name
			section {
				option {
					quote {
						id
						name
						token
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
				project {
					id
					name
					token
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

	const {project, option} = item.section;
	const {quote} = option || {};
	let customer;

	if (project) {
		({customer} = project);
	}
	else {
		({customer} = quote);
	}

	const user = customer.serviceCompany.owner;

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
			recipientName: String(
				`${customer.firstName} ${customer.lastName}`,
			).trim(),
			authorName: String(`${user.firstName} ${user.lastName}`).trim(),
			projectName: project ? project.name : quote.name,
			itemName: item.name,
			comment,
		};

		if (project) {
			await sendNewCommentEmail({
				...params,
				url: getAppUrl(`/projects/${project.id}/view/${project.token}`),
			});
		}
		else {
			await legacy_sendNewCommentEmail({
				...params,
				quoteUrl: getAppUrl(`/quotes/${quote.id}/view/${quote.token}`),
			});
		}

		console.log(`New comment email sent to ${customer.email}`);
	}
	catch (error) {
		console.log(`New comment email not because with error ${error}`);
	}

	sendMetric({metric: 'inyo.comment.postedByUser'});

	return result;
};

module.exports = {
	postComment,
};
