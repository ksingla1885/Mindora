import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Create a new Razorpay order with retry logic
 * @param {number} amount - Amount in smallest currency unit (e.g., paise for INR)
 * @param {string} currency - Currency code (default: 'INR')
 * @param {Object} notes - Additional notes to be added to the order
 * @param {number} attempt - Current retry attempt
 * @returns {Promise<Object>} Razorpay order object
 */
export const createOrder = async (amount, currency = 'INR', notes = {}, attempt = 1) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      payment_capture: 1,
      notes: {
        ...notes,
        attempt,
        created_at: new Date().toISOString(),
      },
    };

    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error(`Razorpay order creation failed (attempt ${attempt}):`, error);
    
    if (attempt >= MAX_RETRIES) {
      return { 
        success: false, 
        error: error.error?.description || 'Failed to create payment order after multiple attempts',
        code: error.error?.code || 'ORDER_CREATION_FAILED'
      };
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    return createOrder(amount, currency, notes, attempt + 1);
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {string} webhookBody - Raw webhook request body
 * @param {string} signature - Webhook signature from headers
 * @returns {boolean} Whether the signature is valid
 */
export const verifyWebhookSignature = (webhookBody, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(webhookBody))
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Verify Razorpay payment signature with additional validation
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {{isValid: boolean, error?: string}} Verification result
 */
export const verifyPayment = async (orderId, paymentId, signature) => {
  try {
    if (!orderId || !paymentId || !signature) {
      return { isValid: false, error: 'Missing required parameters' };
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === signature;
    
    if (!isSignatureValid) {
      console.error('Invalid payment signature', { orderId, paymentId });
      return { isValid: false, error: 'Invalid payment signature' };
    }

    // Optional: Verify payment with Razorpay API for additional security
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      if (payment.order_id !== orderId) {
        return { isValid: false, error: 'Order ID mismatch' };
      }
      
      if (payment.status !== 'captured') {
        return { isValid: false, error: `Payment not captured. Status: ${payment.status}` };
      }
    } catch (apiError) {
      console.error('Error verifying payment with Razorpay API:', apiError);
      // Continue with signature verification only if API call fails
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error in payment verification:', error);
    return { isValid: false, error: error.message || 'Payment verification failed' };
  }
};

/**
 * Refund a payment with retry logic
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (in smallest currency unit)
 * @param {string} notes - Refund notes
 * @param {number} attempt - Current retry attempt
 * @returns {Promise<Object>} Refund details
 */
export const refundPayment = async (paymentId, amount, notes = '', attempt = 1) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount,
      speed: 'normal',
      notes: {
        reason: notes || 'Refund initiated by system',
        timestamp: new Date().toISOString(),
        attempt
      }
    });
    
    return { 
      success: true, 
      refund,
      message: 'Refund initiated successfully'
    };
  } catch (error) {
    console.error(`Refund attempt ${attempt} failed:`, error);
    
    if (attempt >= MAX_RETRIES) {
      return { 
        success: false, 
        error: error.error?.description || 'Failed to process refund after multiple attempts',
        code: error.error?.code || 'REFUND_FAILED',
        retryable: false
      };
    }

    // Check if error is retryable
    const retryableErrors = ['BAD_REQUEST_ERROR', 'GATEWAY_ERROR', 'SERVER_ERROR'];
    const isRetryable = error.error?.code ? retryableErrors.includes(error.error.code) : true;
    
    if (!isRetryable) {
      return { 
        success: false, 
        error: error.error?.description || 'Non-retryable error during refund',
        code: error.error?.code || 'REFUND_FAILED',
        retryable: false
      };
    }

    // Wait before retrying with exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return refundPayment(paymentId, amount, notes, attempt + 1);
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return { 
      success: false, 
      error: error.error?.description || 'Failed to fetch payment details',
      code: error.error?.code
    };
  }
};

export default razorpay;
