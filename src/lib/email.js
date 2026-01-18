import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { VerificationEmail } from '@/components/emails/VerificationEmail';
import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';

// Configure email transporter
const getEmailConfig = async () => {
  // If real credentials are provided, use them (works in both dev and prod)
  if (process.env.SMTP_PASSWORD) {
    return {
      service: process.env.SMTP_SERVICE,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };
  }

  // Fallback to Ethereal for development if no real credentials
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    };
  }

  // Default/Production configuration (will fail if env vars missing)
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };
};

const transporter = nodemailer.createTransport({
  ...(await getEmailConfig()),
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('Error with email configuration:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const emailHtml = render(
    <VerificationEmail username={user.name || 'there'} verificationUrl={verificationUrl} />
  );

  const info = await transporter.sendMail({
    from: `"Mindora" <${process.env.EMAIL_FROM || 'noreply@mindora.com'}>`,
    to: user.email,
    subject: 'Verify your email address',
    html: emailHtml,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const emailHtml = render(
    <ResetPasswordEmail username={user.name || 'there'} resetUrl={resetUrl} />
  );

  const info = await transporter.sendMail({
    from: `"Mindora" <${process.env.EMAIL_FROM || 'noreply@mindora.com'}>`,
    to: user.email,
    subject: 'Reset your password',
    html: emailHtml,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

export const sendPasswordChangedEmail = async (user) => {
  const info = await transporter.sendMail({
    from: `"Mindora" <${process.env.EMAIL_FROM || 'noreply@mindora.com'}>`,
    to: user.email,
    subject: 'Your password has been changed',
    text: `Hello ${user.name || 'there'},\n\n` +
      'This is a confirmation that the password for your account has been changed.\n\n' +
      'If you did not request this change, please contact our support team immediately.\n\n' +
      'Thanks,\nThe Mindora Team',
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};
