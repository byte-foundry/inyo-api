const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const customersScalars = `
	id
	token
	name
	title
	firstName
	lastName
	email
	address {
		street
		city
		postalCode
		country
	}
	phone
	occupation
	userNotes
	siret
	rcs
	rm
`;

const CustomersWithRelationsFragment = gql`
	fragment CustomersWithRelationsId on Customer {
		${customersScalars}
	}
`;

const batchGetCustomerById = async (ids, db) => {
	const customers = await db
		.customers({where: {id_in: ids}})
		.$fragment(CustomersWithRelationsFragment);

	return ensureKeyOrder(ids, customers);
};

const batchGetCustomerByTaskId = async (ids, db) => {
	const idsFilter = JSON.stringify(ids);
	const customers = await db.customers({
		where: {
			OR: [
				{
					linkedTasks_some: {
						id_in: ids,
					},
				},
				{
					projects_some: {
						sections_some: {
							items_some: {
								id_in: ids,
							},
						},
					},
				},
			],
		},
	}).$fragment(gql`
		fragment CustomerWithTaskId on User {
			${customersScalars}
			linkedTasks(where: {id_in: ${idsFilter} }) {
				id
			}
			projects(where: {sections_some: {items_some: { id_in: ${idsFilter} }}}) {
				sections(where: {items_some: { id_in: ${idsFilter} }}) {
					items(where: {id_in: ${idsFilter} }) {
						id
					}
				}
			}
		}
	`);

	return ids.map(id => customers.find((customer) => {
		const hasLinkedTask = customer.linkedTasks.some(task => task.id === id);
		const isLinkedToProjectTask = customer.projects.some(project => project.sections.some(section => section.items.some(task => task.id === id)));

		return hasLinkedTask || isLinkedToProjectTask;
	}));
};

module.exports = {
	batchGetCustomerById,
	batchGetCustomerByTaskId,
};
