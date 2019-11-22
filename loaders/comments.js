const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const CommentWithRelationsId = gql`
	fragment CommentWithRelationsId on Comment {
		id
		text
		viewedByUser
		viewedByCustomer
		createdAt
		authorUser {
			id
		}
		authorCustomer {
			id
		}
		views {
			id
		}
		item {
			id
		}
	}
`;

const batchGetCommentById = async (ids, db) => {
	const comments = await db
		.comments({where: {id_in: ids}})
		.$fragment(CommentWithRelationsId);

	return ensureKeyOrder(ids, comments);
};

module.exports = {
	batchGetCommentById,
};
