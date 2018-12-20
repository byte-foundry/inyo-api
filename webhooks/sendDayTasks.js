const crypto = require('crypto');
const moment = require('moment-timezone');

const gql = String.raw;

const {prisma} = require('../generated/prisma-client');
const {getAppUrl} = require('../utils');
const {sendMorningEmail} = require('../emails/UserEmail');

const weekDays = {
	1: 'MONDAY',
	2: 'TUESDAY',
	3: 'WEDNESDAY',
	4: 'THURSDAY',
	5: 'FRIDAY',
	6: 'SATURDAY',
	0: 'SUNDAY',
};

const sendDayTasks = async (req, res) => {
	const hmac = crypto.createHmac('sha256', process.env.POSTHOOK_SIGNATURE);

	// look for X-Ph-Signature in ctx
	hmac.update(JSON.stringify(req.body));

	const hmacSignature = hmac.digest('hex');

	if (hmacSignature !== req.get('x-ph-signature')) {
		throw new Error('The signature has not been verified.');
	}

	const user = await prisma.user({id: req.body.data.userId});

	const dayNumber = moment()
		.tz(user.timeZone || 'Europe/Paris')
		.day();

	// the user is not working today, second round
	if (!user.workingDays.includes(weekDays[dayNumber])) {
		console.log(
			`Prevented a morning email for ${
				user.email
			} on a day off. Is scheduling function wrong?`,
		);
		res.status(200).send();
		return;
	}

	const projects = await prisma.projects({
		where: {
			customer: {
				serviceCompany: {
					owner: {
						id: req.body.data.userId,
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

	// applying a score to each item
	const projectItemsByScore = projectsTheUserCanWorkOn
		.reduce((itemsList, project) => {
			const items = [];

			// flattening sections into a single list with additional item properties
			// eslint-disable-next-line no-restricted-syntax
			for (const section of project.sections) {
				// eslint-disable-next-line no-restricted-syntax
				for (const item of section.items) {
					// keeping only the tasks user can do
					if (item.reviewer !== 'USER') {
						break;
					}

					items.push({
						...item,
						sectionId: section.id,
						projectId: project.id,
						url: getAppUrl(`/projects/${project.id}/see#${item.id}`),
						formattedUnit: item.unit + (item.unit > 1 ? ' jours' : ' jour'),
					});
				}
			}

			const hoursUntilDeadline
				= (new Date(project.deadline) - new Date()) / 1000 / 60 / 60;

			// adding the score (was easier that way)
			return itemsList.concat(
				items.map((item, index) => {
					const timeLeft = items
						.slice(index)
						.reduce((sum, {unit}) => sum + unit, 0);

					return {
						...item,
						// litteral 24h time until deadline - hours the user has plan to work on those tasks
						score: hoursUntilDeadline - timeLeft * userWorkingTime,
					};
				}),
			);
		}, [])
		.sort((a, b) => a.score - b.score);

	// selecting which items to send (according to the number of hours the user is going to work)
	const selectedItems = projectItemsByScore.splice(0, 3);

	while (
		selectedItems.reduce((sum, {unit}) => sum + unit, 0) * userWorkingTime
			< userWorkingTime
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
