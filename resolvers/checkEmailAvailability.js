const checkEmailAvailability = async (parent, {email}, ctx) => {
	const isExisting = await ctx.db.$exists.user({email});

	return !isExisting;
};

module.exports = {
	checkEmailAvailability,
};
