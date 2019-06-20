import moment from 'moment';

import {focusTask} from '../focusTask';

import {setupItemReminderEmail} from '../../emails/TaskEmail';

jest.mock('../../utils');
jest.mock('../../emails/TaskEmail');

const db = {
	createUserEvent() {},
	createCustomerEvent() {},
};

describe.only('focusTask', () => {
	it('should let a user focus a task', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: jest.fn(),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					name: 'Mon item',
					status: 'PENDING',
					type: 'DEFAULT',
					unit: 1,
					description: '',
					scheduledFor: null,
					schedulePosition: null,
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [],
					section: {
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
								token: 'user-token',
							},
							status: 'ONGOING',
						},
					},
				},
			],
		});

		ctx.db.items.mockReturnValueOnce([]);

		const item = await focusTask({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: moment().format(moment.HTML5_FMT.DATE),
			schedulePosition: 0,
		});
	});

	it('should let a user focus a task on a specific day and position', async () => {
		const scheduledFor = moment()
			.add(2, 'days')
			.format(moment.HTML5_FMT.DATE);

		const args = {
			id: 'item-id',
			for: scheduledFor,
			schedulePosition: 1,
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: jest.fn(),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					name: 'Mon item',
					status: 'PENDING',
					type: 'DEFAULT',
					unit: 1,
					description: '',
					scheduledFor: null,
					schedulePosition: null,
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [],
					section: {
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
								token: 'user-token',
							},
							status: 'ONGOING',
						},
					},
				},
			],
		});

		ctx.db.items.mockReturnValueOnce([
			{
				id: 'item-id2',
				scheduledFor,
				schedulePosition: 0,
			},
			{
				id: 'item-id3',
				scheduledFor,
				schedulePosition: 1,
			},
		]);

		const item = await focusTask({}, args, ctx);

		// TODO: check item have been updated accordingly

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
		});
	});

	it('should let a user move a task from a day to another', async () => {
		const previouslyScheduledFor = moment().format(moment.HTML5_FMT.DATE);
		const scheduledFor = moment()
			.add(2, 'days')
			.format(moment.HTML5_FMT.DATE);

		const args = {
			id: 'item-id',
			for: scheduledFor,
			schedulePosition: 0,
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: jest.fn(),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					name: 'Mon item',
					status: 'PENDING',
					type: 'DEFAULT',
					unit: 1,
					description: '',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 1,
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [],
					section: {
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
								token: 'user-token',
							},
							status: 'ONGOING',
						},
					},
				},
			],
		});

		ctx.db.items.mockReturnValueOnce([
			{
				id: 'item-id2',
				scheduledFor: previouslyScheduledFor,
				schedulePosition: 0,
			},
			{
				id: 'item-id3',
				scheduledFor: previouslyScheduledFor,
				schedulePosition: 2,
			},
		]);

		ctx.db.items.mockReturnValueOnce([
			{
				id: 'item-id4',
				scheduledFor,
				schedulePosition: 0,
			},
		]);

		const item = await focusTask({}, args, ctx);

		// TODO: check item have been updated accordingly

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
		});
	});

	it('should let a user focus a customer task and set reminders from the activation day', async () => {
		const scheduledFor = moment()
			.add(2, 'days')
			.format(moment.HTML5_FMT.DATE);

		const args = {
			id: 'item-id',
			for: scheduledFor,
			schedulePosition: 0,
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				items: jest.fn(),
				user: () => ({
					id: 'user-id',
					email: 'chouche@gitan.fm',
					firstName: 'Adrien',
					lastName: 'David',
					startWorkAt: '0000-00-00T09:00:00.000Z',
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					name: 'Mon item',
					status: 'PENDING',
					type: 'CUSTOMER',
					unit: 1,
					description: '',
					scheduledFor: null,
					schedulePosition: null,
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [],
					section: {
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
								token: 'user-token',
							},
							status: 'ONGOING',
						},
					},
				},
			],
		});

		ctx.db.items.mockReturnValueOnce([]);

		const item = await focusTask({}, args, ctx);

		expect(setupItemReminderEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				issueDate: new Date(`${scheduledFor}T09:00:00.000Z`),
				itemId: 'item-id',
				reminders: undefined,
			}),
			ctx,
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
		});
	});
});
