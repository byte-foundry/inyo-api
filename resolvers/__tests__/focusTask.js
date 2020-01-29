import moment from 'moment';

import {focusTask} from '../focusTask';

import {setupItemReminderEmail} from '../../emails/TaskEmail';

jest.mock('../../utils');
jest.mock('../../emails/TaskEmail');

const db = {
	createUserEvent() {},
	createCustomerEvent() {},
	upsertScheduleSpot: jest.fn(),
};

describe('focusTask', () => {
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
					scheduledForDays: [data.scheduledForDays.create],
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
					scheduledForDays: [],
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [],
		});

		const item = await focusTask({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: moment().format(moment.HTML5_FMT.DATE),
			schedulePosition: 0,
			scheduledForDays: [
				{
					date: moment().format(moment.HTML5_FMT.DATE),
					position: 0,
				},
			],
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
					scheduledForDays: [data.scheduledForDays.create],
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
					scheduledForDays: [],
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id2',
					scheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{id: 'item-id2-schedule-1', date: scheduledFor, position: 0},
					],
				},
				{
					id: 'item-id3',
					scheduledFor,
					schedulePosition: 1,
					scheduledForDays: [
						{id: 'item-id3-schedule-1', date: scheduledFor, position: 1},
					],
				},
			],
		});

		const item = await focusTask({}, args, ctx);

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id3-schedule-1'},
				update: {position: 2},
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			scheduledForDays: [{date: args.for, position: args.schedulePosition}],
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
					scheduledForDays: [data.scheduledForDays.update.data],
				}),
				upsertScheduleSpot: jest.fn(),
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
					scheduledForDays: [{date: previouslyScheduledFor, position: 1}],
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id4',
					scheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{id: 'item-id4-schedule-1', date: scheduledFor, position: 0},
					],
				},
			],
		});

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id2',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{
							id: 'item-id2-schedule-1',
							date: previouslyScheduledFor,
							position: 0,
						},
					],
				},
				{
					id: 'item-id',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 1,
					scheduledForDays: [
						{
							id: 'item-id-schedule-1',
							date: previouslyScheduledFor,
							position: 1,
						},
					],
				},
				{
					id: 'item-id3',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 2,
					scheduledForDays: [
						{
							id: 'item-id3-schedule-1',
							date: previouslyScheduledFor,
							position: 2,
						},
					],
				},
			],
		});

		const item = await focusTask({}, args, ctx);

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id3-schedule-1'},
				update: {position: 1},
			}),
		);

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id4-schedule-1'},
				update: {position: 1},
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			scheduledForDays: [
				{
					date: args.for,
					position: args.schedulePosition,
				},
			],
		});
	});

	it('should let a user split a task from a day to another', async () => {
		const previouslyScheduledFor = moment().format(moment.HTML5_FMT.DATE);
		const scheduledFor = moment()
			.add(2, 'days')
			.format(moment.HTML5_FMT.DATE);

		const args = {
			id: 'item-id',
			for: scheduledFor,
			schedulePosition: 0,
			action: 'SPLIT',
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
					scheduledForDays: [data.scheduledForDays.create],
				}),
				upsertScheduleSpot: jest.fn(),
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
					schedulePosition: 0,
					scheduledForDays: [{date: previouslyScheduledFor, position: 0}],
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id4',
					scheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{id: 'item-id4-schedule-1', date: scheduledFor, position: 0},
					],
				},
			],
		});

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{
							id: 'item-id-schedule-1',
							date: previouslyScheduledFor,
							position: 0,
						},
					],
				},
				{
					id: 'item-id3',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 1,
					scheduledForDays: [
						{
							id: 'item-id3-schedule-1',
							date: previouslyScheduledFor,
							position: 1,
						},
					],
				},
			],
		});

		const item = await focusTask({}, args, ctx);

		expect(ctx.db.upsertScheduleSpot).not.toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id3-schedule-1'},
			}),
		);

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id4-schedule-1'},
				update: {position: 1},
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			scheduledForDays: [
				{
					date: args.for,
					position: args.schedulePosition,
				},
			],
		});
	});

	it('should let a user move a splitted task from a day to another', async () => {
		const previouslyScheduledFor = moment().format(moment.HTML5_FMT.DATE);
		const scheduledFor = moment()
			.add(2, 'days')
			.format(moment.HTML5_FMT.DATE);

		const args = {
			id: 'item-id',
			from: previouslyScheduledFor,
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
					scheduledForDays: [data.scheduledForDays.update.data],
				}),
				upsertScheduleSpot: jest.fn(),
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
					scheduledFor: '2019-09-06',
					schedulePosition: 0,
					scheduledForDays: [
						{date: '2019-09-06', position: 0},
						{date: previouslyScheduledFor, position: 0},
					],
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id4',
					scheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{id: 'item-id4-schedule-1', date: scheduledFor, position: 0},
					],
				},
			],
		});

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{
							id: 'item-id-schedule-1',
							date: previouslyScheduledFor,
							position: 1,
						},
					],
				},
				{
					id: 'item-id3',
					scheduledFor: previouslyScheduledFor,
					schedulePosition: 1,
					scheduledForDays: [
						{
							id: 'item-id3-schedule-1',
							date: previouslyScheduledFor,
							position: 2,
						},
					],
				},
			],
		});

		const item = await focusTask({}, args, ctx);

		expect(ctx.db.items).toHaveBeenCalled();
		expect(ctx.db.items).toHaveBeenCalledWith({
			where: {
				owner: {id: ctx.userId},
				scheduledForDays_some: {
					date: scheduledFor,
				},
			},
		});

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id3-schedule-1'},
				update: {position: 0},
			}),
		);

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id4-schedule-1'},
				update: {position: 1},
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			scheduledForDays: [
				// {date: '2019-09-06', position: 0},
				{date: args.for, position: args.schedulePosition},
			],
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
					$fragment: () => ({
						id: 'user-id',
						email: 'chouche@gitan.fm',
						firstName: 'Adrien',
						lastName: 'David',
						startWorkAt: '0000-00-00T09:00:00.000Z',
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
					scheduledForDays: [data.scheduledForDays.create],
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
					scheduledForDays: [],
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

		ctx.db.items.mockReturnValueOnce({$fragment: () => []});

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
			scheduledForDays: [
				{
					date: args.for,
					position: args.schedulePosition,
				},
			],
		});
	});

	it('should let a user move a customer task within the same day and not re-set reminders', async () => {
		const scheduledFor = moment().format(moment.HTML5_FMT.DATE);

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
					$fragment: () => ({
						id: 'user-id',
						email: 'chouche@gitan.fm',
						firstName: 'Adrien',
						lastName: 'David',
						startWorkAt: '0000-00-00T09:00:00.000Z',
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
					scheduledForDays: [data.scheduledForDays.update.data],
				}),
				upsertScheduleSpot: jest.fn(),
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
					scheduledFor,
					schedulePosition: 1,
					scheduledForDays: [{date: scheduledFor, position: 1}],
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [
						{type: 'DELAY'},
						{type: 'FIRST'},
						{type: 'SECOND'},
						{type: 'LAST'},
					],
					test: 'bidule',
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id2',
					scheduledFor,
					schedulePosition: 0,
					scheduledForDays: [
						{id: 'item-id2-schedule-1', date: scheduledFor, position: 0},
					],
				},
				{
					id: 'item-id',
					scheduledFor,
					schedulePosition: 1,
					scheduledForDays: [
						{id: 'item-id-schedule-1', date: scheduledFor, position: 1},
					],
				},
			],
		});

		const item = await focusTask({}, args, ctx);

		setupItemReminderEmail.mockClear();
		expect(setupItemReminderEmail).not.toHaveBeenCalled();

		expect(ctx.db.upsertScheduleSpot).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {id: 'item-id2-schedule-1'},
				update: {position: 1},
			}),
		);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			scheduledForDays: [
				{
					date: args.for,
					position: args.schedulePosition,
				},
			],
		});
	});

	it('should let a user focus a finished task without changing its status', async () => {
		const scheduledFor = moment().format(moment.HTML5_FMT.DATE);

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
					$fragment: () => ({
						id: 'user-id',
						email: 'chouche@gitan.fm',
						firstName: 'Adrien',
						lastName: 'David',
						startWorkAt: '0000-00-00T09:00:00.000Z',
					}),
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
					scheduledForDays: [data.scheduledForDays.create],
				}),
				upsertScheduleSpot: jest.fn(),
			},
		};

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [
				{
					id: 'item-id',
					name: 'Mon item',
					status: 'FINISHED',
					type: 'DEFAULT',
					unit: 1,
					description: '',
					scheduledFor: null,
					schedulePosition: null,
					scheduledForDays: [],
					attachments: [],
					linkedCustomer: null,
					focusedBy: null,
					pendingReminders: [
						{type: 'DELAY'},
						{type: 'FIRST'},
						{type: 'SECOND'},
						{type: 'LAST'},
					],
					test: 'bidule',
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

		ctx.db.items.mockReturnValueOnce({
			$fragment: () => [],
		});

		const item = await focusTask({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			scheduledFor: args.for,
			schedulePosition: args.schedulePosition,
			status: 'FINISHED',
			scheduledForDays: [
				{
					date: args.for,
					position: args.schedulePosition,
					status: 'FINISHED',
				},
			],
		});
	});
});
