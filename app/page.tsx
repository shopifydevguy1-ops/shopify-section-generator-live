import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { LandingBackground } from "@/components/landing-background"
import { Check, Sparkles, Zap, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] relative">
      <LandingBackground />
      <div className="relative z-10">
        <Navbar />
        
        <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Generate Beautiful Shopify Sections
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create stunning Shopify sections instantly from our library of pre-built templates. 
              No coding required. Just customize and download.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 relative">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pre-built Templates</CardTitle>
                <CardDescription>
                  Access a library of professionally designed section templates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant Generation</CardTitle>
                <CardDescription>
                  Generate sections in seconds, not hours
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Production Ready</CardTitle>
                <CardDescription>
                  All sections are tested and ready for production use
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass">
              <CardHeader>
                <Check className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Customization</CardTitle>
                <CardDescription>
                  Customize colors, text, and layouts with ease
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 relative">
          <Card className="max-w-2xl mx-auto gradient-bg text-white border-0 relative z-10">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
              <CardDescription className="text-white/90">
                Start generating beautiful Shopify sections today. 5 free generations included.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Create Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
        </main>

        <footer className="border-t py-8 mt-20">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2024 Shopify Section Generator. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

