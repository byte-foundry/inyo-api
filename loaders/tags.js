const gql = String.raw;

const TagWithRelationsFragment = gql`
	fragment TagWithRelationsId on Tag {
		id
		name
		colorBg
		colorText
		items {
			id
		}
	}
`;

const batchGetTagById = (ids, db) => db.tags({where: {id_in: ids}}).$fragment(TagWithRelationsFragment);

module.exports = {
	batchGetTagById,
};
