// eslint-disable-next-line

const sendTaskValidationEmail = jest.fn(() => Promise.resolve());

const sendItemUpdatedEmail = jest.fn(() => Promise.resolve());

const setupItemReminderEmail = jest.fn(() => Promise.resolve());

module.exports = {
	sendTaskValidationEmail,
	sendItemUpdatedEmail,
	setupItemReminderEmail,
};
