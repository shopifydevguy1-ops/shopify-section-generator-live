import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Check } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { convertUSDToPHPCents, formatPHP, formatUSD } from "@/lib/currency"

export default async function PricingPage() {
  const { userId } = auth()
  
  // Get Pro plan pricing
  const proUsdAmount = parseFloat(process.env.PRO_PLAN_USD_AMOUNT || "20")
  const proPhpCents = await convertUSDToPHPCents(proUsdAmount)
  
  // Get Expert plan pricing
  const expertUsdAmount = parseFloat(process.env.EXPERT_PLAN_USD_AMOUNT || "125")
  const expertPhpCents = await convertUSDToPHPCents(expertUsdAmount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Pro Plan */}
          <Card className="border-primary border-2 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For professionals and agencies</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formatUSD(proUsdAmount)}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ≈ {formatPHP(proPhpCents)} PHP (converted at current rate)
                </p>
                <p className="text-sm text-primary font-semibold mt-2">
                  ✨ Free for first month - 20 sections included
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited section search/browse</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="font-semibold">20 free sections in first month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="font-semibold">50 copies/downloads per month (after trial)</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Access to all templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Download as .liquid files</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Advanced customization options</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Save sections to account</span>
                </li>
              </ul>
              {userId ? (
                <Link href="/api/checkout">
                  <Button className="w-full">
                    Subscribe to Pro
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Expert Plan */}
          <Card className="border-primary border-2 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Expert</CardTitle>
              <CardDescription>For power users and teams</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formatUSD(expertUsdAmount)}</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ≈ {formatPHP(expertPhpCents)} PHP (converted at current rate)
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  Lifetime access, no recurring charges
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="font-semibold">Unlimited sections</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="font-semibold">Full section library access</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Browse all sections in library</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited copy and download</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Access to all templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Download as .liquid files</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Advanced customization options</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Save sections to account</span>
                </li>
              </ul>
              {userId ? (
                <Link href="/api/checkout?plan=expert">
                  <Button className="w-full">
                    Upgrade to Expert
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-muted-foreground">
          <p>All plans include automatic updates and new templates as they&apos;re released.</p>
        </div>
      </main>
    </div>
  )
}

