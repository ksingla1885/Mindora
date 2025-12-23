import { NextResponse } from 'next/server';
import crypto from 'crypto';
import subscriptionService from '@/services/payment/subscription.service';

// Disable body parsing, we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get Razorpay signature from headers
    const razorpaySignature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody);
    const generatedSignature = hmac.digest('hex');
    
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'hex'),
      Buffer.from(razorpaySignature, 'hex')
    );

    if (!isSignatureValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    // Log the webhook event for debugging
    console.log(`Received webhook event: ${event}`, JSON.stringify(payload, null, 2));

    // Handle the webhook event
    try {
      await subscriptionService.handleWebhookEvent(event, payload);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error(`Error handling webhook event ${event}:`, error);
      return NextResponse.json(
        { error: `Error handling event: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook', details: error.message },
      { status: 500 }
    );
  }
}

// Add a GET handler for webhook verification (optional)
export async function GET() {
  return NextResponse.json({ status: 'Webhook handler is active' });
}
