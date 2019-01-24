import {finishItem} from '../finishItem';

import cancelReminder from '../../reminders/cancelReminder';
import {
	sendTaskValidationWaitCustomerEmail,
	setupItemReminderEmail,
} from '../../emails/TaskEmail';

jest.mock('../../utils');
jest.mock('../../stats');
jest.mock('../../emails/TaskEmail');
jest.mock('../../reminders/cancelReminder');

beforeEach(() => {
	jest.clearAllMocks();
});

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
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							pendingReminders: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									notifyActivityToCustomer: true,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												email: 'chouche@gitan.fm',
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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

	it('should not notify a customer if the user has disabled it', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							pendingReminders: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est plus notre projeeet",
									notifyActivityToCustomer: false,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												email: 'chouche@gitan.fm',
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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

		expect(sendTaskValidationEmail).not.toHaveBeenCalled();

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it("should send a mail and reminders when the customer's action is required", async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							pendingReminders: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									notifyActivityToCustomer: true,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												email: 'chouche@gitan.fm',
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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
							id: 'section-1',
							items: [
								{
									id: 'next-item-id',
									name: 'Mon item',
									type: 'DEFAULT',
									description: '',
									reviewer: 'CUSTOMER',
								},
								{
									id: 'another-item-id',
									name: 'Another item',
									type: 'DEFAULT',
									description: '',
									reviewer: 'CUSTOMER',
								},
							],
							project: {
								sections: [
									{
										id: 'section-2',
										items: [
											{
												id: 'another-2-item-id',
												name: 'Another item 2',
												type: 'DEFAULT',
												description: '',
												reviewer: 'CUSTOMER',
											},
											{
												id: 'another-3-item-id',
												name: 'Another item 3',
												type: 'DEFAULT',
												description: '',
												reviewer: 'USER',
											},
										],
									},
								],
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

		expect(sendTaskValidationWaitCustomerEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'jean@michel.org',
				items: [
					expect.objectContaining({id: 'next-item-id'}),
					expect.objectContaining({id: 'another-item-id'}),
					expect.objectContaining({id: 'another-2-item-id'}),
				],
			}),
		);
		expect(setupItemReminderEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				itemId: 'next-item-id',
			}),
			ctx,
		);

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should let a customer finish a project customer item', async () => {
		const args = {
			id: 'item-id',
			token: 'customer-token',
		};
		const ctx = {
			request: {
				get: () => '',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'CUSTOMER',
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
									notifyActivityToCustomer: true,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												email: 'chouche@gitan.fm',
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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

		expect(cancelReminder).toHaveBeenCalledWith('posthook-id');

		expect(item).toMatchObject({
			id: args.id,
			status: 'FINISHED',
		});
	});

	it('should not let a user finish a project customer item', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'CUSTOMER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									notifyActivityToCustomer: true,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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
			/cannot be finished by the user/,
		);
	});

	it('should not let a customer finish a project user item', async () => {
		const args = {
			id: 'item-id',
			token: 'customer-token',
		};
		const ctx = {
			request: {
				get: () => '',
			},
			db: {
				items: () => ({
					$fragment: () => [
						{
							name: 'Mon item',
							status: 'PENDING',
							reviewer: 'USER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									notifyActivityToCustomer: true,
									customer: {
										title: 'MONSIEUR',
										firstName: 'Jean',
										lastName: 'Michel',
										email: 'jean@michel.org',
										serviceCompany: {
											owner: {
												firstName: 'Adrien',
												lastName: 'David',
											},
										},
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
});
