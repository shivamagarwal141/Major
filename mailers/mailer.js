const nodeMailer = require('../config/nodemailer');
const path = require('path');

const sendEmail = async (mailOptions) => {
    try {
        await nodeMailer.transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error in sending mail:', err);
        // Handle the error, you might want to log it or take other appropriate actions
        throw new Error('Error in sending mail');
    }
};


// This is another way of exporting a method
exports.sendReport = async (data) => {
    try {
        let htmlString = nodeMailer.renderTemplate({ data: data }, '/mail_template.ejs');
        // const pdf = 'sell_info_' + data.user + '.pdf';
        const pdfFilePath = data.pdfPath;
        const mailOptions = {
            from: 'pransharma011@gmail.com',
            to: data.email,
            subject: 'New Announcement: Dear Buyer PFA!!',
            html: htmlString,
            attachments: [
                {
                    filename: 'bill.pdf',
                    path: pdfFilePath,
                }
            ]
        };

        await sendEmail(mailOptions);
    } catch (error) {
        console.error('Error in sendReport:', err);
    }
}


exports.sendForgotPassword = async (data) => {
    try {
        let htmlString = nodeMailer.renderTemplate({ data: data }, '/forgot_password_template.ejs');

        const mailOptions = {
            from: 'pransharma011@gmail.com',
            to: data.email,
            subject: 'Password Reset link!!',
            html: htmlString
        };

        await sendEmail(mailOptions);
    } catch (err) {
        // Handle the error, log it, or redirect the user with a flash message
        console.error('Error in sendForgotPassword:', err);
    }
};


exports.confirmAppointment = async (data) => {
    try {
        let htmlString = nodeMailer.renderTemplate({ data: data }, '/confirm_appointment_template.ejs');

        const mailOptions = {
            from: 'pransharma011@gmail.com',
            to: data.email,
            subject: 'Appointment Confirmation Mail!!',
            html: htmlString
        };

        await sendEmail(mailOptions);
    } catch (err) {
        // Handle the error, log it, or redirect the user with a flash message
        console.error('Error in confirm Appointment:', err);
    }
};

exports.rejectAppointment = async (data) => {
    try {
        let htmlString = nodeMailer.renderTemplate({ data: data }, '/reject_appointment_template.ejs');

        const mailOptions = {
            from: 'pransharma011@gmail.com',
            to: data.email,
            subject: 'Appointment Rejected!!',
            html: htmlString
        };

        await sendEmail(mailOptions);
    } catch (err) {
        // Handle the error, log it, or redirect the user with a flash message
        console.error('Error in rejectAppointment:', err);
    }
};

exports.modifyAppointment = async (data) => {
    try {
        let htmlString = nodeMailer.renderTemplate({ data: data }, '/modify_appointment_template.ejs');

        const mailOptions = {
            from: 'pransharma011@gmail.com',
            to: data.email,
            subject: 'Appointment Rescheduled!!',
            html: htmlString
        };

        await sendEmail(mailOptions);
    } catch (err) {
        // Handle the error, log it, or redirect the user with a flash message
        console.error('Error in modifyAppointment:', err);
    }
};
