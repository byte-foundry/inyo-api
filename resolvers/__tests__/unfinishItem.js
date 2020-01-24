import {unfinishItem} from '../unfinishItem';

jest.mock('../../utils');

const db = {
	createUserEvent() {},
};

describe('unfinishItem', () => {
	it('should let a user reset a project user item', async () => {
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
							status: 'FINISHED',
							type: 'DEFAULT',
							scheduledForDays: [],
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'mon-token',
									name: "C'est notre projeeet",
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													status: 'FINISHED',
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

		const item = await unfinishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'PENDING',
		});
	});

	it('should let a customer reset a project customer item', async () => {
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
							status: 'FINISHED',
							type: 'CUSTOMER',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													status: 'FINISHED',
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

		const item = await unfinishItem({}, args, ctx);

		expect(item).toMatchObject({
			id: args.id,
			status: 'PENDING',
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
							status: 'FINISHED',
							type: 'DEFAULT',
							section: {
								id: 'section-id',
								project: {
									id: 'project-id',
									token: 'customer-token',
									name: "C'est notre projeeet",
									status: 'ONGOING',
									sections: [
										{
											name: 'Ma section',
											items: [
												{
													status: 'FINISHED',
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

		await expect(unfinishItem({}, args, ctx)).rejects.toThrow(
			/cannot be resetted by the customer/,
		);
	});
});
