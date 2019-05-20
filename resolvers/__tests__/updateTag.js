import {updateTag} from '../updateTag';

jest.mock('../../utils');

const db = {
	user: () => ({
		id: 'user-id',
		company: () => ({
			id: 'company-id',
		}),
	}),
};

describe('updateTag', () => {
	it('should update the name and colors of a tag', async () => {
		const expectedTag = {
			id: 0,
			name: 'hello',
			colorBg: '#a1a1a1',
			colorText: '#b1b1b1',
		};
		const dbTag = {
			id: 0,
			name: 'prout',
			colorBg: '#a0a0a0',
			colorText: '#b0b0b0',
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
				updateTag: async ({id, data}) => ({...data, id: dbTag.id}),
				tags: async () => [dbTag],
			},
		};

		const tag = await updateTag(
			{},
			{
				id: 0,
				name: 'hello',
				colorBg: '#a1a1a1',
				colorText: '#b1b1b1',
			},
			ctx,
		);

		expect(tag).toMatchObject(expectedTag);
	});

	it('should not update with an unproper background color value', async () => {
		const dbTag = {
			id: 0,
			name: 'prout',
			colorBg: '#a0a0a0',
			colorText: '#b0b0b0',
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
				updateTag: async ({id, data}) => ({...data, id: dbTag.id}),
				tags: async () => [dbTag],
			},
		};

		await expect(
			updateTag(
				{},
				{
					id: 0,
					name: 'hello',
					colorBg: '#g1a1a1',
					colorText: '#b1b1b1',
				},
				ctx,
			),
		).rejects.toThrow(/background color must be a valid/);
	});

	it('should not update with an unproper text color value', async () => {
		const dbTag = {
			id: 0,
			name: 'prout',
			colorBg: '#a0a0a0',
			colorText: '#b0b0b0',
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
				updateTag: async ({id, data}) => ({...data, id: dbTag.id}),
				tags: async () => [dbTag],
			},
		};

		await expect(
			updateTag(
				{},
				{
					id: 0,
					name: 'hello',
					colorBg: '#a1a1a1',
					colorText: '#g1b1b1',
				},
				ctx,
			),
		).rejects.toThrow(/text color must be a valid/);
	});

	it("should not update if we can't find the tag", async () => {
		const dbTag = {
			id: 0,
			name: 'prout',
			colorBg: '#a0a0a0',
			colorText: '#b0b0b0',
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
				updateTag: async ({id, data}) => ({...data, id: dbTag.id}),
				tags: async () => [],
			},
		};

		await expect(
			updateTag(
				{},
				{
					id: 0,
					name: 'hello',
					colorBg: '#g1a1a1',
					colorText: '#b1b1b1',
				},
				ctx,
			),
		).rejects.toThrow(/has not been found/);
	});
});
