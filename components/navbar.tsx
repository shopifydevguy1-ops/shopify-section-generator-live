"use client"

import Link from "next/link"
import { useUser, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"

export function Navbar() {
  const { isSignedIn, user } = useUser()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Shopify Section Generator
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-accent"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/generator">
                  <Button variant="ghost">Generator</Button>
                </Link>
                <Link href="/account">
                  <Button variant="ghost">Account</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/pricing">
                  <Button variant="ghost">Pricing</Button>
                </Link>
                <SignInButton mode="modal">
                  <Button>Sign In</Button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

