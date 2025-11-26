"use client"

import Link from "next/link"
import { useUser, SignInButton, SignOutButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Shield } from "lucide-react"
import { useState, useEffect } from "react"

export function Navbar() {
  const { isSignedIn, user } = useUser()
  const [darkMode, setDarkMode] = useState(true) // Default to dark mode
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check localStorage first, then check DOM class, default to dark
    const savedTheme = localStorage.getItem("theme")
    let isDark = true // Default to dark
    
    if (savedTheme) {
      isDark = savedTheme === "dark"
    } else {
      // If no saved preference, check if dark class is already applied (from layout script)
      isDark = document.documentElement.classList.contains("dark")
      // If still no preference, default to dark and set it
      if (!document.documentElement.classList.contains("dark") && !document.documentElement.classList.contains("light")) {
        isDark = true
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      }
    }
    
    setDarkMode(isDark)
    
    // Ensure DOM matches the state
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/admin/check")
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin || false))
        .catch(() => setIsAdmin(false))
    }
  }, [isSignedIn])

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
                {isAdmin && (
                  <Link href="/admin/">
                    <Button variant="ghost" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
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

