const CollabRequest = {
	id: node => node.id,
	requester: (node, args, ctx) => ctx.db.collabRequest({id: node.id}).requester(),
	requestee: (node, args, ctx) => ctx.db.collabRequest({id: node.id}).requestee(),
	status: node => node.status,
	acceptedAt: node => node.acceptedAt,
	rejectedAt: node => node.rejectedAt,
	updatedAt: node => node.updatedAt,
	createdAt: node => node.createdAt,
};

module.exports = {
	CollabRequest,
};
