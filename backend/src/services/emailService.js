const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendWelcomeEmail = async ({ to, name, tempPassword }) => {
    await transporter.sendMail({
        from: `"ClaimFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your ClaimFlow Account is Ready',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
                <div style="background: #0f172a; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
                    <span style="color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ClaimFlow</span>
                </div>
                <h2 style="color: #0f172a; margin: 0 0 8px;">Welcome, ${name}! 👋</h2>
                <p style="color: #475569; margin: 0 0 24px;">Your account has been created by your company admin. Use the credentials below to log in.</p>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Details</p>
                    <p style="margin: 0 0 4px; color: #0f172a;"><strong>Email:</strong> ${to}</p>
                    <p style="margin: 0; color: #0f172a;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${tempPassword}</span></p>
                </div>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">Please change your password after your first login. If you didn't expect this email, please ignore it.</p>
            </div>
        `,
    });
};

const sendPasswordResetEmail = async ({ to, resetToken }) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
        from: `"ClaimFlow" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset Your ClaimFlow Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
                <div style="background: #0f172a; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
                    <span style="color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ClaimFlow</span>
                </div>
                <h2 style="color: #0f172a; margin: 0 0 8px;">Reset Your Password</h2>
                <p style="color: #475569; margin: 0 0 24px;">We received a request to reset your password. Click the button below. This link expires in <strong>15 minutes</strong>.</p>
                <a href="${resetUrl}" style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">Reset Password</a>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
            </div>
        `,
    });
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
