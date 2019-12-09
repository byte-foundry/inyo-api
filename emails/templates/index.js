const CUSTOMER = require('./customer');
const INVOICE = require('./invoice');
const CONTENT_ACQUISITION = require('./contentAcquisition');

const templates = {
	CUSTOMER,
	INVOICE,
	CONTENT_ACQUISITION,
};

const baseArguments = {
	fr: {
		task: {
			name: 'Créer la base de donnée',
			description:
				"La création de la base de données MySQL sur le serveur ovh a l'adresse 192.168.0.1",
			link: 'https://inyo.me',
			attachments: 'attachments',
			listOfAttachmentNotUploaded: 'list of attachments',
			threadOfComments: 'threadOfComments',
		},
		project: {
			name: 'Projet très important',
			deadline: 'hier',
			budget: '1 337 €',
			link: 'https://inyo.me',
		},
		user: {
			firstname: 'Jean',
			lastname: 'Dujardin',
			fullname: 'Jean Dujardin',
			phone: '06 36 65 65 65',
			email: 'jean@du.jardin',
			listOfTasksCompletedOnDay: 'listOfTasksCompletedOnDay',
		},
		customer: {
			firstname: 'Benoît',
			lastname: 'Poelvoorde',
			fullname: 'M. Benoît Poelvoorde',
			phone: '0810 118 218',
			email: 'ben@poel.voorde',
		},
		recipient: {
			firstname: 'Benoît',
			lastname: 'Poelvoorde',
			fullname: 'M. Benoît Poelvoorde',
		},
		author: {
			firstname: 'Jean',
			lastname: 'Dujardin',
			fullname: 'Jean Dujardin',
		},
		comment: {
			text:
				'Tout va bien de mon côté. Quand est-ce que le Projet très important sera prêt ?',
			createdAt: '18/06/1940',
		},
	},
	en: {
		task: {
			name: 'Créer la base de donnée',
			description:
				"La création de la base de données MySQL sur le serveur ovh a l'adresse 192.168.0.1",
			link: 'https://inyo.me',
			attachments: 'attachments',
			listOfAttachmentNotUploaded: 'list of attachments',
			threadOfComments: 'threadOfComments',
		},
		project: {
			name: 'Projet très important',
			deadline: 'hier',
			budget: '1 337 €',
			link: 'https://inyo.me',
		},
		user: {
			firstname: 'Jean',
			lastname: 'Dujardin',
			fullname: 'Jean Dujardin',
			phone: '06 36 65 65 65',
			email: 'jean@du.jardin',
			listOfTasksCompletedOnDay: 'listOfTasksCompletedOnDay',
		},
		customer: {
			firstname: 'Benoît',
			lastname: 'Poelvoorde',
			fullname: 'M. Benoît Poelvoorde',
			phone: '0810 118 218',
			email: 'ben@poel.voorde',
		},
		recipient: {
			firstname: 'Benoît',
			lastname: 'Poelvoorde',
			fullname: 'M. Benoît Poelvoorde',
		},
		author: {
			firstname: 'Jean',
			lastname: 'Dujardin',
			fullname: 'Jean Dujardin',
		},
		comment: {
			text:
				'Tout va bien de mon côté. Quand est-ce que le Projet très important sera prêt ?',
			createdAt: '18/06/1940',
		},
	},
};

const createTemplate = async (ctx, userId, type, language) => {
	let templateContent;

	if (
		templates[type.category]
		&& templates[type.category][type.name]
		&& templates[type.category][type.name][language]
	) {
		try {
			templateContent = templates[type.category][type.name][language];
		}
		catch (e) {
			console.log(
				`no template right now for ${type.category} ${type.name} ${language}`,
			);
		}

		if (templateContent) {
			const emailTemplate = await ctx.db.createEmailTemplate({
				type: {
					connect: {id: type.id},
				},
				timing: 'euh',
				subject: templateContent.subject,
				content: templateContent.content,
				owner: {connect: {id: userId}},
			});

			ctx.db.updateEmailType({
				where: {id: type.id},
				data: {
					emailTemplates: {connect: {id: emailTemplate.id}},
				},
			});

			return emailTemplate;
		}
	}

	return null;
};

const createAllTemplates = async (ctx, language) => {
	const {userId} = ctx;

	const emailTemplates = await ctx.db.user({id: userId}).emailTemplates();

	if (emailTemplates.length === 0) {
		const types = await ctx.db.emailTypes();

		types.forEach(async (type) => {
			createTemplate(ctx, userId, type, language);
		});
	}
};

module.exports = {
	createTemplate,
	createAllTemplates,
	baseArguments,
};
