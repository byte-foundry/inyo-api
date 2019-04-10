import {archiveProject} from '../archiveProject';

jest.mock('../../utils');

describe('archiveProject', () => {
	it('should let a user archive an ongoing projet', async () => {
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

		const item = await archiveProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'ARCHIVED',
		});
	});

	it('should not let a customer archive a non ongoing project', async () => {
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
							status: 'DELETED',
						},
					],
				}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		await expect(archiveProject({}, args, ctx)).rejects.toThrow(
			/can't be finished/,
		);
	});

	it('should not let a user archive a non existent project', async () => {
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

		await expect(archiveProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
