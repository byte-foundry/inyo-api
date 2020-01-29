import {postComment} from '../postComment';

import {sendNewCommentEmail} from '../../emails/CommentEmail';

jest.mock('../../utils');
jest.mock('../../emails/CommentEmail');

const db = {
	createUserEvent: jest.fn(),
	createCustomerEvent: jest.fn(),
	createComment: jest.fn(comment => comment),
	item: () => {},
};

describe('postComment', () => {
	it('should post a comment and notify customers', async () => {
		const args = {
			itemId: 'item-id',
			comment: {
				text: 'Mon commentaire',
			},
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							id: 'item-id',
							owner: {
								firstName: 'Lance',
								lastName: 'Free',
								email: 'lance.free@test.com',
							},
							linkedCustomer: {
								id: 'customer-task',
								token: 'token-customer-task',
								firstName: 'Jean',
								lastName: 'Michel',
								email: 'jeanmichel@customer-task.test',
							},
							section: {
								id: 'section-id',
								items: [],
								project: {
									id: 'project-id',
									token: 'project-token',
									notifyActivityToCustomer: true,
									status: 'ONGOING',
									customer: {
										id: 'customer-project',
										token: 'token-customer-project',
										firstName: 'Bernard',
										lastName: 'David',
										email: 'bernarddavid@customer-project.test',
									},
								},
							},
						},
					],
				}),
			},
		};

		await postComment({}, args, ctx);

		// project customer
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'bernarddavid@customer-project.test',
				taskId: 'item-id',
				projectId: 'project-id',
			}),
			ctx,
		);

		// linked customer
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'jeanmichel@customer-task.test',
				taskId: 'item-id',
			}),
			ctx,
		);

		expect(ctx.db.createComment).toHaveBeenCalledWith(
			expect.objectContaining({
				item: {connect: {id: args.itemId}},
				text: args.comment.text,
			}),
		);

		expect(ctx.db.createUserEvent).toHaveBeenCalled();
	});

	it('should post a comment with a project customer token', async () => {
		const args = {
			itemId: 'item-id',
			comment: {
				text: 'Mon commentaire',
			},
		};
		const ctx = {
			token: 'token-customer-project',
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							id: 'item-id',
							owner: {
								firstName: 'Lance',
								lastName: 'Free',
								email: 'lance.free@test.com',
							},
							linkedCustomer: null,
							section: {
								id: 'section-id',
								items: [],
								project: {
									id: 'project-id',
									token: 'project-token',
									notifyActivityToCustomer: true,
									status: 'ONGOING',
									customer: {
										id: 'customer-project',
										token: 'token-customer-project',
										firstName: 'Bernard',
										lastName: 'David',
										email: 'bernarddavid@customer-project.test',
									},
								},
							},
						},
					],
				}),
			},
		};

		await postComment({}, args, ctx);

		// project owner
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'lance.free@test.com',
				taskId: 'item-id',
			}),
			ctx,
		);

		expect(ctx.db.createComment).toHaveBeenCalledWith(
			expect.objectContaining({
				item: {connect: {id: args.itemId}},
				text: args.comment.text,
				authorCustomer: {
					connect: {id: 'customer-project'},
				},
			}),
		);

		expect(ctx.db.createCustomerEvent).toHaveBeenCalled();
	});

	it('should post a comment with a linked customer token', async () => {
		const args = {
			itemId: 'item-id',
			comment: {
				text: 'Mon commentaire',
			},
		};
		const ctx = {
			token: 'project-customer-token',
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							id: 'item-id',
							owner: {
								firstName: 'Lance',
								lastName: 'Free',
								email: 'lance.free@test.com',
							},
							linkedCustomer: {
								id: 'customer-task',
								token: 'token-customer-task',
								firstName: 'Jean',
								lastName: 'Michel',
								email: 'jeanmichel@customer-task.test',
							},
							section: {
								id: 'section-id',
								items: [],
								project: {
									id: 'project-id',
									token: 'project-token',
									notifyActivityToCustomer: true,
									status: 'ONGOING',
									customer: null,
								},
							},
						},
					],
				}),
			},
		};

		await postComment({}, args, ctx);

		// project owner
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'lance.free@test.com',
				taskId: 'item-id',
			}),
			ctx,
		);

		expect(ctx.db.createComment).toHaveBeenCalledWith(
			expect.objectContaining({
				item: {connect: {id: args.itemId}},
				text: args.comment.text,
				authorCustomer: {
					connect: {id: 'customer-task'},
				},
			}),
		);

		expect(ctx.db.createCustomerEvent).toHaveBeenCalled();
	});

	it("should post a collaborator's comment and notify the user", async () => {
		const args = {
			itemId: 'item-id',
			comment: {
				text: 'Mon commentaire',
			},
		};
		const ctx = {
			userId: 'collaborator-id',
			request: {
				get: () => 'collaborator-id',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							id: 'item-id',
							owner: {
								firstName: 'Lance',
								lastName: 'Free',
								email: 'lance.free@test.com',
							},
							assignee: {
								id: 'collaborator-id',
								firstName: 'Buddy',
								lastName: 'Dumping',
								email: 'buddy.dumping@test.com',
							},
							linkedCustomer: null,
							section: {
								id: 'section-id',
								items: [],
								project: {
									id: 'project-id',
									token: 'project-token',
									notifyActivityToCustomer: true,
									status: 'ONGOING',
									customer: null,
								},
							},
						},
					],
				}),
			},
		};

		await postComment({}, args, ctx);

		// project owner
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'lance.free@test.com',
				taskId: 'item-id',
			}),
			ctx,
		);

		expect(ctx.db.createComment).toHaveBeenCalledWith(
			expect.objectContaining({
				item: {connect: {id: args.itemId}},
				text: args.comment.text,
				authorUser: {
					connect: {id: 'collaborator-id'},
				},
			}),
		);

		expect(ctx.db.createUserEvent).toHaveBeenCalled();
	});
});
