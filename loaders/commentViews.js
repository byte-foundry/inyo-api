const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const CommentViewsWithRelationsId = gql`
	fragment CommentWithRelationsId on Comment {
		id
		user {
			id
		}
		customer {
			id
		}
	}
`;

const batchGetCommentViewById = async (ids, db) => {
	const commentViews = await db
		.commentViews({where: {id_in: ids}})
		.$fragment(CommentViewsWithRelationsId);

	return ensureKeyOrder(ids, commentViews);
};

module.exports = {
	batchGetCommentViewById,
};
