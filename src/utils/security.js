import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const scrypt = promisify(require('crypto').scrypt);

/**
 * Generate a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Hash a password using scrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (password, hash) => {
  const [salt, key] = hash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(password, salt, 64);
  return timingSafeEqual(keyBuffer, derivedKey);
};

/**
 * Generate a secure token for email verification, password reset, etc.
 * @param {string} userId - User ID
 * @param {string} type - Token type (e.g., 'email-verification', 'password-reset')
 * @param {number} expiresInHours - Token expiration time in hours
 * @returns {Promise<string>} JWT token
 */
export const generateSecureToken = async (userId, type, expiresInHours = 24) => {
  const token = generateRandomString(64);
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  await prisma.token.create({
    data: {
      userId,
      token,
      type,
      expiresAt,
      used: false,
    },
  });
  
  return token;
};

/**
 * Verify a secure token
 * @param {string} token - Token to verify
 * @param {string} type - Expected token type
 * @returns {Promise<{valid: boolean, userId?: string, error?: string}>}
 */
export const verifySecureToken = async (token, type) => {
  try {
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid token' };
    }

    if (tokenRecord.used) {
      return { valid: false, error: 'Token has already been used' };
    }

    if (tokenRecord.expiresAt < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }

    if (tokenRecord.type !== type) {
      return { valid: false, error: 'Invalid token type' };
    }

    // Mark token as used
    await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    return { 
      valid: true, 
      userId: tokenRecord.userId,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error: 'Error verifying token' };
  }
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, message?: string}}
 */
export const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (!/\d/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain at least one special character' 
    };
  }
  
  return { valid: true };
};

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
export const generateCsrfToken = () => {
  return randomBytes(32).toString('hex');
};

/**
 * Verify CSRF token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret to verify against
 * @returns {boolean} True if token is valid
 */
export const verifyCsrfToken = (token, secret) => {
  if (!token || !secret) return false;
  return timingSafeEqual(
    Buffer.from(token),
    Buffer.from(secret)
  );
};

/**
 * Log security-related events
 * @param {string} event - Event type (e.g., 'login_attempt', 'password_reset')
 * @param {string} userId - User ID (if applicable)
 * @param {Object} metadata - Additional metadata
 */
export const logSecurityEvent = async (event, userId = null, metadata = {}) => {
  try {
    await prisma.securityLog.create({
      data: {
        event,
        userId,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        metadata: metadata.metadata || {},
      },
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

export default {
  generateRandomString,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  verifySecureToken,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateCsrfToken,
  verifyCsrfToken,
  logSecurityEvent,
};
