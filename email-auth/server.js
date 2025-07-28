require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Signup Route
app.post('/signup', async (req, res) => {
    const { email, username } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to AI Recommender!',
        text: `Hello ${username},\n\nThank you for signing up! Enjoy using AI Product Recommender.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Signup email sent successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending email' });
    }
});

app.post('/signin', async (req, res) => {
    const { email } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Sign-In Notification',
        text: `You just signed in to AI Recommender. If this wasn't you, please change your password.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Signin email sent successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending email' });
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
