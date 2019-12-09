const templates = {
	COMMENT_ADDED: {
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
											id: 'ck3yjczo2a3in0737l7m0f81h',
											name: 'author.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'author.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ' a ajouté un commentaire sur le projet ',
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
											id: 'ck3yjczofa3iz0737h7xtq5mu',
											name: 'recipient.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'recipient.fullname',
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
											id: 'ck3yjczo2a3in0737l7m0f81h',
											name: 'author.fullname',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'author.fullname',
											marks: [],
										},
									],
								},
								{
									object: 'text',
									text: ' a commenté la tâche ',
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
									text: 'Voici son commentaire:',
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
									text: ' ',
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
											id: 'ck3yjcznha3i70737unpr0yan',
											name: 'comment.text',
											__typename: 'EmailParam',
										},
									},
									nodes: [
										{
											object: 'text',
											text: 'comment.text',
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
