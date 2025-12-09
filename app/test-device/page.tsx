"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { Loader2, Fingerprint, AlertCircle, CheckCircle2 } from "lucide-react"

export default function TestDevicePage() {
  const { user, isLoaded } = useUser()
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [trialCheck, setTrialCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      const fp = generateDeviceFingerprint()
      setFingerprint(fp)
    }
  }, [isLoaded])

  const checkTrialStatus = async () => {
    if (!fingerprint || !user) return

    setLoading(true)
    setError(null)
    try {
      // First, send fingerprint to track-login
      await fetch("/api/track-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprintHash: fingerprint,
        }),
      })

      // Then check trial status
      const response = await fetch("/api/test-trial-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprintHash: fingerprint,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check trial status")
      }

      setTrialCheck(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] relative">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Device Fingerprint Test</h1>
            <p className="text-muted-foreground">
              Test your device fingerprinting and trial abuse prevention
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Your Device Fingerprint
                </CardTitle>
                <CardDescription>
                  This unique identifier is generated based on your device/browser characteristics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fingerprint ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <code className="text-sm break-all">{fingerprint}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Fingerprint generated successfully
                    </div>
                    <Button onClick={checkTrialStatus} disabled={loading || !user}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Trial Status"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating fingerprint...
                  </div>
                )}
              </CardContent>
            </Card>

            {trialCheck && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Trial Status Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <strong>Fingerprint:</strong>{" "}
                        <code className="text-sm break-all">{trialCheck.fingerprint || 'Not provided'}</code>
                      </div>
                      <div>
                        <strong>IP Address:</strong>{" "}
                        <code className="text-sm">{trialCheck.ipAddress || 'Not detected'}</code>
                      </div>
                      <div className="p-3 rounded-lg border" style={{
                        backgroundColor: trialCheck.summary?.hasUsedTrial ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        borderColor: trialCheck.summary?.hasUsedTrial ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                      }}>
                        <div className="flex items-center gap-2 mb-2">
                          {trialCheck.summary?.hasUsedTrial ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          <strong>
                            {trialCheck.summary?.hasUsedTrial ? 'Trial Already Used' : 'Trial Available'}
                          </strong>
                        </div>
                        <p className="text-sm">
                          {trialCheck.trialCheck?.reason || 'No previous trial found for this device/IP'}
                        </p>
                        {trialCheck.trialCheck?.existingUserEmail && (
                          <p className="text-sm mt-2">
                            Previous account: <code>{trialCheck.trialCheck.existingUserEmail}</code>
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{trialCheck.summary?.accountsOnSameDevice || 0}</div>
                          <div className="text-xs text-muted-foreground">Accounts on Same Device</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{trialCheck.summary?.accountsOnSameIP || 0}</div>
                          <div className="text-xs text-muted-foreground">Accounts on Same IP</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {trialCheck.deviceRecords && trialCheck.deviceRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounts on This Device</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trialCheck.deviceRecords.map((record: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>{record.email}</strong>
                                <Badge variant="outline" className="ml-2">{record.plan}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(record.user_created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {trialCheck.ipRecords && trialCheck.ipRecords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Accounts on This IP Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trialCheck.ipRecords.map((record: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>{record.email}</strong>
                                <Badge variant="outline" className="ml-2">{record.plan}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(record.user_created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {error && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Step 1: Note Your Fingerprint</h4>
                    <p className="text-muted-foreground">
                      Copy the fingerprint above. This should remain the same on this device.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Step 2: Create First Account</h4>
                    <p className="text-muted-foreground">
                      Sign up with email: <code>test1@example.com</code>
                      <br />
                      Use the free trial (20 copies)
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Step 3: Create Second Account</h4>
                    <p className="text-muted-foreground">
                      Sign out and create a new account with: <code>test2@example.com</code>
                      <br />
                      Try to use the free trial
                      <br />
                      <strong>Expected:</strong> Should be blocked or warned
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Step 4: Check Database</h4>
                    <p className="text-muted-foreground">
                      Run this SQL in Supabase to see device associations:
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
{`SELECT 
  df.fingerprint_hash,
  COUNT(DISTINCT u.id) as accounts,
  STRING_AGG(u.email, ', ') as emails
FROM device_fingerprints df
JOIN users u ON df.user_id = u.id
GROUP BY df.fingerprint_hash
HAVING COUNT(DISTINCT u.id) > 1;`}
                      </pre>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Account Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
                    </div>
                    <div>
                      <strong>User ID:</strong> <code className="text-xs">{user.id}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

