import {finishItem} from '../finishItem';

import cancelReminder from '../../reminders/cancelReminder';
import {sendTaskValidationEmail} from '../../emails/TaskEmail';

jest.mock('../../utils');
jest.mock('../../emails/TaskEmail');
jest.mock('../../reminders/cancelReminder');

const db = {
	createUserEvent() {},
	createCustomerEvent() {},
};

describe('finishItem', () => {
	it('should let a user finish a project user item', async () => {
		const args = {
			id: 'item-id',
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
							name: 'Mon item',
							status: 'PENDING',
							type: 'DEFAULT',
							owner: {
								id: 'user-id',
								email: 'chouche@gitan.fm',
								firstName: 'Adrien',
								lastName: 'David',
								currentTask: {
									id: 'currentTask-id',
								},
							},
							unit: 1,
							pendingReminders: [],
							workedTimes: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									customer: {
										id: 'customer-id',
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
				updateManyReminders: jest.fn(),
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should let a customer finish a project customer item', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			token: 'customer-token',
			request: {
				get: () => '',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							type: 'CUSTOMER',
							owner: {
								id: 'user-id',
								email: 'chouche@gitan.fm',
								firstName: 'Adrien',
								lastName: 'David',
								currentTask: {
									id: 'currentTask-id',
								},
							},
							pendingReminders: [
								{
									id: 'reminder-id',
									postHookId: 'posthook-id',
									type: 'SECOND',
									status: 'PENDING',
								},
							],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									customer: {
										id: 'customer-id',
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
				updateManyReminders: () => {},
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(sendTaskValidationEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'chouche@gitan.fm',
			}),
			ctx,
		);
		expect(cancelReminder).toHaveBeenCalledWith('posthook-id');

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should not let a customer finish a project user item', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			token: 'customer-token',
			request: {
				get: () => '',
			},
			db: {
				...db,
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							type: 'DEFAULT',
							owner: {
								id: 'user-id',
								email: 'chouche@gitan.fm',
								firstName: 'Adrien',
								lastName: 'David',
								currentTask: {
									id: 'currentTask-id',
								},
							},
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									customer: {
										id: 'customer-id',
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		await expect(finishItem({}, args, ctx)).rejects.toThrow(
			/cannot be finished by the customer/,
		);
	});

	it('should update timeItTook with the right value', async () => {
		const args = {
			id: 'item-id',
			timeItTook: 2,
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
							name: 'Mon item',
							status: 'PENDING',
							type: 'DEFAULT',
							owner: {
								id: 'user-id',
								email: 'chouche@gitan.fm',
								firstName: 'Adrien',
								lastName: 'David',
								currentTask: {
									id: 'currentTask-id',
								},
							},
							unit: 1,
							pendingReminders: [],
							workedTimes: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									customer: {
										id: 'customer-id',
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
				updateManyReminders: jest.fn(),
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
			timeItTook: 2,
		});
	});

	it('stop the timer of the task finished', async () => {
		const args = {
			id: 'current-task-id',
			timeItTook: 2,
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
							id: 'current-task-id',
							name: 'Mon item',
							status: 'PENDING',
							type: 'DEFAULT',
							owner: {
								id: 'user-id',
								email: 'chouche@gitan.fm',
								firstName: 'Adrien',
								lastName: 'David',
								currentTask: {
									id: 'current-task-id',
								},
							},
							unit: 1,
							pendingReminders: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									customer: {
										id: 'customer-id',
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
									},
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													name: 'Mon item',
													unit: 1,
													status: 'PENDING',
												},
											],
										},
									],
								},
							},
						},
					],
				}),
				item: () => ({
					$fragment: () => ({
						section: {
							items: [],
							project: {
								sections: [],
							},
						},
					}),
				}),
				updateItem: jest.fn(({data}) => ({
					id: 'current-task-id',
					...data,
				})),
				updateManyReminders: jest.fn(),
			},
		};

		const item = await finishItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id: 'current-task-id',
				},
				data: expect.objectContaining({
					status: 'FINISHED',
					workedTimes: {
						updateMany: {
							where: {end: null},
							data: {end: expect.any(Date)},
						},
					},
					currentlyTimedBy: {
						disconnect: true,
					},
				}),
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
			timeItTook: 2,
		});
	});
});
