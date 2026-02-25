import React from 'react';
import { Html, Head, Body, Container, Section, Text, Link, Hr, Column, Row } from '@react-email/components';

export const TestResultEmail = ({ username = 'there', testTitle, score, percentage, totalQuestions, correctCount, resultsUrl }) => {
    const isPassed = percentage >= 33; // Default passing score

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>Mindora</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={paragraph}>Hi {username},</Text>
                        <Text style={paragraph}>
                            Congratulations on completing the <strong>{testTitle}</strong>! Here is a summary of your performance:
                        </Text>

                        <Section style={statsCard}>
                            <Row>
                                <Column style={statBox}>
                                    <Text style={statLabel}>Score</Text>
                                    <Text style={statValue}>{score}</Text>
                                </Column>
                                <Column style={statBox}>
                                    <Text style={statLabel}>Percentage</Text>
                                    <Text style={{ ...statValue, color: isPassed ? '#10b981' : '#ef4444' }}>{percentage}%</Text>
                                </Column>
                            </Row>
                            <Row style={{ marginTop: '20px' }}>
                                <Column style={statBox}>
                                    <Text style={statLabel}>Correct</Text>
                                    <Text style={statValue}>{correctCount} / {totalQuestions}</Text>
                                </Column>
                                <Column style={statBox}>
                                    <Text style={statLabel}>Status</Text>
                                    <Text style={{ ...statValue, color: isPassed ? '#10b981' : '#ef4444' }}>
                                        {isPassed ? 'PASSED' : 'RETRY'}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={paragraph}>
                            You can view your detailed performance analysis, including question-by-question breakdown and AI-powered suggestions, by clicking the button below:
                        </Text>

                        <Section style={buttonContainer}>
                            <Link style={button} href={resultsUrl}>
                                View Detailed Results
                            </Link>
                        </Section>

                        <Text style={paragraph}>
                            Keep practicing to improve your skills!
                        </Text>

                        <Text style={paragraph}>
                            Best regards,
                            <br />
                            The Mindora Team
                        </Text>
                    </Section>

                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            Mindora — Your path to Olympiad excellence.
                            <br />
                            If you have any questions, reply to this email or visit our help center.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    padding: '40px 0',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const header = {
    backgroundColor: '#4f46e5',
    padding: '30px 0',
    textAlign: 'center',
};

const logo = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '0',
};

const content = {
    padding: '40px 30px',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#4b5563',
    margin: '0 0 20px 0',
};

const statsCard = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    margin: '20px 0 30px',
    border: '1px solid #e5e7eb',
};

const statBox = {
    textAlign: 'center',
    width: '50%',
};

const statLabel = {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#6b7280',
    margin: '0 0 4px 0',
};

const statValue = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0',
};

const buttonContainer = {
    textAlign: 'center',
    margin: '30px 0',
};

const button = {
    backgroundColor: '#4f46e5',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 30px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '0 30px',
};

const footer = {
    padding: '30px',
};

const footerText = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '18px',
    textAlign: 'center',
    margin: '0',
};
