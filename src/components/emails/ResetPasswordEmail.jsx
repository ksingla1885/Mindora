import React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Hr } from '@react-email/components';

export const ResetPasswordEmail = ({ username = 'there', resetUrl }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>Mindora</Text>
          <Text style={paragraph}>Hi {username},</Text>
          <Text style={paragraph}>
            We received a request to reset the password for your Mindora account. Click the button below to reset your password:
          </Text>
          <Container style={buttonContainer}>
            <Link style={button} href={resetUrl}>
              Reset Password
            </Link>
          </Container>
          <Text style={paragraph}>
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </Text>
          <Text style={paragraph}>
            If you're having trouble with the button above, copy and paste the URL below into your web browser:
            <br />
            {resetUrl}
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't request this email, your account security may be compromised. 
            Please contact our support team immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const logo = {
  margin: '0 auto',
  textAlign: 'center',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#4f46e5',
  padding: '20px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
  margin: '0 0 20px 0',
  padding: '0 30px',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '30px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 auto',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 30px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 30px',
  fontStyle: 'italic',
};
