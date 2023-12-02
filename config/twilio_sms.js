const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

const sendTwilioSMS = async (messageBody, to) => {
    try {
        const message = await client.messages.create({
            body: messageBody,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log(`Message sent: ${message.sid}`);
    } catch (error) {
        console.error(`Error sending message: ${error.message}`);
        // You can handle the error here, for example, log it or throw a custom error
        throw new Error('Error sending SMS');
    }
};

module.exports.tokenSms = async function (name, number, token) {
    const messageBody = `
Dear ${name},

Your token number is: ${token}

Dr. Goel's Dental And Maxillofacial Diagnostics
Thank you!!
    `;
    try {
        await sendTwilioSMS(messageBody, `+91${number}`);
    } catch (error) {
        console.log('error in sending sms');
    }
};

module.exports.smsConfirmAppointment = async function (name, number, time) {
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString();
    const messageBody = `
Dear ${name},

Your Appointment has been confirmed!

Date : ${date}
Time : ${time}
Please arrive 10 minutes prior to your scheduled time.

Dr. Goel's Dental And Maxillofacial Diagnostics
Thank you!!
    `;
    try {
        await sendTwilioSMS(messageBody, `+91${number}`);
    } catch (error) {
        console.log('error in sending sms');
    }
};

module.exports.smsDeclineAppointment = async function (name, number, reason) {
    const messageBody = `
Dear ${name},

We regret to inform you that,
Your Appointment has been cancelled!

Reason: ${reason}

Dr. Goel's Dental And Maxillofacial Diagnostics
Thank you!!
    `;
    try {
        await sendTwilioSMS(messageBody, `+91${number}`);
    } catch (error) {
        console.log('error in sending sms');
    }
};

module.exports.smsModifyAppointment = async function (name, number, reason, time) {
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString();
    const messageBody = `
Dear ${name},

Your Appointment timings are changed!

Reason: ${reason}

Date : ${date}
New Time : ${time}
Please arrive 10 minutes prior to your scheduled time.

Dr. Goel's Dental And Maxillofacial Diagnostics
Thank you!!
    `;
    try {
        await sendTwilioSMS(messageBody, `+91${number}`);
    } catch (error) {
        console.log('error in sending sms');
    }
};
