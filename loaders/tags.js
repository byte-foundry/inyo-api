const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

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

const batchGetTagById = async (ids, db) => {
	const tags = await db
		.tags({where: {id_in: ids}})
		.$fragment(TagWithRelationsFragment);

	return ensureKeyOrder(ids, tags);
};

module.exports = {
	batchGetTagById,
};
