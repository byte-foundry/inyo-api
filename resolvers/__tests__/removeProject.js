import {removeProject} from '../removeProject';

jest.mock('../../utils');

describe('removeProject', () => {
	it('should let a user delete an ongoing projet', async () => {
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

		const item = await removeProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'REMOVED',
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
				createUserEvent: () => {},
				projects: () => ({$fragment: () => []}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		await expect(removeProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
