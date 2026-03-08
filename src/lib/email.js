import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { VerificationEmail } from '@/components/emails/VerificationEmail';
import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';

import { TestResultEmail } from '@/components/emails/TestResultEmail';
import { PaymentConfirmEmail } from '@/components/emails/PaymentConfirmEmail';

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

// Lazy-load transporter to avoid top-level await issues
let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const config = await getEmailConfig();
  transporter = nodemailer.createTransport(config);

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('Email server is ready to take our messages');
  } catch (error) {
    console.error('Error with email configuration:', error);
  }

  return transporter;
};

export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const emailHtml = await render(
    <VerificationEmail username={user.name || 'there'} verificationUrl={verificationUrl} />
  );

  const transporter = await getTransporter();
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const emailHtml = await render(
    <ResetPasswordEmail username={user.name || 'there'} resetUrl={resetUrl} />
  );

  const transporter = await getTransporter();
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
  const transporter = await getTransporter();
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

export const sendTestResultEmail = async (user, testResult) => {
  const resultsUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/tests/${testResult.testId}/results/${testResult.attemptId}`;

  const emailHtml = await render(
    <TestResultEmail
      username={user.name || 'there'}
      testTitle={testResult.testTitle}
      score={testResult.score}
      percentage={testResult.percentage}
      totalQuestions={testResult.totalQuestions}
      correctCount={testResult.correctCount}
      resultsUrl={resultsUrl}
    />
  );

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"Mindora" <${process.env.EMAIL_FROM || 'noreply@mindora.com'}>`,
    to: user.email,
    subject: `Test Results: ${testResult.testTitle}`,
    html: emailHtml,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

export const sendPaymentConfirmationEmail = async (user, payment) => {
  const emailHtml = await render(
    <PaymentConfirmEmail
      username={user.name || 'there'}
      itemName={payment.itemName}
      amount={payment.amount}
      orderId={payment.orderId}
      date={new Date().toLocaleDateString()}
    />
  );

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `"Mindora" <${process.env.EMAIL_FROM || 'noreply@mindora.com'}>`,
    to: user.email,
    subject: 'Payment Confirmation - Mindora',
    html: emailHtml,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

