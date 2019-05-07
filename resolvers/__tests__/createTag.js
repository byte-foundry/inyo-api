import {createTag} from '../createTag';

jest.mock('../../utils');

const db = {
	user: () => ({
		id: 'user-id',
		company: () => ({
			id: 'company-id',
		}),
	}),
};

describe('createTag', () => {
	it('should add one tag to a user', async () => {
		const expectedUser = {
			...db.user,
			tags: [
				{
					id: 0,
					name: 'yo',
					color: '#3445ab',
				},
			],
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
				updateUser: ({data}) => ({
					...db.user,
					tags: [
						{
							id: 0,
							...data.tags.create,
						},
					],
				}),
			},
		};

		const user = await createTag({}, {name: 'yo', color: '#3445ab'}, ctx);

		expect(user).toMatchObject(expectedUser);
	});

	it('should not allow user to add tags with an unproper color', async () => {
		const expectedUser = {
			...db.user,
			tags: [
				{
					id: 0,
					name: 'yo',
					color: '#3445ab',
				},
			],
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
				updateUser: ({data}) => ({
					...db.user,
					tags: [
						{
							id: 0,
							...data.tags.create,
						},
					],
				}),
			},
		};

		await expect(
			createTag({}, {name: 'yo', color: '#3445ag'}, ctx),
		).rejects.toThrow(/color must be a valid/);
	});
});
