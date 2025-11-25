import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Check } from "lucide-react"
import { auth } from "@clerk/nextjs"

export default async function PricingPage() {
  const { userId } = auth()

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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out our service</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>5 section generations per month</span>
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
                  <span>Basic customization options</span>
                </li>
              </ul>
              {userId ? (
                <Link href="/dashboard">
                  <Button className="w-full" variant="outline">
                    Current Plan
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

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
                <span className="text-4xl font-bold">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="font-semibold">Unlimited section generations</span>
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
                    Upgrade to Pro
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
          <p>All plans include automatic updates and new templates as they're released.</p>
        </div>
      </main>
    </div>
  )
}

