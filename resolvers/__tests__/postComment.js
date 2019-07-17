import {postComment} from '../postComment';

import {sendNewCommentEmail} from '../../emails/CommentEmail';

jest.mock('../../utils');
jest.mock('../../emails/CommentEmail');

const db = {
	createUserEvent() {},
	createCustomerEvent() {},
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
				updateItem: ({data}) => ({
					id: 'item-id',
					comments: [data.comments.create],
				}),
				createUserEvent: () => {},
			},
		};

		const result = await postComment({}, args, ctx);

		// project customer
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'bernarddavid@customer-project.test',
				url: '/token-customer-project/tasks/item-id?projectId=project-id',
			}),
			ctx,
		);

		// linked customer
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'jeanmichel@customer-task.test',
				url: '/token-customer-task/tasks/item-id',
			}),
			ctx,
		);

		expect(result.comments[0]).toMatchObject(args.comment);
	});

	it('should post a comment with a project customer token', async () => {
		const args = {
			itemId: 'item-id',
			token: 'token-customer-project',
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
				updateItem: jest.fn(({data}) => ({
					id: 'item-id',
					comments: [data.comments.create],
				})),
				createUserEvent: () => {},
			},
		};

		const result = await postComment({}, args, ctx);

		// project owner
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'lance.free@test.com',
				url: '/tasks/item-id',
			}),
			ctx,
		);

		expect(ctx.db.updateItem).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					comments: {
						create: expect.objectContaining({
							authorCustomer: {
								connect: {id: 'customer-project'},
							},
						}),
					},
				},
			}),
		);

		expect(result.comments[0]).toMatchObject(args.comment);
	});

	it('should post a comment with a linked customer token', async () => {
		const args = {
			itemId: 'item-id',
			token: 'project-customer-token',
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
									customer: null,
								},
							},
						},
					],
				}),
				updateItem: jest.fn(({data}) => ({
					id: 'item-id',
					comments: [data.comments.create],
				})),
				createUserEvent: () => {},
			},
		};

		const result = await postComment({}, args, ctx);

		// project owner
		expect(sendNewCommentEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'lance.free@test.com',
				url: '/tasks/item-id',
			}),
			ctx,
		);

		expect(ctx.db.updateItem).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					comments: {
						create: expect.objectContaining({
							authorCustomer: {
								connect: {id: 'customer-task'},
							},
						}),
					},
				},
			}),
		);

		expect(result.comments[0]).toMatchObject(args.comment);
	});
});
