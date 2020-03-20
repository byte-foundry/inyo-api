const gql = String.raw;
const {getUserId, createItemOwnerFilter} = require('../utils');

const {createTemplate} = require('../emails/templates');
const {tasks} = require('./tasks');
const {activity} = require('./activity');
const {plannedWorkingTimes} = require('./plannedWorkingTimes');
const {reminders} = require('./reminders');

const Query = {
	me: async (root, args, ctx) => {
		await ctx.db.createUserEvent({
			type: 'ME_CALL',
			user: {
				connect: {id: getUserId(ctx)},
			},
		});
		const user = await ctx.db.user({id: getUserId(ctx)}).$fragment(gql`
			fragment UserWithTag on User {
				id
				email
				hmacIntercomId
				password
				firstName
				lastName
				startWorkAt
				endWorkAt
				startBreakAt
				endBreakAt
				workingDays
				timeZone
				workingFields
				otherSkill
				skills
				otherPain
				painsExpressed
				canBeContacted
				jobType
				interestedFeatures
				hasUpcomingProject
				createdAt
				updatedAt
				company {
					id
					customers {
						id
					}
				}
				tags {
					id
				}
				lifetimePayment
				quoteNumber
			}
		`);
		const projects = await ctx.db.projects({
			where: {
				NOT: {status: 'REMOVED'},
				OR: [
					{
						owner: {id: user.id},
					},
					{
						customer: {
							serviceCompany: {
								owner: {id: user.id},
							},
						},
					},
				],
			},
		}).$fragment(gql`
			fragment UserProjectsWithId on Project {
				id
			}
		`);

		user.projects = projects;
		return user;
	},
	customer: (root, {id}, ctx) => ctx.db.customer({id, token: ctx.token}),
	project: async (root, {id}, ctx) => {
		const {token} = ctx;
		const project = await ctx.db.project({id});

		if (token && token !== process.ADMIN_TOKEN) {
			if (!project.viewedByCustomer) {
				await ctx.db.updateProject({
					where: {id},
					data: {viewedByCustomer: true},
				});

				project.viewedByCustomer = true;
			}

			const hasCustomer = await ctx.db.$exists.customer({token});

			if (hasCustomer) {
				await ctx.db.createCustomerEvent({
					type: 'VIEWED_PROJECT',
					customer: {
						connect: {token},
					},
					metadata: {
						projectId: project.id,
					},
					project: {connect: {id: project.id}},
				});
			}
		}

		return project;
	},
	emailTypes: (root, args, ctx) => ctx.db.emailTypes(),
	emailTemplate: async (root, {typeName, category}, ctx) => {
		const [template] = await ctx.db.emailTemplates({
			where: {
				type: {
					category,
					name: typeName,
				},
				owner: {
					id: ctx.userId,
				},
			},
		});

		if (!template) {
			const [type] = await ctx.db.emailTypes({
				where: {
					category,
					name: typeName,
				},
			});

			return createTemplate(ctx, ctx.userId, type, ctx.language);
		}

		return template;
	},
	quote: async (root, {id}, ctx) => {
		const quote = await ctx.db.quote({id}).$fragment(gql`
			fragment quoteWithRelationsId on Quote {
				id
				issueNumber
				header
				footer
				hasTaxes
				taxRate
				invalid
				validQuote {
					id
					issueNumber
				}
				sections {
					id
				}
				project {
					id
					customer {
						id
					}
					owner {
						id
					}
				}
				acceptedAt
				createdAt
			}
		`);

		if (!ctx.userId || ctx.userId !== quote.project.owner.id) {
			await ctx.db.createCustomerEvent({
				type: 'VIEWED_QUOTE',
				customer: {connect: {id: quote.project.customer.id}},
				metadata: {projectId: quote.project.id, quoteId: id},
				notifications: {
					create: {
						user: {connect: {id: quote.project.owner.id}},
					},
				},
				quote: {connect: {id}},
				project: {
					connect: {
						id: quote.project.id,
					},
				},
			});
		}

		return quote;
	},
	item: async (root, {id, token, updateCommentViews}, ctx) => {
		if (updateCommentViews) {
			if (token) {
				const comments = await ctx.db.comments({
					where: {
						item: {
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
						},
					},
				}).$fragment(gql`
					fragment CommentWithViews on Comment {
						id
						text
						createdAt
						views {
							id
							customer {
								id
								token
							}
						}
					}
				`);

				const [customer] = await ctx.db.customers({
					where: {
						OR: [
							{
								projects_some: {
									token,
								},
							},
							{
								token,
							},
						],
					},
				});

				await Promise.all(
					comments.map((comment) => {
						if (
							!comment.views.find(v => v.customer && v.customer.token === token)
						) {
							return ctx.db.updateComment({
								where: {id: comment.id},
								data: {
									views: {
										create: {
											customer: {connect: {id: customer.id}},
										},
									},
								},
							});
						}
						return undefined;
					}),
				);
			}
			else {
				const userId = getUserId(ctx);

				const comments = await ctx.db.comments({
					where: {
						item: {
							AND: [{id}, createItemOwnerFilter(userId)],
						},
					},
				}).$fragment(gql`
					fragment CommentWithViews on Comment {
						id
						text
						createdAt
						views {
							id
							user {
								id
							}
						}
					}
				`);

				await Promise.all(
					comments.map((comment) => {
						if (!comment.views.find(v => v.user && v.user.id === userId)) {
							return ctx.db.updateComment({
								where: {id: comment.id},
								data: {
									views: {
										create: {
											user: {connect: {id: userId}},
										},
									},
								},
							});
						}
						return undefined;
					}),
				);
			}
		}

		return ctx.db.item({id});
	},
	reminders,
	items() {
		throw new Error(
			'items is not supported anymore, use tasks or me.tasks instead.',
		);
	},
	tasks,
	activity,
	plannedWorkingTimes,
};

module.exports = {
	Query,
};
