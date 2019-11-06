const gql = String.raw;

const removeFile = async (parent, {id}, ctx) => {
	const removedFile = await ctx.db.deleteFile({id}).$fragment(gql`
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
		item: removedFile.linkedTask && {connect: {id: removedFile.linkedTask.id}},
		project: project && {connect: {id: project.id}},
	});

	return removedFile;
};

module.exports = {
	removeFile,
};
