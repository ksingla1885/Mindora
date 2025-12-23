import React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Hr } from '@react-email/components';

export const VerificationEmail = ({ username = 'there', verificationUrl }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>Mindora</Text>
          <Text style={paragraph}>Hi {username},</Text>
          <Text style={paragraph}>
            Welcome to Mindora! We're excited to have you on board. To get started, please verify your
            email address by clicking the button below:
          </Text>
          <Container style={buttonContainer}>
            <Link style={button} href={verificationUrl}>
              Verify Email Address
            </Link>
          </Container>
          <Text style={paragraph}>
            If you didn't create an account with Mindora, you can safely ignore this email.
          </Text>
          <Text style={paragraph}>
            Best regards,
            <br />
            The Mindora Team
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you're having trouble with the button above, copy and paste the URL below into your web browser:
            <br />
            {verificationUrl}
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
};
