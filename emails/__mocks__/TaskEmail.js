// eslint-disable-next-line
const legacy_sendTaskValidationEmail = jest.fn(() => Promise.resolve());

const sendTaskValidationEmail = jest.fn(() => Promise.resolve());

const sendTaskValidationWaitCustomerEmail = jest.fn(() => Promise.resolve());

const sendItemUpdatedEmail = jest.fn(() => Promise.resolve());

const setupItemReminderEmail = jest.fn(() => Promise.resolve());

module.exports = {
	legacy_sendTaskValidationEmail,
	sendTaskValidationEmail,
	sendTaskValidationWaitCustomerEmail,
	sendItemUpdatedEmail,
	setupItemReminderEmail,
};
