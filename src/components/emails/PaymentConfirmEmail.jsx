import React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Hr } from '@react-email/components';

export const PaymentConfirmEmail = ({ username = 'there', itemName, amount, orderId, date }) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Text style={logo}>Mindora</Text>
                    <Text style={paragraph}>Hi {username},</Text>
                    <Text style={paragraph}>
                        Thank you for your purchase! We've received your payment for <strong>{itemName}</strong>.
                    </Text>

                    <Section style={receiptBox}>
                        <Text style={receiptItem}><strong>Order ID:</strong> {orderId}</Text>
                        <Text style={receiptItem}><strong>Item:</strong> {itemName}</Text>
                        <Text style={receiptItem}><strong>Amount:</strong> ₹{amount}</Text>
                        <Text style={receiptItem}><strong>Date:</strong> {date}</Text>
                    </Section>

                    <Text style={paragraph}>
                        You can now access your content from your dashboard.
                    </Text>

                    <Container style={buttonContainer}>
                        <Link style={button} href={`${process.env.NEXTAUTH_URL}/dashboard`}>
                            Go to Dashboard
                        </Link>
                    </Container>

                    <Text style={paragraph}>
                        If you have any questions regarding this transaction, please contact our support team.
                    </Text>

                    <Text style={paragraph}>
                        Best regards,
                        <br />
                        The Mindora Team
                    </Text>
                    <Hr style={hr} />
                    <Text style={footer}>
                        Mindora — Online Olympiad Platform
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

const receiptBox = {
    backgroundColor: '#f4f7fa',
    margin: '0 30px 20px',
    padding: '20px',
    borderRadius: '4px',
};

const receiptItem = {
    fontSize: '14px',
    margin: '0 0 8px 0',
    color: '#525f7f',
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
    padding: '12px 24px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '30px 30px 20px',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    textAlign: 'center',
};
