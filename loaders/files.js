const gql = String.raw;

const FileWithRelationsFragment = gql`
	fragment FileWithRelationsId on File {
		id
		filename
		mimetype
		encoding
		url
		createdAt
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

const batchGetFileById = (ids, db) => db.files({where: {id_in: ids}}).$fragment(FileWithRelationsFragment);

module.exports = {
	batchGetFileById,
};
