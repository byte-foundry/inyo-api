import {addItem} from '../addItem';

jest.mock('../../utils');
jest.mock('../../stats');

describe('addItem', () => {
	it('should let a user add a project item', async () => {
		const args = {
			sectionId: 'section-id',
			name: 'My item',
			description: 'My description',
			unit: 42,
			reviewer: 'USER',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				sections: () => ({
					$fragment: () => [
						{
							id: 'section-id',
							project: {
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
			reviewer: 'CUSTOMER',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				sections: () => ({
					$fragment: () => [
						{
							id: 'section-id',
							project: {
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
});
