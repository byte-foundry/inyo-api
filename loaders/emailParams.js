const {ensureKeyOrder} = require('../utils');

const batchGetEmailParamById = async (ids, db) => {
	const emailParams = await db.emailParams({where: {id_in: ids}});

	return ensureKeyOrder(ids, emailParams);
};

module.exports = {
	batchGetEmailParamById,
};
