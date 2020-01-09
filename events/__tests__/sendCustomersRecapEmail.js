import {sendCustomersRecapEmail} from '../sendCustomersRecapEmail';

import {prisma} from '../../generated/prisma-client';
import {sendCustomerEveningEmail} from '../../emails/CustomerEmail';

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
jest.mock('../../emails/CustomerEmail', () => ({
	sendCustomerEveningEmail: jest.fn(),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe('sendCustomersRecapEmail', () => {
	it('should send an evening email to all the customers projects where tasks have been completed today', async () => {
		const user = {
			id: 'user-id',
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'jeanmichel@test.com',
			workingDays: ['TUESDAY'],
			startWorkAt: `${new Date().toJSON().split('T')[0]}08:00:00.000Z`,
			endWorkAt: `${new Date().toJSON().split('T')[0]}16:00:00.000Z`,
			company: {
				customers: [
					{
						id: 'customer-id',
						title: 'MONSIEUR',
						firstName: 'Jean',
						lastName: 'Bon',
						email: 'jeanbon@meatandgreet.test',
						token: 'token-customer-1',
						projects: [
							{
								id: 'project-1',
								name: "Fabrication d'une planche à découper",
								sections: [
									{
										items: [
											{
												name: 'Dessiner les plans',
											},
											{
												name: 'Couper du plastique',
											},
										],
									},
								],
							},
						],
						linkedTasks: [
							{
								name: 'Tâche indépendante',
							},
						],
					},
					{
						id: 'customer-id-2',
						title: 'MADAME',
						firstName: 'Camille',
						lastName: 'Honnête',
						email: 'camionette@nissanjidosha.jp',
						token: 'token-customer-2',
						projects: [
							{
								id: 'project-2',
								name: "Fabriquer des preuves d'innocence",
								sections: [
									{
										items: [
											{
												name: 'Ne rien lâcher',
											},
										],
									},
								],
							},
							{
								id: 'project-3',
								name: 'Nouveau modèle de camionette',
								sections: [
									{
										items: [
											{
												name: 'Étudier les modèles existants',
											},
										],
									},
								],
							},
						],
						linkedTasks: [],
					},
				],
			},
			settings: {language: 'fr'},
		};

		prisma.user.mockImplementation(() => ({
			...user,
			$fragment: () => user,
		}));

		const data = {
			userId: 'user-id',
		};

		const reminders = {
			metadata: {
				canceledReports: [],
			},
		};

		await sendCustomersRecapEmail(data, reminders);

		expect(sendCustomerEveningEmail).toHaveBeenNthCalledWith(
			1,
			{
				meta: {userId: 'user-id'},
				email: 'jeanbon@meatandgreet.test',
				customerName: ' M. Jean Bon',
				user: 'Jean Michel',
				userId: 'user-id',
				customerId: 'customer-id',
				projects: user.company.customers[0].projects.map(project => ({
					...project,
					url: `/${user.company.customers[0].token}/tasks?projectId=${
						project.id
					}`,
				})),
				tasks: user.company.customers[0].linkedTasks.map(task => ({
					...task,
					url: `/${user.company.customers[0].token}/tasks/${task.id}`,
				})),
			},
			expect.objectContaining({db: prisma}),
		);

		expect(sendCustomerEveningEmail).toHaveBeenNthCalledWith(
			2,
			{
				meta: {userId: 'user-id'},
				email: 'camionette@nissanjidosha.jp',
				customerName: ' Mme Camille Honnête',
				user: 'Jean Michel',
				userId: 'user-id',
				customerId: 'customer-id-2',
				projects: user.company.customers[1].projects.map(project => ({
					...project,
					url: `/${user.company.customers[1].token}/tasks?projectId=${
						project.id
					}`,
				})),
				tasks: user.company.customers[1].linkedTasks.map(task => ({
					...task,
					url: `/${user.company.customers[1].token}/tasks/${task.id}`,
				})),
			},
			expect.objectContaining({db: prisma}),
		);
	});
});
