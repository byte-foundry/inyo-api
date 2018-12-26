import moment from 'moment-timezone';

import {sendDayTasks} from '../sendDayTasks';

import {prisma} from '../../generated/prisma-client';
import {sendMorningEmail} from '../../emails/UserEmail';

jest.mock('crypto', () => ({
	createHmac: jest.fn(() => ({
		update: jest.fn(),
		digest: jest.fn(),
	})),
}));
jest.mock('moment-timezone', () => jest.fn(() => ({
	tz: jest.fn().mockReturnThis(),
	day: jest.fn().mockReturnValue(2), // TUESDAY, everyone works on Tuesday
})));
jest.mock('../../generated/prisma-client', () => ({
	prisma: {
		projects: jest.fn(),
		user: jest.fn(() => ({
			id: 'user-id',
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'jeanmichel@test.com',
			workingDays: ['TUESDAY'],
			startWorkAt: `${new Date().toJSON().split('T')[0]}08:00:00.000Z`,
			endWorkAt: `${new Date().toJSON().split('T')[0]}16:00:00.000Z`,
		})),
	},
}));
jest.mock('../../utils');
jest.mock('../../emails/UserEmail', () => ({
	sendMorningEmail: jest.fn(),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('sendDayTasks', async () => {
	it('should send a morning email with the day tasks', async () => {
		prisma.projects.mockImplementation(() => ({
			$fragment: () => [
				// project 1
				{
					id: 'project-1',
					name: 'Waiting project',
					deadline: '2052-11-02T12:00:00.000Z',
					sections: [
						{
							id: 'p1-section-1',
							items: [
								{
									id: 'p1-s1-item-1',
									name: 'Item 1',
									unit: 1,
									reviewer: 'USER',
									status: 'FINISHED',
								},
								{
									id: 'p1-s1-item-2',
									name: 'Item 2',
									unit: 0,
									reviewer: 'CUSTOMER',
									status: 'PENDING',
								},
							],
						},
					],
				},
				// project 2
				{
					id: 'project-2',
					name: 'Art Museum Website',
					deadline: '2142-11-02T12:00:00.000Z',
					sections: [
						{
							id: 'p2-section-1',
							items: [
								{
									id: 'p2-s1-item-1',
									name: 'Create the website',
									unit: 5,
									reviewer: 'USER',
									status: 'PENDING',
								},
								{
									id: 'p1-s1-item-2',
									name: 'Being happy',
									unit: 1,
									reviewer: 'CUSTOMER',
									status: 'PENDING',
								},
							],
						},
					],
				},
				// project 3
				{
					id: 'project-3',
					name: 'Shortest deadline logo',
					deadline: '2032-11-02T12:00:00.000Z',
					sections: [
						{
							id: 'p3-section-1',
							items: [
								{
									id: 'p3-s1-item-1',
									name: 'Research on identity',
									unit: 2,
									reviewer: 'USER',
									status: 'PENDING',
								},
								{
									id: 'p3-s1-item-2',
									name: 'Validate first draft',
									unit: 1,
									reviewer: 'CUSTOMER',
									status: 'PENDING',
								},
							],
						},
						{
							id: 'p3-section-2',
							items: [
								{
									id: 'p3-s2-item-1',
									name: 'Drawing the logo',
									unit: 2,
									reviewer: 'USER',
									status: 'PENDING',
								},
								{
									id: 'p3-s2-item-2',
									name: 'Validate final logo',
									unit: 1,
									reviewer: 'CUSTOMER',
									status: 'PENDING',
								},
							],
						},
					],
				},
				// project 4
				{
					id: 'project-4',
					name: 'Spare time project',
					deadline: '2050-11-02T12:00:00.000Z',
					sections: [
						{
							id: 'p4-section-1',
							items: [
								{
									id: 'p4-s1-item-1',
									name: 'Design',
									unit: 1,
									reviewer: 'USER',
									status: 'FINISHED',
								},
							],
						},
						{
							id: 'p4-section-2',
							items: [
								{
									id: 'p4-s2-item-1',
									name: 'Publishing',
									unit: 1,
									reviewer: 'USER',
									status: 'PENDING',
								},
							],
						},
					],
				},
			],
		}));

		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		await sendDayTasks(req, res);

		expect(sendMorningEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				email: 'jeanmichel@test.com',
				user: 'Jean Michel',
				projects: [
					{
						id: 'project-3',
						name: 'Shortest deadline logo',
						deadline: '2032-11-02T12:00:00.000Z',
						sections: [
							{
								id: 'p3-section-1',
								items: [
									expect.objectContaining({
										id: 'p3-s1-item-1',
										name: 'Research on identity',
										unit: 2,
										reviewer: 'USER',
										status: 'PENDING',
										sectionId: 'p3-section-1',
										projectId: 'project-3',
										url: '/projects/project-3/see#p3-s1-item-1',
									}),
								],
							},
							{
								id: 'p3-section-2',
								items: [
									expect.objectContaining({
										id: 'p3-s2-item-1',
										name: 'Drawing the logo',
										projectId: 'project-3',
										reviewer: 'USER',
										sectionId: 'p3-section-2',
										status: 'PENDING',
										unit: 2,
										url: '/projects/project-3/see#p3-s2-item-1',
									}),
								],
							},
						],
					},
					{
						id: 'project-4',
						name: 'Spare time project',
						deadline: '2050-11-02T12:00:00.000Z',
						sections: [
							{
								id: 'p4-section-1',
								items: [
									expect.objectContaining({
										id: 'p4-s1-item-1',
										name: 'Design',
										unit: 1,
										reviewer: 'USER',
										status: 'FINISHED',
										sectionId: 'p4-section-1',
										projectId: 'project-4',
										url: '/projects/project-4/see#p4-s1-item-1',
									}),
								],
							},
						],
					},
				],
			}),
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	it("should send tasks in the right order within the user's working hours", async () => {
		prisma.projects.mockImplementation(() => ({
			$fragment: () => [
				{
					id: 'cjpl8391z18r00803319xcgnt',
					name: 'fghjkl',
					deadline: '2019-01-10T11:00:00.000Z',
					sections: [
						{
							id: 'cjpl8392i18r108038os92wm9',
							items: [
								{
									name: 'Réunion de lancement',
									id: 'cjpl8392l18r30803yy97xw21',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name:
										"Rédaction d'un cahier des charges et définition des valeurs de l'entreprise",
									id: 'cjpl8392r18r508039nuqhuay',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Validation',
									id: 'cjpl8392t18r70803r80qc0yg',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
							],
						},
						{
							id: 'cjpl8392v18r908031mtt70pq',
							items: [
								{
									name: 'Benchmark',
									id: 'cjpl8392x18rb0803cn5ew11b',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Moodboard',
									id: 'cjpl8392z18rd0803e0s2p3pf',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.75,
								},
								{
									name: 'Création de 3 axes créatifs',
									id: 'cjpl8393018rf08037azffzga',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 2.5,
								},
								{
									name: "Mise au point de l'axe retenu",
									id: 'cjpl8393218rh0803pyozho36',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 1,
								},
								{
									name: 'Déclinaisons du logo en couleur et en noir & blanc ',
									id: 'cjpl8393318rj0803srusw6lb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name:
										'Préparation des fichiers aux formats nécessaires pour une utilisation Print et Web',
									id: 'cjpl8393418rl0803726p2nw2',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
							],
						},
						{
							id: 'cjpl8393518rn0803givdfi0x',
							items: [
								{
									name: 'Gestion et suivi de projet',
									id: 'cjpl8393618rp0803yihth4rl',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 2,
								},
								{
									name: 'Cession des droits',
									id: 'cjpl8393818rr0803dwrb80mb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Achat typographique',
									id: 'cjpl8393a18rt0803v6bkrdl4',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Conception charte graphique utilisation logo',
									id: 'cjpl8393c18rv0803goc76hvx',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 1,
								},
							],
						},
					],
				},
			],
		}));

		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		await sendDayTasks(req, res);

		expect(sendMorningEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				projects: [
					{
						id: 'cjpl8391z18r00803319xcgnt',
						name: 'fghjkl',
						deadline: '2019-01-10T11:00:00.000Z',
						sections: [
							{
								id: 'cjpl8392i18r108038os92wm9',
								items: [
									expect.objectContaining({name: 'Réunion de lancement'}),
									expect.objectContaining({
										name:
											"Rédaction d'un cahier des charges et définition des valeurs de l'entreprise",
									}),
									expect.objectContaining({name: 'Validation'}),
								],
							},
							{
								id: 'cjpl8392v18r908031mtt70pq',
								items: [expect.objectContaining({name: 'Benchmark'})],
							},
						],
					},
				],
			}),
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	it('should always send at least 3 tasks', async () => {
		// tasks are longer than a user day, but we want to send him at least 3
		prisma.projects.mockImplementation(() => ({
			$fragment: () => [
				{
					id: 'cjpl8391z18r00803319xcgnt',
					name: 'fghjkl',
					deadline: '2019-01-10T11:00:00.000Z',
					sections: [
						{
							id: 'cjpl8392i18r108038os92wm9',
							items: [
								{
									name: 'Réunion de lancement',
									id: 'cjpl8392l18r30803yy97xw21',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 10,
								},
								{
									name:
										"Rédaction d'un cahier des charges et définition des valeurs de l'entreprise",
									id: 'cjpl8392r18r508039nuqhuay',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 10,
								},
								{
									name: 'Validation',
									id: 'cjpl8392t18r70803r80qc0yg',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 10,
								},
							],
						},
						{
							id: 'cjpl8392v18r908031mtt70pq',
							items: [
								{
									name: 'Benchmark',
									id: 'cjpl8392x18rb0803cn5ew11b',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 5,
								},
							],
						},
					],
				},
			],
		}));

		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		await sendDayTasks(req, res);

		expect(sendMorningEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				projects: [
					expect.objectContaining({
						sections: [
							expect.objectContaining({
								items: expect.arrayContaining([
									expect.anything(),
									expect.anything(),
									expect.anything(),
								]),
							}),
						],
					}),
				],
			}),
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	it('should always send at most 8 tasks', async () => {
		// tasks are quick, but we want to send him at most 8
		prisma.projects.mockImplementation(() => ({
			$fragment: () => [
				{
					id: 'cjpl8391z18r00803319xcgnt',
					name: 'fghjkl',
					deadline: '2019-01-10T11:00:00.000Z',
					sections: [
						{
							id: 'cjpl8392i18r108038os92wm9',
							items: [
								{
									name: 'Réunion de lancement',
									id: 'cjpl8392l18r30803yy97xw21',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
								{
									name:
										"Rédaction d'un cahier des charges et définition des valeurs de l'entreprise",
									id: 'cjpl8392r18r508039nuqhuay',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
								{
									name: 'Validation',
									id: 'cjpl8392t18r70803r80qc0yg',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
							],
						},
						{
							id: 'cjpl8392v18r908031mtt70pq',
							items: [
								{
									name: 'Benchmark',
									id: 'cjpl8392x18rb0803cn5ew11b',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
								{
									name: 'Moodboard',
									id: 'cjpl8392z18rd0803e0s2p3pf',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
								{
									name: 'Création de 3 axes créatifs',
									id: 'cjpl8393018rf08037azffzga',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
								{
									name: "Mise au point de l'axe retenu",
									id: 'cjpl8393218rh0803pyozho36',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
								{
									name: 'Déclinaisons du logo en couleur et en noir & blanc ',
									id: 'cjpl8393318rj0803srusw6lb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
								{
									name:
										'Préparation des fichiers aux formats nécessaires pour une utilisation Print et Web',
									id: 'cjpl8393418rl0803726p2nw2',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
							],
						},
						{
							id: 'cjpl8393518rn0803givdfi0x',
							items: [
								{
									name: 'Gestion et suivi de projet',
									id: 'cjpl8393618rp0803yihth4rl',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
								{
									name: 'Cession des droits',
									id: 'cjpl8393818rr0803dwrb80mb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
								{
									name: 'Achat typographique',
									id: 'cjpl8393a18rt0803v6bkrdl4',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0,
								},
								{
									name: 'Conception charte graphique utilisation logo',
									id: 'cjpl8393c18rv0803goc76hvx',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.1,
								},
							],
						},
					],
				},
			],
		}));

		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		await sendDayTasks(req, res);

		expect(sendMorningEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				projects: [
					expect.objectContaining({
						sections: [
							expect.objectContaining({
								items: [
									expect.anything(),
									expect.anything(),
									expect.anything(),
								],
							}),
							expect.objectContaining({
								items: [
									expect.anything(),
									expect.anything(),
									expect.anything(),
									expect.anything(),
									expect.anything(),
								],
							}),
						],
					}),
				],
			}),
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	it('should not send anything if the user is not working', async () => {
		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		moment.mockImplementationOnce(() => ({
			tz: jest.fn().mockReturnThis(),
			day: jest.fn(() => 0), // SUNDAY
		}));

		await sendDayTasks(req, res);

		expect(sendMorningEmail).not.toHaveBeenCalled();

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});

	it('should prioritize short deadlines', async () => {
		const shortDeadline = new Date();
		const longDeadline = new Date();

		shortDeadline.setMonth(shortDeadline.getMonth() + 1);
		longDeadline.setMonth(longDeadline.getMonth() + 3);

		prisma.projects.mockImplementation(() => ({
			$fragment: () => [
				{
					id: 'cjpl8391z18r00803319xcgnt',
					name: 'fghjkl',
					deadline: longDeadline.toJSON(),
					sections: [
						{
							id: 'cjpl8392v18r908031mtt70pq',
							items: [
								{
									name: 'Benchmark',
									id: 'cjpl8392x18rb0803cn5ew11b',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.5,
								},
								{
									name: 'Moodboard',
									id: 'cjpl8392z18rd0803e0s2p3pf',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.75,
								},
								{
									name: 'Création de 3 axes créatifs',
									id: 'cjpl8393018rf08037azffzga',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 2.5,
								},
								{
									name: "Mise au point de l'axe retenu",
									id: 'cjpl8393218rh0803pyozho36',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 1,
								},
								{
									name: 'Déclinaisons du logo en couleur et en noir & blanc ',
									id: 'cjpl8393318rj0803srusw6lb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name:
										'Préparation des fichiers aux formats nécessaires pour une utilisation Print et Web',
									id: 'cjpl8393418rl0803726p2nw2',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
							],
						},
						{
							id: 'cjpl8393518rn0803givdfi0x',
							items: [
								{
									name: 'Gestion et suivi de projet',
									id: 'cjpl8393618rp0803yihth4rl',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 2,
								},
								{
									name: 'Cession des droits',
									id: 'cjpl8393818rr0803dwrb80mb',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Achat typographique',
									id: 'cjpl8393a18rt0803v6bkrdl4',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name: 'Conception charte graphique utilisation logo',
									id: 'cjpl8393c18rv0803goc76hvx',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 1,
								},
							],
						},
					],
				},
				{
					id: 'cjpl84um718u00803u2htp47l',
					name: 'hjkl',
					deadline: shortDeadline.toJSON(),
					sections: [
						{
							id: 'cjpl84umi18u90803w8mp1e90',
							items: [
								{
									name: 'Benchmark',
									id: 'cjpl84umj18ub08038o372jwy',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.5,
								},
								{
									name: 'Moodboard',
									id: 'cjpl84umk18ud0803xqjju7kx',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.75,
								},
								{
									name: 'Création de 3 axes créatifs',
									id: 'cjpl84uml18uf0803ea7ht0en',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 2.5,
								},
								{
									name: "Mise au point de l'axe retenu",
									id: 'cjpl84umm18uh0803cp2axz0b',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 1,
								},
								{
									name: 'Déclinaisons du logo en couleur et en noir & blanc ',
									id: 'cjpl84umn18uj0803u0sfhtkq',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
								{
									name:
										'Préparation des fichiers aux formats nécessaires pour une utilisation Print et Web',
									id: 'cjpl84ump18ul08034x87gwz2',
									status: 'PENDING',
									reviewer: 'USER',
									unit: 0.25,
								},
							],
						},
					],
				},
			],
		}));

		const req = {
			get: jest.fn(),
			body: {
				data: {
					userId: 'user-id',
				},
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
		};

		await sendDayTasks(req, res);

		expect(sendMorningEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				projects: [
					expect.objectContaining({
						name: 'hjkl',
						sections: [
							expect.objectContaining({
								items: [
									expect.objectContaining({
										name: 'Benchmark',
									}),
									expect.objectContaining({
										name: 'Moodboard',
									}),
									expect.objectContaining({
										name: 'Création de 3 axes créatifs',
									}),
								],
							}),
						],
					}),
				],
			}),
		);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalled();
	});
});
