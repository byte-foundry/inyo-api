const uuid = require('uuid/v4');

const {getUserId, TAG_COLOR_PALETTE} = require('../utils');

const createProject = async (
	parent,
	{
		customerId,
		customer,
		name,
		sharedNotes,
		personalNotes,
		template,
		sections,
		deadline,
		budget,
		notifyActivityToCustomer,
	},
	ctx,
) => {
	const userId = getUserId(ctx);
	const userCompany = await ctx.db.user({id: userId}).company();

	const variables = {};

	if (customerId) {
		variables.customer = {
			connect: {id: customerId},
		};
	}
	else if (customer) {
		variables.customer = {
			create: {
				...customer,
				token: uuid(),
				serviceCompany: {connect: {id: userCompany.id}},
				address: {
					create: customer.address,
				},
			},
		};
	}

	const tagsMap = new Map();

	if (sections) {
		const templateTags = new Set(
			sections.reduce(
				(tags, section) => (section.items
					? tags.concat(
						...section.items.reduce(
							(itemTags, item) => (item.tags ? itemTags.concat(item.tags) : itemTags),
							[],
						),
						  )
					: tags),
				[],
			),
		);

		if (templateTags.size > 0) {
			const userTags = await ctx.db.tags({where: {owner: {id: userId}}});

			let newTagsCount = 0;

			await Promise.all(
				[...templateTags].map(async (tag) => {
					const tagExists = userTags.find(t => t.name === tag);

					if (tagExists) {
						tagsMap.set(tag, tagExists.id);
					}
					else {
						const [colorBg, colorText] = TAG_COLOR_PALETTE[
							(userTags.length + newTagsCount) % TAG_COLOR_PALETTE.length
						].map(
							color => `#${color.map(p => p.toString(16).padStart(2, '0')).join('')}`,
						);

						newTagsCount++;

						const newTag = await ctx.db.createTag({
							name: tag,
							colorBg,
							colorText,
							owner: {connect: {id: userId}},
						});

						tagsMap.set(tag, newTag.id);
					}
				}),
			);
		}
	}

	const createdProject = await ctx.db.createProject({
		...variables,
		name: name || 'Nom du projet',
		sharedNotes,
		personalNotes,
		template,
		token: uuid(),
		owner: {connect: {id: userId}},
		sections: sections && {
			create: sections.map((section, sectionIndex) => ({
				...section,
				items: section.items && {
					create: section.items.map((item, index) => ({
						...item,
						owner: {connect: {id: userId}},
						tags: item.tags && {
							connect: item.tags.map(tagName => ({
								id: tagsMap.get(tagName),
							})),
						},
						position: index,
					})),
				},
				position: sectionIndex,
			})),
		},
		status: 'ONGOING',
		budget,
		notifyActivityToCustomer,
		deadline,
	});

	await ctx.db.createUserEvent({
		type: 'CREATED_PROJECT',
		user: {
			connect: {id: userId},
		},
		metadata: {
			id: createdProject.id,
		},
		project: {
			connect: {id: createdProject.id},
		},
	});

	return createdProject;
};

module.exports = {
	createProject,
};
