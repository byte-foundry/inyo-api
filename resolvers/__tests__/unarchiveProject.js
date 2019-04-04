import {unarchiveProject} from '../unarchiveProject';

jest.mock('../../utils');

describe('unarchiveProject', () => {
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
							status: 'ARCHIVED',
						},
					],
				}),
				updateProject: ({data}) => ({
					...data,
				}),
			},
		};

		const item = await unarchiveProject({}, args, ctx);

		expect(item).toMatchObject({
			status: 'ONGOING',
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

		await expect(unarchiveProject({}, args, ctx)).rejects.toThrow(
			/can't be unarchived/,
		);
	});

	it('should not let a user finish a non existent project', async () => {
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

		await expect(unarchiveProject({}, args, ctx)).rejects.toThrow(
			/has not been found/,
		);
	});
});
