import {updateUser} from '../updateUser';

jest.mock('../../utils');

describe('updateUser', () => {
	it('should update the user properties', async () => {
		const args = {
			id: 'item-id',
			startWorkAt: '09:00:00+02:00',
			endWorkAt: '17:00:00+02:00',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				updateUser: ({data}) => ({
					id: 'item-id',
					...data,
					startWorkAt: new Date(`2018-11-26T${data.startWorkAt}`).toJSON(),
					endWorkAt: new Date(`2018-11-26T${data.endWorkAt}`).toJSON(),
				}),
			},
		};

		const user = await updateUser({}, args, ctx);

		expect(user).toMatchObject({
			id: args.id,
			startWorkAt: '2018-11-26T07:00:00.000Z',
			endWorkAt: '2018-11-26T15:00:00.000Z',
		});
	});
});
