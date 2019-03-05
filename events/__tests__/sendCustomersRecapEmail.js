import moment from 'moment-timezone';

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

describe('sendCustomersRecapEmail', async () => {
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
						title: 'MONSIEUR',
						firstName: 'Jean',
						lastName: 'Bon',
						email: 'jeanbon@meatandgreet.test',
						projects: [
							{
								id: 'project-1',
								token: 'token-customer-project-1',
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
					},
					{
						title: 'MADAME',
						firstName: 'Camille',
						lastName: 'Honnête',
						email: 'camionette@nissanjidosha.jp',
						projects: [
							{
								id: 'project-2',
								token: 'token-customer-project-2',
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
								token: 'token-customer-project-3',
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
					},
				],
			},
		};

		prisma.user.mockImplementation(() => ({
			...user,
			$fragment: () => user,
		}));

		const data = {
			userId: 'user-id',
		};

		await sendCustomersRecapEmail(data);

		expect(sendCustomerEveningEmail).toHaveBeenNthCalledWith(1, {
			email: 'jeanbon@meatandgreet.test',
			customerName: ' M. Jean Bon',
			user: 'Jean Michel',
			projects: user.company.customers[0].projects.map(project => ({
				...project,
				url: `/projects/${project.id}/view/${project.token}`,
			})),
		});

		expect(sendCustomerEveningEmail).toHaveBeenNthCalledWith(2, {
			email: 'camionette@nissanjidosha.jp',
			customerName: ' Mme Camille Honnête',
			user: 'Jean Michel',
			projects: user.company.customers[1].projects.map(project => ({
				...project,
				url: `/projects/${project.id}/view/${project.token}`,
			})),
		});
	});
});
