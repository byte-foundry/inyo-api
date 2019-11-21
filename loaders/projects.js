const gql = String.raw;

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
		}
		linkedCollaborators {
			id
		}
		sections(orderBy: position_ASC) {
			id
		}
	}
`;

const batchGetProjectById = (ids, db) => db.projects({where: {id_in: ids}}).$fragment(ProjectWithRelationsFragment);

const batchGetProjectByToken = (tokens, db) => db
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
