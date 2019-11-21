const gql = String.raw;

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

const batchGetCommentById = (ids, db) => db.comments({where: {id_in: ids}}).$fragment(CommentWithRelationsId);

module.exports = {
	batchGetCommentById,
};
