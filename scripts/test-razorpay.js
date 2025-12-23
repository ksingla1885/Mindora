const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Test Razorpay Order Creation
 */
async function testOrderCreation() {
  try {
    console.log('Testing Razorpay Order Creation...');
    
    const order = await razorpay.orders.create({
      amount: 1000, // 10.00 INR
      currency: 'INR',
      receipt: 'test_receipt_1',
      payment_capture: 1
    });
    
    console.log('✅ Order created successfully:');
    console.log({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
    
    return order;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
}

/**
 * Test Signature Verification
 */
function testSignatureVerification(orderId, paymentId, signature) {
  try {
    console.log('\nTesting Signature Verification...');
    
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    
    const isValid = generatedSignature === signature;
    
    console.log(isValid ? '✅ Signature is valid' : '❌ Invalid signature');
    console.log('Generated Signature:', generatedSignature);
    console.log('Expected Signature:', signature);
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    throw error;
  }
}

/**
 * Test Webhook Handling
 */
async function testWebhookHandling() {
  try {
    console.log('\nTesting Webhook Handling...');
    
    // This is a sample webhook payload - replace with actual values from Razorpay
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_123',
            order_id: 'order_test_123',
            amount: 1000,
            currency: 'INR',
            status: 'captured',
            // Add other payment details as needed
          }
        }
      }
    };
    
    // In a real scenario, this would be a POST request to your webhook endpoint
    console.log('Webhook payload prepared. In production, this would be sent to:');
    console.log(`POST ${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`);
    
    return webhookPayload;
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test 1: Create an order
    const order = await testOrderCreation();
    
    // Test 2: Verify signature (using test data)
    // In a real test, you would get these values from the Razorpay response
    const testOrderId = order?.id || 'order_test_123';
    const testPaymentId = 'pay_test_123';
    const testSignature = 'test_signature';
    
    testSignatureVerification(testOrderId, testPaymentId, testSignature);
    
    // Test 3: Test webhook handling
    await testWebhookHandling();
    
    console.log('\n✅ All tests completed. Check the output above for results.');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
