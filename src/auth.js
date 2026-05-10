import NextAuth, { CredentialsSignin } from "next-auth"
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

class BlockedError extends CredentialsSignin {
    code = "user_blocked"
}

const prismaAdapter = PrismaAdapter(prisma);

export const authOptions = {
    adapter: {
        ...prismaAdapter,
        async createUser(user) {
            const newUser = await prisma.user.create({
                data: {
                    ...user,
                    emailVerified: null,
                },
            })

            // Generate OTP for registration
            const { createOTPToken } = await import("@/lib/tokens");
            const { sendRegisterOTPEmail } = await import("@/lib/email");
            
            const otp = await createOTPToken(user.email, newUser.id);

            // Send verification email
            if (process.env.NODE_ENV !== 'test') {
                try {
                    await sendRegisterOTPEmail(newUser, otp)
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
                    // Check if they have a token
                    const token = await prisma.verificationToken.findFirst({
                        where: { identifier: user.email, type: 'EMAIL_VERIFICATION' }
                    });

                    if (!token) {
                         // Generate new OTP if none exists
                         const { createOTPToken } = await import("@/lib/tokens");
                         const { sendRegisterOTPEmail } = await import("@/lib/email");
                         const otp = await createOTPToken(user.email, user.id);
                         try {
                             await sendRegisterOTPEmail(user, otp);
                         } catch (e) {
                             console.error("Failed to resend OTP:", e);
                         }
                    } else {
                        // Resend existing OTP if it exists (or generate new one for simplicity)
                         const { createOTPToken } = await import("@/lib/tokens");
                         const { sendRegisterOTPEmail } = await import("@/lib/email");
                         const otp = await createOTPToken(user.email, user.id);
                         try {
                             await sendRegisterOTPEmail(user, otp);
                         } catch (e) {
                             console.error("Failed to resend OTP:", e);
                         }
                    }
                    
                    throw new Error('Please verify your email before logging in. A verification code has been sent to your email.')
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
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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
