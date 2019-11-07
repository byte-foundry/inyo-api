const gql = String.raw;

const removeFile = async (parent, {id}, ctx) => {
	const removedFile = await ctx.db.file({id}).$fragment(gql`
		fragment RemovedFileTaskAndProject on File {
			filename
			linkedTask {
				id
				section {
					project {
						id
					}
				}
			}
			linkedProject {
				id
			}
		}
	`);

	if (!removedFile) {
		return null;
	}

	const project
		= removedFile.linkedTask && removedFile.linkedTask.section
			? removedFile.linkedTask.section.project
			: removedFile.linkedProject;

	await ctx.db.createUserEvent({
		type: 'REMOVED_ATTACHMENT',
		user: {
			connect: {id: ctx.userId},
		},
		metadata: {
			name: removedFile.filename,
		},
		task: removedFile.linkedTask && {connect: {id: removedFile.linkedTask.id}},
		project: project && {connect: {id: project.id}},
	});

	return ctx.db.deleteFile({id});
};

module.exports = {
	removeFile,
};
