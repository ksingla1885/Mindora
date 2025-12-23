import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Generate a random token for email verification and password reset
const generateToken = () => {
    return randomBytes(32).toString('hex')
}

// Send verification email
const sendVerificationEmail = async (email, token) => {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`

    if (resend) {
        await resend.emails.send({
            from: 'Mindora <noreply@mindora.com>',
            to: email,
            subject: 'Verify your email address',
            html: `
        <div>
          <h1>Welcome to Mindora!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verifyUrl}">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verifyUrl}</p>
        </div>
      `
        })
    } else {
        console.log('--------------------------------------------------')
        console.log('WARNING: RESEND_API_KEY missing. Email not sent.')
        console.log(`To: ${email}`)
        console.log(`Subject: Verify your email address`)
        console.log(`Verify URL: ${verifyUrl}`)
        console.log('--------------------------------------------------')
    }
}

export const authOptions = {
    adapter: {
        ...PrismaAdapter(prisma),
        // Custom createUser to handle email verification
        async createUser(user) {
            const verificationToken = generateToken()
            const verificationExpires = new Date()
            verificationExpires.setHours(verificationExpires.getHours() + 24) // 24 hours expiry

            const newUser = await prisma.user.create({
                data: {
                    ...user,
                    emailVerified: null,
                    verificationToken,
                    verificationExpires
                },
            })

            // Send verification email
            if (process.env.NODE_ENV !== 'test') {
                await sendVerificationEmail(user.email, verificationToken)
            }

            return newUser
        },
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password')
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user || !user?.password) {
                    throw new Error('No user found with this email')
                }

                // Check if email is verified
                if (!user.emailVerified) {
                    // Resend verification email if not verified
                    if (process.env.NODE_ENV !== 'test') {
                        await sendVerificationEmail(user.email, user.verificationToken)
                    }
                    throw new Error('Please verify your email before logging in. A new verification email has been sent.')
                }

                const passwordMatch = await bcrypt.compare(credentials.password, user.password)

                if (!passwordMatch) {
                    throw new Error('Incorrect password')
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified
                }
            }
        }),
        ...(process.env.EMAIL_SERVER ? [
            EmailProvider({
                server: process.env.EMAIL_SERVER,
                from: process.env.EMAIL_FROM,
            })
        ] : [])
    ],
    callbacks: {
        async session({ session, token, user }) {
            if (session?.user) {
                session.user.id = token.sub || user?.id
                session.user.role = token.role || user?.role
                session.user.emailVerified = token.emailVerified || user?.emailVerified
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.emailVerified = user.emailVerified
            }
            return token
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/welcome'
    },
    events: {
        async signIn(message) {
            // Update last login time
            if (message.user?.email) {
                await prisma.user.update({
                    where: { email: message.user.email },
                    data: { lastLogin: new Date() }
                })
            }
        }
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions)
