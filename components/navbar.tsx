"use client"

import Link from "next/link"
import { useUser, SignInButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Shield, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const { isSignedIn } = useUser()
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(true) // Default to dark mode
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const baseClasses = mobile 
      ? "w-full justify-start" 
      : "hidden sm:inline-flex"
    
    if (isSignedIn) {
      return (
        <>
          <Link href="/dashboard" onClick={() => mobile && setMobileMenuOpen(false)}>
            <Button 
              variant={isActive("/dashboard") ? "default" : "ghost"}
              className={`${isActive("/dashboard") ? "bg-primary" : ""} ${baseClasses}`}
              size={mobile ? "lg" : "sm"}
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/generator" onClick={() => mobile && setMobileMenuOpen(false)}>
            <Button 
              variant={isActive("/generator") ? "default" : "ghost"}
              className={`${isActive("/generator") ? "bg-primary" : ""} ${baseClasses}`}
              size={mobile ? "lg" : "sm"}
            >
              Generator
            </Button>
          </Link>
          <Link href="/account" onClick={() => mobile && setMobileMenuOpen(false)}>
            <Button 
              variant={isActive("/account") ? "default" : "ghost"}
              className={`${isActive("/account") ? "bg-primary" : ""} ${mobile ? "w-full justify-start" : "hidden md:inline-flex"}`}
              size={mobile ? "lg" : "sm"}
            >
              Account
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => mobile && setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/admin") ? "default" : "ghost"}
                size={mobile ? "lg" : "sm"}
                className={`${isActive("/admin") ? "bg-primary" : ""} ${mobile ? "w-full justify-start" : "hidden lg:inline-flex"}`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </>
      )
    } else {
      return (
        <>
          <Link href="/pricing" onClick={() => mobile && setMobileMenuOpen(false)}>
            <Button 
              variant={isActive("/pricing") ? "default" : "ghost"}
              className={`${isActive("/pricing") ? "bg-primary" : ""} ${baseClasses}`}
              size={mobile ? "lg" : "sm"}
            >
              Pricing
            </Button>
          </Link>
        </>
      )
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-sm sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Shopify Section Generator</span>
              <span className="sm:hidden">SSG</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-1 md:space-x-2 lg:space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <NavLinks />

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <Button size="sm">Sign In</Button>
              </SignInButton>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-2">
                  <NavLinks mobile />
                  
                  {isSignedIn ? (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Account</span>
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <SignInButton mode="modal">
                        <Button className="w-full" size="lg">
                          Sign In
                        </Button>
                      </SignInButton>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

