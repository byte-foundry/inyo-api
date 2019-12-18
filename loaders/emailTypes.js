const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const EmailTypeWithRelationsFragment = gql`
	fragment EmailTypeWithRelationsId on Tag {
		id
		category
		defaultTemplate {
			id
		}
		availableParams {
			id
		}
	}
`;

const batchGetEmailTypeById = async (ids, db) => {
	const emailTypes = await db
		.emailTypes({where: {id_in: ids}})
		.$fragment(EmailTypeWithRelationsFragment);

	return ensureKeyOrder(ids, emailTypes);
};

module.exports = {
	batchGetEmailTypeById,
};
