import {addItem} from '../addItem';

jest.mock('../../utils');
jest.mock('../../stats');

const db = {
	user: () => ({
		id: 'user-id',
		company: () => ({
			id: 'company-id',
		}),
	}),
	createUserEvent() {},
};

describe('addItem', () => {
	it('should let a user add a project item', async () => {
		const args = {
			sectionId: 'section-id',
			name: 'My item',
			description: 'My description',
			unit: 42,
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
							id: 'section-id',
							items: [],
							project: {
								notifyActivityToCustomer: true,
								status: 'ONGOING',
							},
						},
					],
				}),
				createItem: data => ({
					id: 'item-id',
					section: {id: data.section.connect.id},
					...data,
				}),
			},
		};

		const item = await addItem({}, args, ctx);

		delete args.sectionId;
		expect(item).toMatchObject(args);
	});

	it('should let a user add a customer project item', async () => {
		const args = {
			sectionId: 'section-id',
			name: 'Send logo',
			description: 'The logo is required to finish the website.',
			unit: 2,
			type: 'CUSTOMER',
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
							id: 'section-id',
							items: [],
							project: {
								notifyActivityToCustomer: true,
								status: 'ONGOING',
							},
						},
					],
				}),
				createItem: data => ({
					id: 'item-id',
					section: {id: data.section.connect.id},
					...data,
				}),
			},
		};

		const item = await addItem({}, args, ctx);

		delete args.sectionId;
		expect(item).toMatchObject(args);
	});

	it("should add an item at the section's end", async () => {
		const args = {
			sectionId: 'section-id',
			name: 'An item',
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
							id: 'section-id',
							items: [
								{id: 'item-0', position: 0},
								{id: 'item-1', position: 1},
								{id: 'item-2', position: 2},
							],
							project: {
								notifyActivityToCustomer: true,
								status: 'ONGOING',
							},
						},
					],
				}),
				createItem: data => ({
					id: 'item-id',
					section: {id: data.section.connect.id},
					...data,
				}),
			},
		};

		const item = await addItem({}, args, ctx);

		delete args.sectionId;
		expect(item).toMatchObject({
			...args,
			position: 3,
		});
	});
});
