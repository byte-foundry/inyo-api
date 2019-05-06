import {createTags} from '../createTags';

jest.mock('../../utils');

const db = {
	user: () => ({
		id: 'user-id',
		company: () => ({
			id: 'company-id',
		}),
	}),
};

describe('createTags', () => {
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
					tags: data.tags.create.map((tag, i) => ({
						id: i,
						...tag,
					})),
				}),
			},
		};

		const user = await createTags(
			{},
			{tags: [{name: 'yo', color: '#3445ab'}]},
			ctx,
		);

		expect(user).toMatchObject(expectedUser);
	});

	it('should add tags to a user', async () => {
		const expectedUser = {
			...db.user,
			tags: [
				{
					id: 0,
					name: 'yo',
					color: '#3445ab',
				},
				{
					id: 1,
					name: 'yi',
					color: '#45AFDE',
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
					tags: data.tags.create.map((tag, i) => ({
						id: i,
						...tag,
					})),
				}),
			},
		};

		const user = await createTags(
			{},
			{tags: [{name: 'yo', color: '#3445ab'}, {name: 'yi', color: '#45AFDE'}]},
			ctx,
		);

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
				{
					id: 1,
					name: 'yi',
					color: '#45AFDE',
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
					tags: data.tags.create.map((tag, i) => ({
						id: i,
						...tag,
					})),
				}),
			},
		};

		await expect(
			createTags(
				{},
				{
					tags: [
						{name: 'yo', color: '#3445ag'},
						{name: 'yi', color: '#45AFDE'},
					],
				},
				ctx,
			),
		).rejects.toThrow(/color must be a valid/);
	});
});
