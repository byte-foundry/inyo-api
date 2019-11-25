const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const EmailTemplateWithRelationsFragment = gql`
	fragment EmailTemplateWithRelationsId on Tag {
		id
		timing
		subject
		content
		type {
			id
		}
	}
`;

const batchGetEmailTemplateById = async (ids, db) => {
	const emailTemplates = await db
		.emailTemplates({where: {id_in: ids}})
		.$fragment(EmailTemplateWithRelationsFragment);

	return ensureKeyOrder(ids, emailTemplates);
};

module.exports = {
	batchGetEmailTemplateById,
};
