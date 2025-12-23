import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const randomBytesAsync = promisify(randomBytes);

export const generateToken = async (length = 32) => {
  const buffer = await randomBytesAsync(length);
  return buffer.toString('hex');
};

export const createVerificationToken = async (userId) => {
  // Delete any existing verification tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { userId, type: 'EMAIL_VERIFICATION' },
  });

  const token = await generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

  const verificationToken = await prisma.verificationToken.create({
    data: {
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
      userId,
    },
  });

  return verificationToken.token;
};

export const createPasswordResetToken = async (email) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null; // Don't reveal if user exists or not
  }

  // Delete any existing password reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: 'PASSWORD_RESET' },
  });

  const token = await generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  const resetToken = await prisma.verificationToken.create({
    data: {
      token,
      type: 'PASSWORD_RESET',
      expiresAt,
      userId: user.id,
    },
  });

  return {
    token: resetToken.token,
    user,
  };
};

export const verifyToken = async (token, type) => {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      token,
      type,
      expiresAt: {
        gt: new Date(), // Token not expired
      },
    },
    include: {
      user: true,
    },
  });

  if (!verificationToken) {
    return null;
  }

  // Delete the token so it can't be used again
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return verificationToken.user;
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};
