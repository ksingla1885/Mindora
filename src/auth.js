import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { sendVerificationEmail } from "@/lib/email"

// Generate a random token for email verification and password reset
const generateToken = () => {
    return randomBytes(32).toString('hex')
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
                try {
                    // Pass the full user object (with email) and the token
                    await sendVerificationEmail({ ...user, email: user.email }, verificationToken)
                } catch (error) {
                    console.error("Failed to send verification email:", error)
                }
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
                        try {
                            await sendVerificationEmail(user, user.verificationToken)
                        } catch (error) {
                            console.error("Failed to resend verification email:", error)
                        }
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
                    emailVerified: user.emailVerified,
                    class: user.class
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
                session.user.class = token.class || user?.class
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.emailVerified = user.emailVerified
                token.class = user.class
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
