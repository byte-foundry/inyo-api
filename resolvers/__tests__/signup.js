import {signup} from '../signup';

import {AlreadyExistingError} from '../../errors';

jest.mock('../../utils');

jest.mock('crypto', () => {
	const crypto = jest.requireActual('crypto');

	return {
		...crypto,
		createHmac: jest.fn(() => ({digest: () => '', update: jest.fn()})),
	};
});

describe('signup', () => {
	it('should create a simple user account', async () => {
		const args = {
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'jeanmichel@test.test',
			password: 'password',
		};

		const ctx = {
			db: {
				$exists: {
					user: () => false,
				},
				createUser: jest.fn().mockReturnValue({
					id: 'user-id',
					firstName: 'Jean',
					lastName: 'Michel',
					email: 'jeanmichel@test.test',
				}),
				collabRequests: () => ({
					$fragment: jest.fn(() => []),
				}),
			},
		};

		const result = await signup({}, args, ctx);

		expect(result).toMatchObject({
			token: expect.any(String),
			user: expect.objectContaining({
				id: 'user-id',
			}),
		});
	});

	it('should fail registering an already existing email', async () => {
		const args = {
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'alreadyregistered@test.test',
			password: 'password',
		};

		const ctx = {
			db: {
				$exists: {
					user: () => true,
				},
				createUser: jest.fn(),
				collabRequests: () => ({
					$fragment: jest.fn(() => []),
				}),
			},
		};

		expect(signup({}, args, ctx)).rejects.toThrow(AlreadyExistingError);

		expect(ctx.db.createUser).not.toHaveBeenCalled();
	});
});
