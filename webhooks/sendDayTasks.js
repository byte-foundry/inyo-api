const crypto = require('crypto');

const gql = String.raw;

const {prisma} = require('../generated/prisma-client');
const {getAppUrl} = require('../utils');
const {sendMorningEmail} = require('../emails/UserEmail');

const sendDayTasks = async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));

	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		throw new Error('The signature has not been verified.');
	}

	const user = await prisma.user({id: req.body.userId});
	const projects = await prisma.projects({
		where: {
			customer: {
				serviceCompany: {
					owner: {
						id: req.body.userId,
					},
				},
			},
			deadline_not: null,
			status: 'ONGOING',
			// the projects must have at least one user's pending item
			sections_some: {items_some: {status: 'PENDING', reviewer: 'USER'}},
		},
	}).$fragment(gql`
		fragment Projects on Project {
			id
			name
			deadline
			sections(
				# the sections we want must have at least a pending item
				where: {items_some: {status: PENDING}}
			) {
				id
				# we want the pending items
				items(where: {status: PENDING}) {
					id
					name
					unit
					reviewer
					status
				}
			}
		}
	`);

	// filtering out non-active / blocked projects
	const projectsTheUserCanWorkOn = projects.filter((project) => {
		/* eslint-disable */
		for (const section of project.sections) {
			for (const item of section.items) {
				if (item.status === 'PENDING') {
					return item.reviewer === 'USER';
				}
			}
		}
		/* eslint-enable */
		return false;
	});

	// applying a score to each item
	const projectItems = projectsTheUserCanWorkOn
		.reduce((itemsList, project) => {
			// flattening sections into a single list with additional item properties
			const items = project.sections.reduce(
				(sectionItems, section) => sectionItems.concat(
					section.items.map(item => ({
						...item,
						sectionId: section.id,
						projectId: project.id,
						url: getAppUrl(`/projects/${project.id}/#${item.id}`),
					})),
				),
				[],
			);

			// adding the score (was easier that way)
			return itemsList.concat(
				items.map((item, index) => {
					const hoursLeft = items
						.slice(index)
						.reduce((sum, {unit}) => sum + unit, 0);
					const hoursUntilDeadline
						= (new Date(project.deadline) - new Date()) / 1000 / 60 / 60;

					return {
						...item,
						score: hoursUntilDeadline - hoursLeft,
					};
				}),
			);
		}, [])
		// keeping only the tasks user can do
		// TODO: filter everything after the first CUSTOMER reviewer task
		.filter(item => item.reviewer === 'USER');

	const projectItemsByScore = projectItems.sort((a, b) => a.score > b.score);

	// selecting which items to send (according to the number of hours the user is going to work)
	const selectedItems = projectItemsByScore.splice(0, 3);

	let userWorkingTime = 8; // default working time

	if (user.startWorkAt && user.endWorkAt) {
		const startWorkAt = new Date(`1970-01-01T${user.startWorkAt}`);
		const endWorkAt = new Date(`1970-01-01T${user.endWorkAt}`);

		if (endWorkAt > startWorkAt) {
			userWorkingTime = (endWorkAt - startWorkAt) / 1000 / 60 / 60;
		}
		else {
			userWorkingTime = 24 - (startWorkAt - endWorkAt) / 1000 / 60 / 60;
		}
	}

	while (
		selectedItems.reduce((sum, {unit}) => sum + unit, 0) < userWorkingTime
		&& selectedItems.length < 8
		&& projectItemsByScore.length
	) {
		selectedItems.push(projectItemsByScore.splice(0, 1)[0]);
	}

	const selectedProjects = [];

	selectedItems.forEach((item) => {
		// project already exist in list ?
		const alreadyInsertedProject = selectedProjects.find(
			project => project.id === item.projectId,
		);

		if (alreadyInsertedProject) {
			// section already exist in list ?
			const alreadyInsertedSection = alreadyInsertedProject.sections.find(
				section => section.id === item.sectionId,
			);

			if (alreadyInsertedSection) {
				alreadyInsertedSection.items.push(item);

				return;
			}

			const sectionToInsert = projectsTheUserCanWorkOn
				.find(project => item.projectId === project.id)
				.sections.find(section => item.sectionId === section.id);

			alreadyInsertedProject.sections.push({
				...sectionToInsert,
				items: [item],
			});

			return;
		}

		// doesn't exist ?
		const projectToInsert = projectsTheUserCanWorkOn.find(
			project => item.projectId === project.id,
		);
		const sectionToInsert = projectToInsert.sections.find(
			section => item.sectionId === section.id,
		);

		selectedProjects.push({
			...projectToInsert,
			sections: [
				{
					...sectionToInsert,
					items: [item],
				},
			],
		});
	});

	sendMorningEmail({
		email: user.email,
		user: `${user.firstName} ${user.lastName}`.trim(),
		projects: selectedProjects,
	});

	console.log(`Sent day tasks to User '${user.email}'`);

	res.status(200).send();
};

module.exports = {
	sendDayTasks,
};
