const checkEmailAvailability = async (parent, {email}, ctx) => {
	const isExisting = await ctx.db.$exists.user({
		email: String(email).toLowerCase(),
	});

	return !isExisting;
};

module.exports = {
	checkEmailAvailability,
};
