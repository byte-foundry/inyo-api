const COMMENT_ADDED = require('./commentAdded');
const CUSTOMER_REPORT = require('./customerReport');
const CONTENT_ACQUISITION = require('./contentAcquisition');
const CUSTOMER = require('./customer');
const INVOICE = require('./invoice');

const templates = {
	COMMENT_ADDED,
	CUSTOMER_REPORT,
	CONTENT_ACQUISITION,
	CUSTOMER,
	INVOICE,
};

const baseArguments = {
	fr: {
		task: {
			name: 'Créer la base de donnée',
			description:
				"La création de la base de données MySQL sur le serveur ovh a l'adresse 192.168.0.1",
			link: 'https://inyo.me',
			attachments: [
				{
					url: 'http://inyo.me',
					filename: 'facture.txt',
				},
			],
			listOfAttachmentNotUploaded: 'list of attachments',
			threadOfComments: [
				{
					author: 'Richard Sammel',
					text:
						'Des scientifiques font des expériences sur les mouches drosophiles parce que la structure de leur cerveau est extrêmement proche de la nôtre.',
					createdAt: '10/03/2019 à 13h37',
				},
				{
					author: 'Constantin Alexandrov',
					text:
						'Le cheval nous voit plus grand que nous sommes avec son œil déformant. Ce n’est que grâce à cela que nous l’avons domestiqué.',
					createdAt: '10/03/2019 à 16h20',
				},
			],
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
			listOfTasksCompletedOnDay: {
				tasks: [
					{
						name: 'Tâche 1',
					},
					{
						name: 'Tâche 2',
					},
				],
				projects: [
					{
						name: 'Projet 1',
						url: 'https://inyo.me',
						sections: [
							{
								items: [
									{
										name: 'Tâche 1',
									},
									{
										name: 'Tâche 2',
									},
								],
							},
						],
					},
					{
						name: 'Projet 2',
						url: 'https://inyo.me',
						sections: [
							{
								items: [
									{
										name: 'Tâche 1',
									},
									{
										name: 'Tâche 2',
									},
								],
							},
						],
					},
				],
			},
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

const getDefaultTemplate = (category, type, language) => templates[category][type][language];

const createTemplate = async (ctx, userId, type, language) => {
	let templateContent;

	if (
		templates[type.category]
		&& templates[type.category][type.name]
		&& templates[type.category][type.name][language]
	) {
		try {
			templateContent = getDefaultTemplate(type.category, type.name, language);
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
				timing: templateContent.timing,
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
	getDefaultTemplate,
};
