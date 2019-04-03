import {undeleteProject} from '../undeleteProject';

jest.mock('../../utils');
jest.mock('../../stats');

describe('undeleteProject', () => {
	it('should let a user project an ongoing projet', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				projects: () => ({
					$fragment: () => [
						{
							status: 'DELETED',
						},
					],
				}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		const item = await undeleteProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'ONGOING',
		});
	});

	it('should not let a user delete a non deleted project', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
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

		await expect(undeleteProject({}, args, ctx)).rejects.toThrow(
			/can't be undeleted/,
		);
	});

	it('should not let a user delete a non existent project', async () => {
		const args = {
			id: 'item-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				projects: () => ({$fragment: () => []}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		await expect(undeleteProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
