const {hash} = require('bcrypt');
const {prisma} = require('../generated/prisma-client');

const teardownAndSetupTest = (req, res) => {
	const {users} = req.body;

	users.forEach(async ({email: rawEmail}) => {
		const email = String(rawEmail).toLowerCase();

		try {
			await prisma.deleteUser({
				email,
			});
		}
		catch (e) {
			console.log(e.message);
		}
	});

	users.forEach(async ({
		email: rawEmail, password, firstName, lastName,
	}) => {
		const email = String(rawEmail).toLowerCase();
		const isExisting = await prisma.$exists.user({email});

		const hashedPassword = await hash(password, 10);

		if (isExisting) {
			res.send(409).send('This email is already registered');
		}

		try {
			await prisma.createUser({
				email,
				password: hashedPassword,
				firstName,
				lastName,
				company: {
					create: {},
				},
				settings: {
					create: {},
				},
			});

			console.log(`user with email ${email} created for tests`);
		}
		catch (e) {
			res.send(500).send(e.message);
		}
	});

	res.status(200).send();
};

module.exports = {
	teardownAndSetupTest,
};
