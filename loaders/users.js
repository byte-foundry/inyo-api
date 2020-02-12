const gql = String.raw;
const {ensureKeyOrder} = require('../utils');

const UserWithRelationsFragment = gql`
	fragment UserWithRelationsId on User {
		id
		email
		hmacIntercomId
		password
		firstName
		lastName
		startWorkAt
		endWorkAt
		startBreakAt
		endBreakAt
		workingDays
		timeZone
		defaultDailyPrice
		defaultVatRate
		workingFields
		otherSkill
		skills
		otherPain
		painsExpressed
		canBeContacted
		jobType
		interestedFeatures
		hasUpcomingProject
		createdAt
		updatedAt
		lifetimePayment
		tasks {
			id
		}
		collaborationProjects {
			id
		}
	}
`;

const batchGetUserById = async (ids, db) => {
	const users = await db
		.users({where: {id_in: ids}})
		.$fragment(UserWithRelationsFragment);

	return ensureKeyOrder(ids, users);
};

const batchGetUserByTaskId = async (ids, db) => {
	const users = await db
		.users({where: {tasks_some: {id_in: ids}}})
		.$fragment(UserWithRelationsFragment);

	return ids.map(id => users.find(user => user.tasks.find(item => item.id === id)));
};

const batchGetCollaboratorsByProjectId = async (ids, db) => {
	const users = await db
		.users({where: {collaborationProjects_some: {id_in: ids}}})
		.$fragment(UserWithRelationsFragment);

	return ids.map(id => users.filter(user => user.collaborationProjects.some(project => project.id === id)));
};

module.exports = {
	batchGetUserById,
	batchGetUserByTaskId,
	batchGetCollaboratorsByProjectId,
};
