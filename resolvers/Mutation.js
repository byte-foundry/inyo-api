const uuid = require('uuid/v4');
const {hash, compare} = require('bcrypt');
const {sign, verify} = require('jsonwebtoken');

const gql = String.raw;

const {APP_SECRET, getUserId, getRootUrl} = require('../utils');
const {NotFoundError} = require('../errors');
const {processUpload} = require('../files');
const {sendResetPasswordEmail} = require('../emails/UserEmail');

const {checkEmailAvailability} = require('./checkEmailAvailability');
const {signup} = require('./signup');
const {createProject} = require('./createProject');
const {updateProject} = require('./updateProject');
const {finishProject} = require('./finishProject');
const {removeProject} = require('./removeProject');
const {startProject} = require('./startProject');
const {addItem} = require('./addItem');
const {updateItem} = require('./updateItem');
const {removeItem} = require('./removeItem');
const {snoozeItem} = require('./snoozeItem');
const {unsnoozeItem} = require('./unsnoozeItem');
const {finishItem} = require('./finishItem');
const {unfinishItem} = require('./unfinishItem');
const {postComment} = require('./postComment');
const {uploadAttachments} = require('./uploadAttachments');

const Mutation = {
	checkEmailAvailability,
	signup,
	sendResetPassword: async (parent, {email: rawEmail}, ctx) => {
		const email = String(rawEmail).toLowerCase();
		const user = await ctx.db.user({email});

		if (!user) {
			return true;
		}

		try {
			const resetToken = sign({email}, APP_SECRET, {expiresIn: 2 * 60 * 60});

			sendResetPasswordEmail({
				email,
				user: String(`${user.firstName} ${user.lastName}`).trim(),
				url: getRootUrl(`/auth/reset/${resetToken}`),
			});
		}
		catch (err) {
			throw new Error(
				'Something went wrong went resetting password, please try again.',
			);
		}

		return true;
	},
	checkResetPassword: async (parent, {resetToken}) => {
		// throws if expired or malformed
		await verify(resetToken, APP_SECRET);

		return true;
	},
	resetPassword: async (parent, {resetToken, newPassword}, ctx) => {
		// throws if expired or malformed
		const {email} = await verify(resetToken, APP_SECRET);

		const hashedPassword = await hash(newPassword, 10);

		await ctx.db.updateUser({
			where: {email},
			data: {password: hashedPassword},
		});

		return Mutation.login({}, {email, password: newPassword}, ctx);
	},

	login: async (parent, {email: rawEmail, password}, ctx) => {
		const email = String(rawEmail).toLowerCase();
		const user = await ctx.db.user({email});

		if (!user) {
			throw new NotFoundError(`No user found for email: ${email}`);
		}

		const valid = await compare(password, user.password);

		if (!valid) {
			throw new Error('Invalid password');
		}

		return {
			token: sign({userId: user.id}, APP_SECRET),
			user,
		};
	},
	updatePassword: async (parent, {oldPassword, newPassword}, ctx) => {
		const user = await ctx.db.user({id: getUserId(ctx)});

		const valid = await compare(oldPassword, user.password);

		if (!valid) {
			throw new Error('Invalid password');
		}

		const hashedPassword = await hash(newPassword, 10);

		return ctx.db.updateUser({
			where: {id: user.id},
			data: {password: hashedPassword},
		});
	},
	updateUser: async (
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
		const email = String(rawEmail).toLowerCase();

		let logo;

		if (company && company.logo) {
			logo = await processUpload(company.logo, ctx, userId);
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
					},
				},
				settings: settings && {
					update: settings,
				},
			},
		});
	},
	createCustomer: async (
		parent,
		{
			email: rawEmail, name, firstName, lastName, title,
		},
		ctx,
	) => {
		const email = String(rawEmail).toLowerCase();
		const company = await ctx.db.user({id: getUserId(ctx)}).company();

		return ctx.db.updateCompany({
			where: {
				id: company.id,
			},
			data: {
				customers: {
					create: {
						token: uuid(),
						email,
						name,
						firstName,
						lastName,
						title,
					},
				},
			},
		});
	},
	updateCustomer: async (parent, {id, customer}, ctx) => ctx.db.updateCustomer({
		where: {
			id,
			serviceCompany: {
				owner: {id: getUserId(ctx)},
			},
		},
		data: customer,
	}),
	createProject,
	updateProject,
	finishProject,
	removeProject,
	startProject,
	createQuote: () => {
		throw Error("It's not possible to create quote anymore.");
	},
	updateQuote: () => {
		throw Error("It's not possible to update quote anymore.");
	},
	removeQuote: () => {
		throw Error("It's not possible to remove a quote anymore.");
	},
	updateOption: () => {
		throw Error("It's not possible to update quote options anymore.");
	},
	addSection: async (
		parent,
		{
			optionId, projectId, name, items = [], position: wantedPosition,
		},
		ctx,
	) => {
		if (optionId) {
			throw Error("It's not possible to add section to quote anymore.");
		}

		let variables = {};

		if (projectId) {
			const userId = getUserId(ctx);
			const [project] = await ctx.db.projects({
				where: {
					id: projectId,
					OR: [
						{
							owner: {id: userId},
						},
						{
							customer: {
								serviceCompany: {
									owner: {
										id: userId,
									},
								},
							},
						},
					],
				},
			}).$fragment(gql`
				fragment ProjectWithSection on Project {
					id
					sections(orderBy: position_ASC) {
						id
						position
					}
				}
			`);

			if (!project) {
				throw new NotFoundError(`Project '${projectId}' has not been found.`);
			}

			// default position: end of the list
			let position = project.sections.length;

			if (typeof wantedPosition === 'number') {
				const wantedPositionSectionIndex = project.sections.findIndex(
					section => section.position === wantedPosition,
				);

				if (wantedPositionSectionIndex !== -1) {
					position = wantedPosition;

					// updating all the positions from the item position
					await Promise.all(
						project.sections.slice(position).map((section, index) => ctx.db.updateSection({
							where: {id: section.id},
							data: {position: position + index + 1},
						})),
					);
				}
			}

			variables = {
				project: {connect: {id: projectId}},
				position,
			};
		}

		// eslint-disable-next-line no-param-reassign
		items.forEach((item, index) => {
			item.position = index;
		});

		return ctx.db.createSection({
			...variables,
			name,
			items: {create: items},
		});
	},
	updateSection: async (parent, {id, name, position: wantedPosition}, ctx) => {
		const userId = getUserId(ctx);
		const [section] = await ctx.db.sections({
			where: {
				id,
				project: {
					OR: [
						{
							owner: {
								id: userId,
							},
						},
						{
							customer: {
								serviceCompany: {
									owner: {
										id: userId,
									},
								},
							},
						},
					],
				},
			},
		}).$fragment(gql`
			fragment sectionWithProject on Section {
				id
				project {
					sections(orderBy: position_ASC) {
						id
					}
				}
			}
		`);

		if (!section) {
			throw new NotFoundError(`Section '${id}' has not been found.`);
		}

		const {project} = section;
		let position;
		const initialPosition = project.sections.findIndex(
			projectSection => projectSection.id === section.id,
		);

		if (initialPosition === -1) {
			throw new Error(
				`Section '${section.id}' has not been found in Project '${
					section.project.id
				}' sections.`,
			);
		}

		if (
			typeof wantedPosition === 'number'
			&& wantedPosition !== initialPosition
		) {
			if (wantedPosition < 0) {
				position = 0;
			}
			else if (wantedPosition > project.sections.length) {
				position = project.sections.length;
			}
			else {
				position = wantedPosition;
			}

			// TODO: externalize
			const reorderProject = async (
				sections,
				initialPosition, // eslint-disable-line no-shadow
				wantedPosition, // eslint-disable-line no-shadow
				ctx, // eslint-disable-line no-shadow
			) => {
				const itemsToUpdate
					= wantedPosition > initialPosition
						? sections.slice(initialPosition + 1, wantedPosition + 1)
						: sections.slice(wantedPosition, initialPosition);

				const startIndex
					= wantedPosition > initialPosition
						? initialPosition
						: wantedPosition + 1;

				await Promise.all(
					itemsToUpdate.map((sectionItem, index) => ctx.db.updateSection({
						where: {id: sectionItem.id},
						data: {position: startIndex + index},
					})),
				);
			};

			reorderProject(project.sections, initialPosition, position, ctx);
		}

		return ctx.db.updateSection({
			where: {id},
			data: {name, position},
		});
	},
	removeSection: async (parent, {id}, ctx) => {
		const [section] = await ctx.db.sections({
			where: {
				id,
				project: {
					customer: {
						serviceCompany: {
							owner: {
								id: getUserId(ctx),
							},
						},
					},
				},
			},
		});

		if (!section) {
			throw new NotFoundError(`Section '${id}' has not been found.`);
		}

		return ctx.db.deleteSection({id});
	},
	addItem,
	updateItem,
	updateValidatedItem: () => {
		throw Error('Validated item are not supported.');
	},
	removeItem,
	sendQuote: () => {
		throw Error("It's not possible to send quote anymore.");
	},
	snoozeItem,
	unsnoozeItem,
	finishItem,
	unfinishItem,
	sendAmendment: async () => {
		throw Error("It's not possible to send amendment anymore.");
	},
	acceptItem: () => {
		throw Error('Accepting item is not supported anymore');
	},
	rejectItem: () => {
		throw Error('Rejecting item is not supported anymore');
	},
	acceptQuote: () => {
		throw Error('Quotes are not supported anymore');
	},
	rejectQuote: () => {
		throw Error('Quotes are not supported anymore');
	},
	acceptAmendment: () => {
		throw Error('Amendments are not supported anymore');
	},
	rejectAmendment: () => {
		throw Error('Amendments are not supported anymore');
	},
	postComment,
	uploadAttachments,
};

module.exports = {
	Mutation,
};
