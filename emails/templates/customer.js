const templates = {
	DELAY: {
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
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' à besoin de vous',
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
											id: 'ck3hb10gk006k0735dc4z04mg',
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
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
										' me demande de vous contacter car nous avons besoin de vous pour réaliser la tâche ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3haz72a00270735wffmxcxe',
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
									text: 'Voici la description de la tâche:',
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
											id: 'ck3haz73a002b07350fpzwobn',
											name: 'task.description',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.description',
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
										'Vous devez valider la tâche pour que  puisse avancer sur le reste du projet.',
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
											id: 'ck3haz73w002f0735c7v76u76',
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
									text:
										'Attention, le projet risque de prendre du retard si vous ne le faites pas dans les temps.',
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
										'Vous avez peut être besoin d’informations supplémentaires? Dans ce cas, n’hésitez pas à ajouter un commentaire en cliquant sur la zone prévue à cet effet. ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' en sera informé immédiatement.',
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
			timing: {
				value: 2,
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
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' à besoin de vous',
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
											id: 'ck3hb10gk006k0735dc4z04mg',
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
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
										' me demande de vous contacter car nous avons besoin de vous pour réaliser la tâche ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3haz72a00270735wffmxcxe',
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
									text: 'Voici la description de la tâche:',
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
											id: 'ck3haz73a002b07350fpzwobn',
											name: 'task.description',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.description',
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
										'Vous devez valider la tâche pour que  puisse avancer sur le reste du projet.',
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
											id: 'ck3haz73w002f0735c7v76u76',
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
									text:
										'Attention, le projet risque de prendre du retard si vous ne le faites pas dans les temps.',
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
										'Vous avez peut être besoin d’informations supplémentaires? Dans ce cas, n’hésitez pas à ajouter un commentaire en cliquant sur la zone prévue à cet effet. ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' en sera informé immédiatement.',
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
			timing: {
				value: 5,
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
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' à besoin de vous',
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
											id: 'ck3hb10gk006k0735dc4z04mg',
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
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
										' me demande de vous contacter car nous avons besoin de vous pour réaliser la tâche ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3haz72a00270735wffmxcxe',
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
									text: 'Voici la description de la tâche:',
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
											id: 'ck3haz73a002b07350fpzwobn',
											name: 'task.description',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.description',
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
										'Vous devez valider la tâche pour que  puisse avancer sur le reste du projet.',
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
											id: 'ck3haz73w002f0735c7v76u76',
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
									text:
										'Attention, le projet risque de prendre du retard si vous ne le faites pas dans les temps.',
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
										'Vous avez peut être besoin d’informations supplémentaires? Dans ce cas, n’hésitez pas à ajouter un commentaire en cliquant sur la zone prévue à cet effet. ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' en sera informé immédiatement.',
									marks: [],
								},
							],
						},
					],
				},
			},
		},
	},
	LAST: {
		en: {},
		fr: {
			timing: {
				value: 6,
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
									text: '',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' à besoin de vous',
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
											id: 'ck3hb10gk006k0735dc4z04mg',
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
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
										' me demande de vous contacter car nous avons besoin de vous pour réaliser la tâche ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3haz72a00270735wffmxcxe',
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
									text: 'Voici la description de la tâche:',
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
											id: 'ck3haz73a002b07350fpzwobn',
											name: 'task.description',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'task.description',
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
										'Vous devez valider la tâche pour que  puisse avancer sur le reste du projet.',
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
											id: 'ck3haz73w002f0735c7v76u76',
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
									text:
										'Attention, le projet risque de prendre du retard si vous ne le faites pas dans les temps.',
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
										'Vous avez peut être besoin d’informations supplémentaires? Dans ce cas, n’hésitez pas à ajouter un commentaire en cliquant sur la zone prévue à cet effet. ',
									marks: [],
								},
								{
									object: 'inline',
									type: 'param',
									data: {
										param: {
											id: 'ck3hb0a0e00550735pn7s7nw6',
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
									text: ' en sera informé immédiatement.',
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
