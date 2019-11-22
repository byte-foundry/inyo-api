const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const ProjectWithRelationsFragment = gql`
	fragment ProjectWithRelationsId on Project {
		id
		name
		sharedNotes
		personalNotes
		template
		token
		status
		viewedByCustomer
		issuedAt
		deadline
		budget
		notifyActivityToCustomer
		createdAt
		updatedAt
		owner {
			id
		}
		customer {
			id
			token
		}
		linkedCollaborators {
			id
		}
		sections(orderBy: position_ASC) {
			id
		}
	}
`;

const batchGetProjectById = async (ids, db) => {
	const projects = await db
		.projects({where: {id_in: ids}})
		.$fragment(ProjectWithRelationsFragment);

	return ensureKeyOrder(ids, projects);
};

const batchGetProjectByToken = async (tokens, db) => {
	const projects = await db
		.projects({
			where: {
				OR: [
					{
						token_in: tokens,
					},
					{
						customer: {
							token_in: tokens,
						},
					},
				],
			},
		})
		.$fragment(ProjectWithRelationsFragment);

	const map = new Map();

	projects.forEach((project) => {
		map.set(project.token, [project]);
		if (project.customer) {
			const existingValue = map.get(project.customer.token);

			if (existingValue) {
				existingValue.push(project);
			}
			else {
				map.set(project.customer.token, [project]);
			}
		}
	});

	return tokens.map(
		key => map.get(key) || new Error(`Document does not exist for ${key}`),
	);
};

const batchGetProjectBySectionId = async (ids, db) => {
	const projects = await db
		.projects({where: {sections_some: {id_in: ids}}})
		.$fragment(ProjectWithRelationsFragment);

	return ids.map(id => projects.find(project => project.sections.find(section => section.id === id)));
};

module.exports = {
	batchGetProjectById,
	batchGetProjectByToken,
	batchGetProjectBySectionId,
};
