import {Mutation} from '../Mutation';

jest.mock('../../utils');
jest.mock('../../stats');
jest.mock('../../emails/QuoteEmail');

describe('Mutation', () => {
	it('should create a simple user account', async () => {
		const args = {
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'jeanmichel@test.test',
			password: 'password',
		};

		const ctx = {
			db: {
				createUser: jest.fn().mockReturnValue({
					id: 'user-id',
					firstName: 'Jean',
					lastName: 'Michel',
					email: 'jeanmichel@test.test',
				}),
			},
		};

		const result = await Mutation.signup({}, args, ctx);

		expect(result).toMatchObject({
			token: expect.any(String),
			user: expect.objectContaining({
				id: 'user-id',
			}),
		});
	});

	it('should send quote', async () => {
		const args = {
			id: 'quote-id',
		};
		const ctx = {
			request: {
				get: () => 'user-token',
			},
			db: {
				user: () => Promise.resolve({
					id: 'user-id',
				}),
				quote: () => ({
					$fragment: () => ({
						id: args.id,
						status: 'DRAFT',
						customer: {
							firstName: 'Jean',
							lastName: 'Client',
							email: 'customer@test.test',
							serviceCompany: {
								siret: 'siret',
								name: 'ACME',
								address: {
									street: 'Test',
									city: 'Test',
									country: 'Test',
								},
							},
						},
					}),
				}),
				updateQuote: ({data}) => ({
					id: 'quote-id',
					...data,
				}),
			},
		};

		const quote = await Mutation.sendQuote({}, args, ctx);

		expect(quote).toMatchObject({
			id: args.id,
			status: 'SENT',
		});
	});
});
