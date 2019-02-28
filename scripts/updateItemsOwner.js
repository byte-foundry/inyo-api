const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

prisma
	.items({
		where: {
			owner: null,
			section: {
				project: {
					NOT: {owner: null},
				},
			},
		},
	})
	.$fragment(
		gql`
			fragment Owner on Item {
				id
				section {
					project {
						owner {
							id
						}
					}
				}
			}
		`,
	)
	.then((items) => {
		items.map(async (item) => {
			try {
				const updatedItem = await prisma.updateItem({
					where: {id: item.id},
					data: {
						owner: {connect: item.section.project.owner},
					},
				});

				console.log(updatedItem.id, 'updated owner');
			}
			catch (e) {
				console.log('oopsie', e);
			}

			await sleep(100);
		});
	});
