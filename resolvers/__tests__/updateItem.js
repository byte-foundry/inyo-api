import {updateItem} from '../updateItem';

jest.mock('../../utils');
jest.mock('../../stats');
jest.mock('../../emails/TaskEmail');

describe('updateItem', () => {
	it('should let a user update a project item', async () => {
		const args = {
			id: 'item-id',
			name: 'new-name',
			description: 'new-description',
			unit: 42,
			status: 'PENDING',
			reviewer: 'USER',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				user: () => ({
					id: 'user-id',
					firstName: 'Jean',
					lastName: 'Michel',
				}),
				items: () => ({
					$fragment: () => [
						{
							name: 'name',
							status: 'PENDING',
							description: 'description',
							unit: 2,
							reviewer: 'USER',
							section: {
								id: 'section-id',
								project: {
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
								},
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
});
