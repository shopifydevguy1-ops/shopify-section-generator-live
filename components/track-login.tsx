"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export function TrackLogin() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {
      // Track login when user is loaded
      fetch("/api/track-login", {
        method: "POST",
      }).catch(err => console.error("Error tracking login:", err))
    }
  }, [isLoaded, user])

  return null
}

