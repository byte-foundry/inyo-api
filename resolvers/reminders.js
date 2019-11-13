const {getUserId, createItemOwnerFilter} = require('../utils');

const reminders = async (root, args, ctx) => ctx.db.reminders({
	where: {
		type_in: [
			'DELAY',
			'FIRST',
			'SECOND',
			'LAST',
			'INVOICE_DELAY',
			'INVOICE_FIRST',
			'INVOICE_SECOND',
			'INVOICE_THIRD',
			'INVOICE_FOURTH',
			'INVOICE_LAST',
		],
		item: {
			AND: [
				createItemOwnerFilter(getUserId(ctx)),
				{
					OR: [
						{
							section: null,
						},
						{
							section: {
								project: {
									status: 'ONGOING',
								},
							},
						},
					],
				},
			],
		},
		sendingDate_gt: new Date(),
	},
});

module.exports = {
	reminders,
};
