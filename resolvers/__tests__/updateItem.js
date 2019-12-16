import {updateItem} from '../updateItem';

jest.mock('../../utils');
jest.mock('../../emails/TaskEmail');

const project = {
	id: 'project-id',
	status: 'ONGOING',
	name: "C'est notre projeeet",
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
};

const db = {
	user: () => ({
		id: 'user-id',
		firstName: 'Jean',
		lastName: 'Michel',
		company: () => ({id: 'company-id'}),
	}),
	createUserEvent() {},
};

describe('updateItem', () => {
	it('should let a user update a project item', async () => {
		const args = {
			id: 'item-id',
			name: 'new-name',
			description: 'new-description',
			unit: 42,
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
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							position: 0,
							section: {
								id: 'section-id',
								items: [{id: 'item-id', position: 0}],
								project,
							},
						},
					],
				}),
				updateItem: ({data}) => ({
					id: 'item-id',
					...data,
				}),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(item).toMatchObject(args);
	});

	it("should let a user change backward an item's position", async () => {
		const args = {
			id: 'item-4',
			position: 2,
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
							id: 'item-4',
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							position: 5,
							section: {
								id: 'section-id',
								items: [
									{id: 'item-0', position: 0},
									{id: 'item-1', position: 1},
									{id: 'item-2', position: 2},
									{id: 'item-3', position: 3},
									{id: 'item-4', position: 4},
								],
								project,
							},
						},
					],
				}),
				updateItem: jest.fn(({where, data}) => ({
					id: where.id,
					...data,
				})),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(1, {
			where: {id: 'item-2'},
			data: {position: 3},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(2, {
			where: {id: 'item-3'},
			data: {position: 4},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(3, {
			where: {id: 'item-4'},
			data: expect.objectContaining({position: 2}),
		});

		expect(item).toMatchObject(args);
	});

	it("should let a user change forward an item's position", async () => {
		const args = {
			id: 'item-1',
			position: 3,
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
							id: 'item-1',
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							position: 1,
							section: {
								id: 'section-id',
								items: [
									{id: 'item-0', position: 0},
									{id: 'item-1', position: 1},
									{id: 'item-2', position: 2},
									{id: 'item-3', position: 3},
									{id: 'item-4', position: 4},
								],
								project,
							},
						},
					],
				}),
				updateItem: jest.fn(({where, data}) => ({
					id: where.id,
					...data,
				})),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(1, {
			where: {id: 'item-2'},
			data: {position: 1},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(2, {
			where: {id: 'item-3'},
			data: {position: 2},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(3, {
			where: {id: 'item-1'},
			data: expect.objectContaining({position: 3}),
		});

		expect(item).toMatchObject(args);
	});

	it('should work moving to position 0', async () => {
		const args = {
			id: 'item-1',
			position: 0,
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
							id: 'item-1',
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							position: 1,
							section: {
								id: 'section-id',
								items: [
									{id: 'item-0', position: 0},
									{id: 'item-1', position: 1},
									{id: 'item-2', position: 2},
								],
								project,
							},
						},
					],
				}),
				updateItem: jest.fn(({where, data}) => ({
					id: where.id,
					...data,
				})),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(1, {
			where: {id: 'item-0'},
			data: {position: 1},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(2, {
			where: {id: 'item-1'},
			data: expect.objectContaining({position: 0}),
		});

		expect(item).toMatchObject(args);
	});

	it('should work moving to another section position', async () => {
		const args = {
			id: 'item-1',
			sectionId: 'section-2',
			position: 1,
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
							id: 'item-1',
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							position: 1,
							section: {
								id: 'section-id',
								items: [
									{id: 'item-0', position: 0},
									{id: 'item-1', position: 1},
									{id: 'item-2', position: 2},
								],
								project: {
									...project,
									sections: [
										{
											id: 'section-2',
											items: [
												{id: 'item-a', position: 0},
												{id: 'item-b', position: 1},
											],
										},
									],
								},
							},
						},
					],
				}),
				updateItem: jest.fn(({where, data}) => ({
					id: where.id,
					...data,
				})),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(1, {
			where: {id: 'item-2'},
			data: {position: 1},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(2, {
			where: {id: 'item-b'},
			data: {position: 2},
		});
		expect(ctx.db.updateItem).toHaveBeenNthCalledWith(3, {
			where: {id: 'item-1'},
			data: expect.objectContaining({
				position: 1,
				section: {connect: {id: 'section-2'}},
			}),
		});

		delete args.sectionId;

		expect(item).toMatchObject(args);
	});

	it('should work linking a task to a project without specifying section nor position', async () => {
		const args = {
			id: 'new-item',
			projectId: 'project-1',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				...db,
				sections: () => ({
					$fragment: () => [
						{
							id: 'section-1',
							position: 1,
							items: [
								{
									id: 'item-1-1',
									position: 0,
								},
							],
							project: {
								id: 'project-1',
								status: 'ONGOING',
								sections: [
									{
										id: 'section-0',
										position: 0,
										items: [],
									},
									{
										id: 'section-1',
										position: 1,
										items: [
											{
												id: 'item-1-1',
												position: 0,
											},
										],
									},
								],
							},
						},
					],
				}),
				items: () => ({
					$fragment: () => [
						{
							id: 'new-item',
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							section: null,
						},
					],
				}),
				updateItem: jest.fn(({where, data}) => ({
					id: where.id,
					...data,
				})),
			},
		};

		const item = await updateItem({}, args, ctx);

		expect(ctx.db.updateItem).toHaveBeenCalledWith({
			where: {id: 'new-item'},
			data: expect.objectContaining({
				position: 1,
				section: {connect: {id: 'section-1'}},
			}),
		});

		delete args.projectId;
		expect(item).toMatchObject({
			...args,
			position: 1,
		});
	});
});
