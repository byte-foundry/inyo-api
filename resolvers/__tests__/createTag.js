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
		const expectedTag = {
			id: 0,
			name: 'yo',
			colorBg: '#3445ab',
			colorText: '#3445ab',
			owner: {id: 'user-token'},
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
				createTag: data => ({
					id: 0,
					...data,
					owner: {
						id: data.owner.connect.id,
					},
				}),
			},
		};

		const tag = await createTag(
			{},
			{name: 'yo', colorBg: '#3445ab', colorText: '#3445ab'},
			ctx,
		);

		expect(tag).toMatchObject(expectedTag);
	});

	it('should not allow user to add tags with an unproper background color', async () => {
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
				createTag: data => ({
					id: 0,
					...data,
					owner: {
						id: data.owner.connect.id,
					},
				}),
			},
		};

		await expect(
			createTag(
				{},
				{name: 'yo', colorBg: '#3445ag', colorText: '#3445ab'},
				ctx,
			),
		).rejects.toThrow(/background color must be a valid/);
	});

	it('should not allow user to add tags with an unproper text color', async () => {
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
				createTag: data => ({
					id: 0,
					...data,
					owner: {
						id: data.owner.connect.id,
					},
				}),
			},
		};

		await expect(
			createTag(
				{},
				{name: 'yo', colorBg: '#3445ab', colorText: '#3445aq'},
				ctx,
			),
		).rejects.toThrow(/text color must be a valid/);
	});
});
