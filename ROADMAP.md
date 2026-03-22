# Mindora Project Roadmap: Pending Features

This document outlines the features and optimizations remaining for the Mindora Olympiad platform to reach its full production potential.

## 1. Advanced Proctoring & AI Integration
- [ ] **AI Face Verification**: Complete the integration of the face detection model to verify student identity throughout the test.
- [ ] **Proctor Alert Dashboard**: A live admin interface to see all active test-takers, showing real-time tab-switching violations and connectivity status.
- [ ] **Browser Lockdown**: Implement strict full-screen enforcement with detection for "Alt+Tab" or multi-monitor setups.

## 2. Analytics & Reporting
- [ ] **Student Performance Reports**: Generate downloadable PDF reports for each test, including subject-wise percentile and relative ranking.
- [ ] **Classroom Analytics**: For school admins, show aggregated performance metrics across an entire class or grade level.
- [ ] **Comparative Leaderboards**: Allow students to see their progress compared to the top 10% or their previous test scores.

## 3. Financial & Order Management
- [ ] **Invoice Generation**: Automatically generate and email PDF invoices after a successful Razorpay transaction.
- [ ] **Coupons & Discounts**: Create a system for promotional codes (e.g., "MINDORA50") to offer discounts on paid tests.
- [ ] **Refund Workflow**: An admin tool to process refunds directly through the Razorpay API for cancelled test registrations.

## 4. Certificates & Achievements
- [ ] **Dynamic Certificate Templates**: Allow admins to upload and design certificate templates for different types of tests (Gold/Silver/Participation).
- [ ] **Automated Issuance**: Setup logic to automatically issue certificates once a specific passing score is reached.
- [ ] **Verifiable Certificates**: Add a QR code to certificates that links back to a verification page on Mindora.

## 5. User Roles & Collaboration
- [ ] **Teacher/Evaluator Role**: A dedicated role to allow teachers to monitor their students' tests without full Admin access.
- [ ] **Bulk Student Import**: An admin feature to upload students via CSV/Excel for large-scale school registrations.

## 6. Infrastructure & Performance
- [ ] **Managed WebSockets**: Move the `socket-server.js` logic to a managed service like **Pusher** or **Ably** to ensure 100% uptime on Vercel.
- [ ] **Automated Backups**: Configure scheduled snapshots of the Supabase Postgres database.
- [ ] **Global CDN Implementation**: Fully utilize AWS CloudFront for faster loading of question images and static assets across India.
