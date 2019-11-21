const gql = String.raw;

const SectionWithRelationsFragment = gql`
	fragment SectionWithRelationsId on Section {
		id
		name
		position
		project {
			id
		}
		items(orderBy: position_ASC) {
			id
		}
	}
`;

const batchGetSectionById = (ids, db) => db.sections({where: {id_in: ids}}).$fragment(SectionWithRelationsFragment);

const batchGetSectionByItemId = async (ids, db) => {
	const sections = await db
		.sections({where: {items_some: {id_in: ids}}})
		.$fragment(SectionWithRelationsFragment);

	return ids.map(id => sections.find(section => section.items.find(item => item.id === id)));
};

module.exports = {
	batchGetSectionById,
	batchGetSectionByItemId,
};
