// const dotenv = require('dotenv');
// dotenv.config();

const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'fahadtanveer902@gmail.com',
        subject: 'Thanks for joining',
        text: `Welcome to the app, ${name}.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'fahadtanveer902@gmail.com',
        subject: 'Sad to see you leave us',
        text: `Goodbye ${name}. Would you be kind enough to let us know what caused you to leave our app ?`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}