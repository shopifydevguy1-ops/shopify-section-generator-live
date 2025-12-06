// Currency conversion utilities
// Converts USD to PHP for PayMongo payments

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD"

interface ExchangeRates {
  rates: {
    PHP: number
  }
  base: string
  date: string
}

// Cache exchange rate for 1 hour to avoid too many API calls
let cachedRate: { rate: number; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Get current USD to PHP exchange rate
 * Falls back to a default rate if API fails
 */
export async function getUSDToPHPRate(): Promise<number> {
  // Check cache first
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate
  }

  try {
    // Try to fetch from exchange rate API
    const response = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (response.ok) {
      const data: ExchangeRates = await response.json()
      const rate = data.rates.PHP
      
      // Cache the rate
      cachedRate = {
        rate,
        timestamp: Date.now(),
      }
      
      console.log(`[Currency] Fetched USD to PHP rate: ${rate}`)
      return rate
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
  }

  // Fallback to default rate (approximately 56 PHP per USD)
  // You can update this default rate as needed
  const defaultRate = parseFloat(process.env.DEFAULT_USD_TO_PHP_RATE || "56.0")
  console.log(`[Currency] Using default USD to PHP rate: ${defaultRate}`)
  
  return defaultRate
}

/**
 * Convert USD amount to PHP (in cents)
 * @param usdAmount - Amount in USD (e.g., 20 for $20)
 * @returns Amount in PHP cents (e.g., 112000 for ₱1,120.00)
 */
export async function convertUSDToPHPCents(usdAmount: number): Promise<number> {
  const rate = await getUSDToPHPRate()
  const phpAmount = usdAmount * rate
  // Convert to cents (multiply by 100)
  return Math.round(phpAmount * 100)
}

/**
 * Format PHP amount for display
 * @param phpCents - Amount in PHP cents
 * @returns Formatted string (e.g., "₱1,120.00")
 */
export function formatPHP(phpCents: number): string {
  const phpAmount = phpCents / 100
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(phpAmount)
}

/**
 * Format USD amount for display
 * @param usdAmount - Amount in USD
 * @returns Formatted string (e.g., "$20.00")
 */
export function formatUSD(usdAmount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usdAmount)
}

