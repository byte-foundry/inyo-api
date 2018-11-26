import {
	makeExecutableSchema,
	addMockFunctionsToSchema,
	mockServer,
	buildSchemaFromTypeDefinitions,
} from 'graphql-tools';
import {graphql} from 'graphql';

import schema from '../schema.graphql';

const gql = String.raw;

const getUserTest = {
	id: 'Get User',
	query: gql`
		query {
			me {
				id
				startWorkAt
				endWorkAt
			}
		}
	`,
	variables: {},
	context: {},
	expected: {
		data: {
			me: {
				id: 'id',
				startWorkAt: '12:00:00.000Z',
				endWorkAt: '12:00:00.000Z',
			},
		},
	},
};

describe('Schema', () => {
	// Array of test cases
	const cases = [getUserTest];
	const mockSchema = makeExecutableSchema({typeDefs: schema});
	const jsSchema = buildSchemaFromTypeDefinitions(schema);
	const mockMap = {
		ID: () => 'id',
		Time: () => '12:00:00.000Z',
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

		test(`query: ${id}`, () => expect(
			graphql(mockSchema, query, null, {ctx}, variables),
		).resolves.toEqual(expected));
	});
});
