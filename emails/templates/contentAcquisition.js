const templates = {
	DELAY: {
		en: {},
		fr: {
			subject: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ' - ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczmva3hj0737xv4dp273',
											name: 'task.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
					],
				},
			},
			content: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Bonjour ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczoua3jb0737dte08a6u',
											name: 'customer.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'customer.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ',',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczooa3j70737iag0x6kx',
											name: 'customer.lastname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'customer.lastname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text:
										' me charge de récupérer les contenus pour le projet en cours ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '.',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Merci de les envoyer en répondant à ce mail ou en les déposant au lien suivant :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczn3a3hr0737qgsdg62p',
											name: 'task.link',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.link',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Voici la liste des documents nécessaires :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Une fois les documents déposés, merci de cocher les cases correspondantes.',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										"N'hésitez pas à revenir vers moi en cas de difficultés.",
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	FIRST: {
		en: {},
		fr: {
			subject: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ' - ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczmva3hj0737xv4dp273',
											name: 'task.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
					],
				},
			},
			content: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Bonjour ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczoua3jb0737dte08a6u',
											name: 'customer.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'customer.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ',',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Sauf erreur de ma part, il manque encore des documents pour le projet en cours ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '.',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										"Avez-vous besoin de plus d'informations pour produire ces contenus?",
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Posez-nous vos questions ou envoyez ces contenus en réponse à ce mail ou au lien suivant :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczmva3hj0737xv4dp273',
											name: 'task.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Les documents encore manquants :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Une fois les documents déposés, merci de cocher les cases correspondantes.',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										"N'hésitez pas à revenir vers moi en cas de difficultés, nous serons ravis de vous aider.",
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	SECOND: {
		en: {},
		fr: {
			subject: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ' - ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczmva3hj0737xv4dp273',
											name: 'task.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
					],
				},
			},
			content: {
				object: 'value',
				document: {
					object: 'document',
					data: {},
					nodes: [
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Bonjour ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczoua3jb0737dte08a6u',
											name: 'customer.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'customer.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ',',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										"Je me permets de revenir vers vous car il semblerait qu'il manque encore des documents pour le projet en cours ",
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczq6a3kb0737h4yugmro',
											name: 'project.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'project.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Éprouvez-vous des difficultés pour produire ces contenus?',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Posez-nous vos questions ou envoyez ces contenus en réponse à ce mail ou au lien suivant :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczmva3hj0737xv4dp273',
											name: 'task.name',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.name',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: 'Pour information, les documents concernés :',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text: '',
									marks: [],
								},
							],
						},
						{
							object: 'block',
							type: 'paragraph',
							data: {},
							nodes: [
								{
									object: 'text',
									text:
										'Dans tous les cas, je reste à votre disposition par email si vous aviez la moindre question.',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
};

module.exports = templates;
