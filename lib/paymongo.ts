// PayMongo API client
// PayMongo doesn't have a native npm package, so we'll use their REST API directly

const PAYMONGO_API_BASE = "https://api.paymongo.com/v1"

interface PayMongoCheckoutSession {
  data: {
    id: string
    type: string
    attributes: {
      checkout_url: string
      reference_number: string
      line_items: Array<{
        amount: number
        currency: string
        description: string
        name: string
        quantity: number
      }>
      payment_intent: {
        id: string
        status: string
      }
      metadata: Record<string, string>
    }
  }
}

interface PayMongoWebhookEvent {
  data: {
    id: string
    type: string
    attributes: {
      type: string
      data: {
        id: string
        type: string
        attributes: {
          amount: number
          currency: string
          status: string
          metadata?: Record<string, string>
          payment_intent?: {
            id: string
            status: string
          }
        }
      }
    }
  }
}

export class PayMongoClient {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    // PayMongo uses Basic Auth with secret key (no password needed)
    const authHeader = Buffer.from(this.secretKey + ":").toString("base64")
    
    const response = await fetch(`${PAYMONGO_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }))
      throw new Error(error.errors?.[0]?.detail || error.message || "PayMongo API error")
    }

    return response.json()
  }

  /**
   * Create a checkout session for subscription payment
   * Note: PayMongo doesn't have native subscriptions, so we'll create a checkout session
   * and handle recurring billing manually through webhooks
   */
  async createCheckoutSession(params: {
    amount: number // Amount in cents (e.g., 2000 for ₱20.00)
    currency?: string
    description: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
  }): Promise<PayMongoCheckoutSession> {
    const { amount, currency = "PHP", description, successUrl, cancelUrl, metadata } = params

    // PayMongo Checkout API - create checkout session directly
    const checkoutSession = await this.request("/checkout_sessions", {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                amount: amount,
                currency: currency,
                description: description,
                name: "Pro Plan Subscription",
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "paymaya", "gcash", "grab_pay"],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: metadata || {},
          },
        },
      }),
    })

    return checkoutSession
  }

  /**
   * Verify webhook signature
   * PayMongo sends webhook signature in x-paymongo-signature header
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // PayMongo uses HMAC SHA256 for webhook verification
    const crypto = require("crypto")
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch {
      return false
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    return this.request(`/payment_intents/${paymentIntentId}`)
  }

  /**
   * Get checkout session by ID
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    return this.request(`/checkout_sessions/${sessionId}`)
  }
}

// Export a singleton instance
export function getPayMongoClient(): PayMongoClient {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not set")
  }
  return new PayMongoClient(secretKey)
}

