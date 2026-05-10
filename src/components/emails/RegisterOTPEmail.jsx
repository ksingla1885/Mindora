import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const RegisterOTPEmail = ({ username = 'Student', otp }) => {
  const otpArray = otp ? otp.toString().split('') : ['0', '0', '0', '0', '0', '0'];

  return (
    <Html>
      <Head />
      <Preview>Your Mindora Verification Code: {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Section with Gradient-like feel */}
          <Section style={headerSection}>
            <Text style={logo}>MINDORA</Text>
            <Text style={headerSubtext}>Elevating Your Learning Experience</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>Security Verification</Heading>
            <Text style={text}>
              Hi <span style={highlight}>{username}</span>,
            </Text>
            <Text style={text}>
              We're excited to have you join our elite learning community. To finalize your account setup and unlock full access to Mindora, please use the secure verification code below:
            </Text>

            {/* OTP Display - Unique "Grid" Layout */}
            <Section style={otpContainer}>
              <table style={{ width: 'auto', margin: '0 auto' }} align="center">
                <tr>
                  {otpArray.map((digit, index) => (
                    <td key={index} style={otpSlot}>
                      {digit}
                    </td>
                  ))}
                </tr>
              </table>
            </Section>

            <Text style={expiryText}>
              This code is valid for <span style={{ fontWeight: '700', color: '#4F46E5' }}>10 minutes</span>. 
              For your security, never share this code with anyone.
            </Text>

            <Hr style={hr} />

            <Section style={footerSection}>
              <Text style={footerTitle}>Why verify?</Text>
              <Text style={footerText}>
                Verification ensures that your learning progress, certificates, and personal data remain strictly under your control.
              </Text>
              
              <Text style={footerNote}>
                If you didn't request this, you can safely ignore this email.
              </Text>
            </Section>
          </Section>

          <Section style={bottomLinks}>
            <Link href="https://mindora.com" style={link}>Website</Link>
            <span style={divider}> • </span>
            <Link href="https://mindora.com/support" style={link}>Support</Link>
            <span style={divider}> • </span>
            <Link href="https://mindora.com/privacy" style={link}>Privacy</Link>
          </Section>
          
          <Text style={copyright}>
            © {new Date().getFullYear()} Mindora Education. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default RegisterOTPEmail;

const main = {
  backgroundColor: '#f4f7fb',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  width: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
};

const headerSection = {
  backgroundColor: '#4F46E5',
  backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  padding: '40px 20px',
  textAlign: 'center',
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '4px',
  margin: '0',
  textTransform: 'uppercase',
};

const headerSubtext = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  fontWeight: '500',
  margin: '8px 0 0',
  letterSpacing: '1px',
};

const contentSection = {
  padding: '40px 50px',
};

const h1 = {
  color: '#1F2937',
  fontSize: '24px',
  fontWeight: '800',
  textAlign: 'center',
  margin: '0 0 24px',
  letterSpacing: '-0.5px',
};

const text = {
  color: '#4B5563',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const highlight = {
  color: '#4F46E5',
  fontWeight: '700',
};

const otpContainer = {
  margin: '32px 0',
  textAlign: 'center',
};

const otpSlot = {
  width: '50px',
  height: '60px',
  backgroundColor: '#F3F4F6',
  borderRadius: '12px',
  fontSize: '32px',
  fontWeight: '800',
  color: '#4F46E5',
  textAlign: 'center',
  padding: '0',
  margin: '0 4px',
  border: '2px solid #E5E7EB',
  display: 'inline-block',
  lineHeight: '60px',
};

const expiryText = {
  color: '#6B7280',
  fontSize: '13px',
  textAlign: 'center',
  margin: '24px 0 0',
};

const hr = {
  borderColor: '#E5E7EB',
  margin: '40px 0',
};

const footerSection = {
  backgroundColor: '#F9FAFB',
  borderRadius: '16px',
  padding: '24px',
};

const footerTitle = {
  color: '#1F2937',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const footerText = {
  color: '#6B7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const footerNote = {
  color: '#9CA3AF',
  fontSize: '12px',
  fontStyle: 'italic',
  marginTop: '16px',
  textAlign: 'center',
};

const bottomLinks = {
  textAlign: 'center',
  padding: '24px 0 0',
};

const link = {
  color: '#4F46E5',
  fontSize: '12px',
  fontWeight: '600',
  textDecoration: 'none',
};

const divider = {
  color: '#D1D5DB',
  fontSize: '12px',
  margin: '0 8px',
};

const copyright = {
  color: '#9CA3AF',
  fontSize: '11px',
  textAlign: 'center',
  padding: '16px 0 40px',
};
