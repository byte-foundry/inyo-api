const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

prisma
	.items({
		where: {
			scheduledFor_not: null,
		},
	})
	.$fragment(
		gql`
			fragment ScheduledItem on Item {
				id
				status
				scheduledFor
				schedulePosition
				scheduledForDays {
					id
				}
			}
		`,
	)
	.then((items) => {
		items.map(async (item) => {
			try {
				if (item.scheduledForDays.length > 0) {
					const updatedItem = await prisma.updateItem({
						where: {id: item.id},
						data: {
							scheduledForDays: {
								update: {
									where: {id: item.scheduledForDays[0]},
									data: {
										date: item.scheduledFor,
										position: 0,
										status: item.status,
									},
								},
							},
						},
					});
					console.log(updatedItem.id, 'already migrated but updated');
				}
				else {
					const updatedItem = await prisma.updateItem({
						where: {id: item.id},
						data: {
							scheduledForDays: {
								create: {
									date: item.scheduledFor,
									position: 0,
									status: item.status,
								},
							},
						},
					});

					console.log(updatedItem.id, 'migrated');
				}
			}
			catch (e) {
				console.log('oopsie', e);
			}

			await sleep(100);
		});
	});
