import {unremoveProject} from '../unremoveProject';

jest.mock('../../utils');

describe('unremoveProject', () => {
	it('should let a user project an ongoing projet', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				createUserEvent: () => {},
				projects: () => ({
					$fragment: () => [
						{
							status: 'REMOVED',
						},
					],
				}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		const item = await unremoveProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'ONGOING',
		});
	});

	it('should not let a user undelete a non deleted project', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				createUserEvent: () => {},
				projects: () => ({
					$fragment: () => [
						{
							status: 'ONGOING',
						},
					],
				}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		await expect(unremoveProject({}, args, ctx)).rejects.toThrow(
			/can't be undeleted/,
		);
	});

	it('should not let a user undelete a non existent project', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				createUserEvent: () => {},
				projects: () => ({$fragment: () => []}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		await expect(unremoveProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
