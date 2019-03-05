const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

prisma
	.projects({
		where: {
			owner: null,
		},
	})
	.$fragment(
		gql`
			fragment Owner on Project {
				id
				customer {
					serviceCompany {
						owner {
							id
						}
					}
				}
			}
		`,
	)
	.then((projects) => {
		projects.map(async (project) => {
			try {
				const updatedProject = await prisma.updateProject({
					where: {id: project.id},
					data: {
						owner: {connect: project.customer.serviceCompany.owner},
					},
				});

				console.log(updatedProject.id, 'updated owner');
			}
			catch (e) {
				console.log('oopsie', e);
			}

			await sleep(100);
		});
	});
