const {getUserId} = require('../utils');
const {processUpload} = require('../files');

const updateUser = async (
	parent,
	{
		email: rawEmail,
		firstName,
		lastName,
		company,
		startWorkAt,
		endWorkAt,
		workingDays,
		timeZone,
		defaultVatRate,
		defaultDailyPrice,
		workingFields,
		skills,
		otherSkill,
		jobType,
		interestedFeatures,
		canBeContacted,
		painsExpressed,
		otherPain,
		hasUpcomingProject,
		settings,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const email = String(rawEmail || '').toLowerCase() || undefined;

	let logo;

	if (company && company.logo) {
		logo = await processUpload(company.logo, ctx, userId, 500000);
	}

	let banner;

	if (company && company.banner) {
		banner = await processUpload(company.banner, ctx, userId, 500000);
	}

	if (
		settings
		&& settings.language
		&& settings.language !== 'fr'
		&& settings.language !== 'en'
	) {
		throw new Error('Language is not supported. Must be either fr or en.');
	}

	return ctx.db.updateUser({
		where: {id: userId},
		data: {
			email,
			firstName,
			lastName,
			startWorkAt,
			endWorkAt,
			workingDays: {set: workingDays},
			timeZone,
			defaultVatRate,
			defaultDailyPrice,
			workingFields: {set: workingFields},
			skills: {set: skills},
			otherSkill,
			jobType,
			interestedFeatures: {set: interestedFeatures},
			painsExpressed: {set: painsExpressed},
			canBeContacted,
			otherPain,
			hasUpcomingProject,
			company: company && {
				update: {
					...company,
					address: company.address && {
						upsert: {
							create: company.address,
							update: company.address,
						},
					},
					logo: logo && {connect: {id: logo.id}},
					banner: banner && {connect: {id: banner.id}},
				},
			},
			settings: settings && {
				update: settings,
			},
		},
	});
};

module.exports = {
	updateUser,
};
