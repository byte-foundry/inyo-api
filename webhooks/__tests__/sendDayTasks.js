import {sendDayTasks} from '../sendDayTasks';

import {prisma} from '../../generated/prisma-client';
import {sendMorningEmail} from '../../emails/UserEmail';

jest.mock('crypto', () => ({
	createHmac: jest.fn(() => ({
		update: jest.fn(),
		digest: jest.fn(),
	})),
}));
jest.mock('../../generated/prisma-client', () => ({
	prisma: {
		projects: jest.fn(),
		user: jest.fn(() => ({
			id: 'user-id',
			firstName: 'Jean',
			lastName: 'Michel',
			email: 'jeanmichel@test.com',
		})),
	},
}));
jest.mock('../../utils');
jest.mock('../../emails/UserEmail', () => ({
	sendMorningEmail: jest.fn(),
}));

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
									unit: 20,
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
				userId: 'user-id',
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
										url: '/projects/project-3/#p3-s1-item-1',
									}),
								],
							},
							{
								id: 'p3-section-2',
								items: [
									expect.objectContaining({
										id: 'p3-s2-item-1',
										name: 'Drawing the logo',
										unit: 2,
										reviewer: 'USER',
										status: 'PENDING',
										sectionId: 'p3-section-2',
										projectId: 'project-3',
										url: '/projects/project-3/#p3-s2-item-1',
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
										url: '/projects/project-4/#p4-s1-item-1',
									}),
								],
							},
							{
								id: 'p4-section-2',
								items: [
									expect.objectContaining({
										id: 'p4-s2-item-1',
										name: 'Publishing',
										unit: 1,
										reviewer: 'USER',
										status: 'PENDING',
										sectionId: 'p4-section-2',
										projectId: 'project-4',
										url: '/projects/project-4/#p4-s2-item-1',
									}),
								],
							},
						],
					},
					{
						id: 'project-2',
						name: 'Art Museum Website',
						deadline: '2142-11-02T12:00:00.000Z',
						sections: [
							{
								id: 'p2-section-1',
								items: [
									expect.objectContaining({
										id: 'p2-s1-item-1',
										name: 'Create the website',
										unit: 20,
										reviewer: 'USER',
										status: 'PENDING',
										sectionId: 'p2-section-1',
										projectId: 'project-2',
										url: '/projects/project-2/#p2-s1-item-1',
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
});
