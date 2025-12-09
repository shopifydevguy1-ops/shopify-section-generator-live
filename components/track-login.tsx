"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"

export function TrackLogin() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {
      // Generate device fingerprint
      const fingerprint = generateDeviceFingerprint()
      
      // Track login when user is loaded with device fingerprint
      fetch("/api/track-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprintHash: fingerprint,
        }),
      }).catch(err => console.error("Error tracking login:", err))
    }
  }, [isLoaded, user])

  return null
}

