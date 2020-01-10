const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const FileWithRelationsFragment = gql`
	fragment FileWithRelationsId on File {
		id
		filename
		mimetype
		encoding
		url
		createdAt
		documentType
		ownerUser {
			id
		}
		ownerCustomer {
			id
		}
		linkedTask {
			id
		}
		# linkedProject {
		# 	id
		# }
	}
`;

const batchGetFileById = async (ids, db) => {
	const files = await db
		.files({where: {id_in: ids}})
		.$fragment(FileWithRelationsFragment);

	return ensureKeyOrder(ids, files);
};

module.exports = {
	batchGetFileById,
};
