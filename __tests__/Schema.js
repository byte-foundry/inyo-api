import {
	makeExecutableSchema,
	addMockFunctionsToSchema,
	mockServer,
	buildSchemaFromTypeDefinitions,
} from 'graphql-tools';
import {graphql} from 'graphql';

import schema from '../schema.graphql';

const getUserTest = {
	id: 'Get User',
	query: `
		query {
			me {
				id
			}
		}
	`,
	variables: {},
	context: {},
	expected: {
		data: {
			me: null,
		},
	},
};

describe('Schema', () => {
	// Array of test cases
	const cases = [getUserTest];
	const mockSchema = makeExecutableSchema({typeDefs: schema});
	const jsSchema = buildSchemaFromTypeDefinitions(schema);
	const mockMap = {
		User: () => null,
	};

	// Return payload of mocked types
	addMockFunctionsToSchema({
		schema: mockSchema,
		mocks: mockMap,
		preserveResolvers: true,
	});

	test('has valid type definitions', async () => {
		expect(async () => {
			const MockServer = mockServer(jsSchema);

			await MockServer.query('{ __schema { types { name } } }');
		}).not.toThrow();
	});

	cases.forEach((obj) => {
		const {
			id, query, variables, context: ctx, expected,
		} = obj;

		test(`query: ${id}`, async () => await expect(
			graphql(mockSchema, query, null, {ctx}, variables),
		).resolves.toEqual(expected));
	});
});
