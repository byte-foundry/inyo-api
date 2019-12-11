const templates = {
	INVOICE_DELAY: {
		en: {},
		fr: {
			timing: {
				value: 5,
				unit: 'minutes',
				isRelative: false,
			},
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
									text: 'Facture liée au projet ',
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
											id: 'ck3yjczpia3jv0737mhu8d5su',
											name: 'user.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'user.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text:
										" m'a demandé de vous faire parvenir notre facture en date du correspondant au projet que vous pouvez consulter au lien suivant:",
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
										'La facture est téléchargeable directement à cette adresse:',
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
										'Je vous serais reconnaissant de respecter le délai légal de 30 jours pour ce paiement.',
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
										'Merci de revenir vers moi par retour de mail si vous aviez la moindre question.',
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
										"Dans l'attente, nous vous souhaitons une agréable journée.",
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
									text: 'Cordialement,',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	INVOICE_FIRST: {
		en: {},
		fr: {
			timing: {
				value: 12,
				unit: 'days',
				isRelative: false,
			},
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
									text: 'Règlement facture pour le projet ',
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
										'Je reviens vers vous pour savoir si vous avez bien reçu notre facture pour le projet ',
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
										'La facture est téléchargeable directement à cette adresse:',
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
											id: 'ck3yjczn6a3hv0737kkw976gu',
											name: 'task.attachments',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.attachments',
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
									text:
										'Je vous serais reconnaissant de respecter le délai légal de 30 jours pour ce paiement.',
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
										'Merci de revenir vers moi par retour de mail si vous aviez la moindre question.',
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
										"Dans l'attente, nous vous souhaitons une agréable journée.",
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
									text: 'Cordialement,',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	INVOICE_SECOND: {
		en: {},
		fr: {
			timing: {
				value: 20,
				unit: 'days',
				isRelative: false,
			},
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
									text: 'Règlement facture pour le projet ',
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
										"Sauf erreur de notre part, nous n'avons pas encore reçu votre paiement pour le projet ",
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
										'Vous pouvez la télécharger directement à cette adresse:',
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
											id: 'ck3yjczn6a3hv0737kkw976gu',
											name: 'task.attachments',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.attachments',
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
									text:
										'Je vous serais reconnaissant de respecter le délai légal de 30 jours pour ce paiement.',
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
										'Merci de revenir vers moi par retour de mail si vous aviez la moindre question.',
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
										"Dans l'attente, nous vous souhaitons une agréable journée.",
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
									text: 'Cordialement,',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	INVOICE_THIRD: {
		en: {},
		fr: {
			timing: {
				value: 25,
				unit: 'days',
				isRelative: false,
			},
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
									text: '[RAPPEL] Règlement de facture pour le projet ',
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
										"Simplement pour vous notifier que nous n'avons pas encore reçu votre règlement concernant le projet ",
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
										"Le délai légal de 30 jours pour le réglement se termine prochainement et nous vous serions reconnaissant d'effectuer celui-ci dans les meilleurs délais.",
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
										'La facture est téléchargeable directement à cette adresse:',
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
											id: 'ck3yjczn6a3hv0737kkw976gu',
											name: 'task.attachments',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.attachments',
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
									text:
										'Merci de revenir vers moi par retour de mail si vous aviez la moindre question.',
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
										"Dans l'attente, nous vous souhaitons une agréable journée.",
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
									text: 'Cordialement,',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	INVOICE_FOURTH: {
		en: {},
		fr: {
			timing: {
				value: 30,
				unit: 'days',
				isRelative: false,
			},
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
									text:
										'Dernier rappel pour règlement de la facture du projet ',
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
										'Nous revenons vers vous concernant le règlement de la facture pour le projet ',
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
									text: ' effectué avec ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3yjczpia3jv0737mhu8d5su',
											name: 'user.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'user.fullname',
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
										"Le délai légal de 30 jours pour le réglement se termine aujourd'hui.",
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
										'La facture est téléchargeable directement à cette adresse:',
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
											id: 'ck3yjczn6a3hv0737kkw976gu',
											name: 'task.attachments',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.attachments',
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
									text:
										'Merci de revenir vers moi par retour de mail si vous aviez la moindre question.',
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
										"Dans l'attente, nous vous souhaitons une agréable journée.",
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
									text: 'Cordialement,',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	INVOICE_LAST: {
		en: {},
		fr: {
			timing: {
				value: 40,
				unit: 'days',
				isRelative: false,
			},
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
									text:
										'[URGENT] Délai dépassé pour le règlement de la facture - ',
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
										"Nous vous informons que nous n'avons pas reçu le paiement de la facture liée au projet ",
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
									text: "Or, l'échéance est dépassée depuis déjà 10 jours.",
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
										"Dans le cadre de l'article L. 441-3 du Nouveau code du commerce, nous vous saurions gré de bien vouloir nous adresser rapidement votre règlement. Si toutefois vous éprouvez des difficultés financières ponctuelles, nous vous prions de nous en indiquer la raison afin que nous trouvions une solution ensemble.",
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
										'La facture est téléchargeable directement à cette adresse:',
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
											id: 'ck3yjczn6a3hv0737kkw976gu',
											name: 'task.attachments',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.attachments',
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
									text:
										"S'il s'agit d'un oubli de votre part, nous vous remercions de nous adresser votre paiement dès réception de la présente, et de nous en notifier par retour d'email.",
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
									text: 'Cordialement,',
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
