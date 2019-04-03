import {deleteProject} from '../deleteProject';

jest.mock('../../utils');
jest.mock('../../stats');

describe('deleteProject', () => {
	it('should let a user delete an ongoing projet', async () => {
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

		const item = await deleteProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'DELETED',
		});
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

		await expect(deleteProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
