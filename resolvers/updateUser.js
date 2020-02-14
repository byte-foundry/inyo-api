const {getUserId} = require('../utils');
const {processUpload} = require('../files');
const {createAllTemplates} = require('../emails/templates');

const updateUser = async (
	parent,
	{
		email: rawEmail,
		firstName,
		lastName,
		company,
		startWorkAt,
		endWorkAt,
		startBreakAt,
		endBreakAt,
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
		const file = await processUpload(company.logo, ctx, userId, 500000);

		logo = {connect: {id: file.id}};
	}
	else if (company && company.logo === null) {
		const existingLogo = await ctx.db
			.user({id: userId})
			.company()
			.logo();

		logo = existingLogo ? {disconnect: true} : undefined;
	}

	const bannerProperties = {};

	if (company && company.banner) {
		const banner = await processUpload(company.banner, ctx, userId, 1000000);

		bannerProperties.banner = {connect: {id: banner.id}};
		bannerProperties.bannerUnsplashId = null;
	}
	else if (company && company.bannerUnsplashId) {
		const existingBanner = await ctx.db
			.user({id: userId})
			.company()
			.banner();

		// trigger download photo (required by Unsplash)
		ctx.dataSources.photo.downloadPhoto({id: company.bannerUnsplashId});

		bannerProperties.banner = existingBanner ? {disconnect: true} : undefined;
		bannerProperties.bannerUnsplashId = company.bannerUnsplashId;
	}
	else if (
		company
		&& (company.bannerUnsplashId === null || company.banner === null)
	) {
		const existingBanner = await ctx.db
			.user({id: userId})
			.company()
			.banner();

		bannerProperties.banner = existingBanner ? {disconnect: true} : undefined;
		bannerProperties.bannerUnsplashId = null;
	}

	const documents = {connect: []};

	if (company && company.documents) {
		const documentsFiles = await Promise.all(
			company.documents.map(file => processUpload(file, ctx, userId), 1000000),
		);

		await Promise.all(
			documentsFiles.map(({id}) => ctx.db.updateFile({
				where: {id},
				data: {
					documentType: 'ADMIN',
					ownerUser: {connect: {id: ctx.userId}},
				},
			})),
		);

		documents.connect = documentsFiles.map(d => ({id: d.id}));
	}

	if (
		settings
		&& settings.language
		&& settings.language !== 'fr'
		&& settings.language !== 'en'
	) {
		throw new Error('Language is not supported. Must be either fr or en.');
	}

	if (settings && settings.language) {
		createAllTemplates(ctx, settings.language);
	}

	return ctx.db.updateUser({
		where: {id: userId},
		data: {
			email,
			firstName,
			lastName,
			startWorkAt,
			endWorkAt,
			startBreakAt,
			endBreakAt,
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
					logo,
					...bannerProperties,
					documents,
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
