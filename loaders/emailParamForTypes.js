const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const EmailParamForTypeWithRelation = gql`
	fragment EmailParamForTypeWithRelation on EmailParamForType {
		id
		require
		param {
			id
		}
	}
`;

const batchGetEmailParamForTypeById = async (ids, db) => {
	const emailParamForTypes = await db
		.emailParamForTypes({where: {id_in: ids}})
		.$fragment(EmailParamForTypeWithRelation);

	return ensureKeyOrder(ids, emailParamForTypes);
};

module.exports = {
	batchGetEmailParamForTypeById,
};
