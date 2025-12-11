"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Loader2, Code, BookOpen, X } from "lucide-react"
import { TrackLogin } from "@/components/track-login"
import { DeviceMockup } from "@/components/device-mockup"

export default function GeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [sectionInput, setSectionInput] = useState<string>("")
  const [generatedSections, setGeneratedSections] = useState<Array<{
    liquidCode: string
    sectionId: string
    previewImage?: string
    name: string
    description: string
  }>>([])
  const [selectedSection, setSelectedSection] = useState<{
    liquidCode: string
    sectionId: string
    previewImage?: string
    name: string
    description: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [excludedSectionIds, setExcludedSectionIds] = useState<string[]>([])
  const [lastInput, setLastInput] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [downloadStats, setDownloadStats] = useState<{
    count: number
    limit: number
    remaining: number
    allowed: boolean
  } | null>(null)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }
    
    // Fetch download stats immediately when user is loaded
    if (isLoaded && user) {
      console.log('[Generator] User loaded, fetching download stats immediately...')
      fetchDownloadStats()
    }
  }, [user, isLoaded, router])

  const fetchDownloadStats = async () => {
    try {
      // Add cache-busting to ensure fresh data
      const response = await fetch(`/api/sections/download?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Generator] Fetched download stats:', data)
        setDownloadStats({
          count: data.count,
          limit: data.limit === null ? Infinity : data.limit,
          remaining: data.remaining === null ? Infinity : data.remaining,
          allowed: data.allowed
        })
      }
    } catch (error) {
      console.error("Error fetching download stats:", error)
    }
  }

  const generateSection = async () => {
    if (!sectionInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter section references",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // If the input is the same as last time, exclude the previously generated section
      // If it's different, reset the excluded list
      const currentInput = sectionInput.trim()
      const excludedIds = currentInput === lastInput ? excludedSectionIds : []
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionInput: currentInput,
          excludedSectionIds: excludedIds,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate section: ${response.status}`)
      }

      if (!data.sections || data.sections.length === 0) {
        throw new Error("No sections found. Please try again with a different query.")
      }

      // Verify sections have complete content
      const verifiedSections = data.sections.map((section: any) => {
        const hasSchema = section.liquidCode?.includes('{% schema %}') && section.liquidCode?.includes('{% endschema %}')
        if (!hasSchema && section.liquidCode) {
          console.warn(`[Generator] Section ${section.sectionId} missing schema in liquidCode (${section.liquidCode.length} chars)`)
        }
        return section
      })

      setGeneratedSections(verifiedSections)
      setSelectedSection(null) // Reset selection
      
      // Refresh download stats after generating new sections to ensure they're up to date
      await fetchDownloadStats()
      
      toast({
        title: "Success",
        description: `Generated ${data.sections.length} section${data.sections.length > 1 ? 's' : ''}. Click on any section to view instructions.`,
      })
    } catch (error: any) {
      console.error("Error generating section:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate section. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!selectedSection) return

    try {
      // Check limit before copying
      const response = await fetch("/api/sections/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSection.sectionId,
          action: "copy"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.reached) {
          toast({
            title: "Download Limit Reached",
            description: data.error || "You have reached your download/copy limit. Upgrade to Pro for unlimited downloads.",
            variant: "destructive",
          })
        } else {
          throw new Error(data.error || "Failed to copy")
        }
        return
      }

      // Copy to clipboard
      navigator.clipboard.writeText(selectedSection.liquidCode)
      
      // Update stats with fresh data from response
      const remaining = data.remaining === null || data.remaining === undefined ? Infinity : data.remaining
      const newStats = {
        count: data.count,
        limit: data.limit === null ? Infinity : data.limit,
        remaining: remaining,
        allowed: data.allowed !== undefined ? data.allowed : (remaining === Infinity || remaining > 0)
      }
      
      console.log('[Generator] Copy successful, updating stats:', newStats)
      setDownloadStats(newStats)
      
      // Refresh stats from server to ensure sync (with a small delay to allow server to process)
      setTimeout(() => {
        console.log('[Generator] Refreshing stats after copy...')
        fetchDownloadStats()
      }, 500)

      toast({
        title: "Copied!",
        description: remaining === Infinity
          ? "Code copied to clipboard" 
          : `${remaining} download${remaining !== 1 ? 's' : ''} remaining`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to copy code",
        variant: "destructive",
      })
    }
  }

  const downloadLiquid = async () => {
    if (!selectedSection) return

    try {
      // Check limit before downloading
      const response = await fetch("/api/sections/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSection.sectionId,
          action: "download"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.reached) {
          toast({
            title: "Download Limit Reached",
            description: data.error || "You have reached your download/copy limit. Upgrade to Pro for unlimited downloads.",
            variant: "destructive",
          })
        } else {
          throw new Error(data.error || "Failed to download")
        }
        return
      }

      // Download the file
      const blob = new Blob([selectedSection.liquidCode], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedSection.sectionId}-${Date.now()}.liquid`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update stats with fresh data from response
      const remaining = data.remaining === null || data.remaining === undefined ? Infinity : data.remaining
      const newStats = {
        count: data.count,
        limit: data.limit === null ? Infinity : data.limit,
        remaining: remaining,
        allowed: data.allowed !== undefined ? data.allowed : (remaining === Infinity || remaining > 0)
      }
      
      console.log('[Generator] Download successful, updating stats:', newStats)
      setDownloadStats(newStats)
      
      // Refresh stats from server to ensure sync (with a small delay to allow server to process)
      setTimeout(() => {
        console.log('[Generator] Refreshing stats after download...')
        fetchDownloadStats()
      }, 500)
      
      toast({
        title: "Downloaded!",
        description: remaining === Infinity
          ? "Section file downloaded successfully" 
          : `${remaining} download${remaining !== 1 ? 's' : ''} remaining`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleSectionSelect = (section: typeof selectedSection) => {
    setSelectedSection(section)
    setIsModalOpen(true)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <TrackLogin />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Section Generator
          </h1>
          <p className="text-muted-foreground text-lg">Generate a high converting section</p>
        </div>

        {/* Section Input - Full Width on Top */}
        <div className="mb-8">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Describe Your Section</CardTitle>
              <CardDescription className="text-base">Describe what you need in natural language - individual sections or complete landing pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="section-input" className="text-base font-semibold">What section do you need?</Label>
                <Textarea
                  id="section-input"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  placeholder="I need a hero banner with gradient background and CTA button, or create a complete landing page for a product launch"
                  className="mt-2 min-h-[150px] text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      generateSection()
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Search for sections by name, tags, or description (e.g., &quot;hero&quot;, &quot;banner&quot;, &quot;testimonial&quot;). You can also generate complete landing pages - just describe your landing page needs and the system will generate a section composed of a whole landing page from top to bottom, including header, hero, features, testimonials, and footer. The system will find matching sections from your /sections folder.
                </p>
              </div>
              <Button
                onClick={generateSection}
                disabled={loading || !sectionInput.trim()}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Section...
                  </>
                ) : (
                  "Generate Section"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Sections Preview - Full Width Below */}
        {generatedSections.length > 0 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">Generated Sections</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Click on any section below to view instructions on how to add it to your Shopify store.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Grid of Section Previews - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {generatedSections.map((section, index) => (
                  <div
                    key={section.sectionId}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-xl hover:scale-[1.02] bg-card"
                    onClick={() => handleSectionSelect(section)}
                  >
                    {section.previewImage ? (
                      <div className="relative aspect-video bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden flex items-center justify-center py-4">
                        <DeviceMockup 
                          previewImage={section.previewImage}
                          alt={section.name}
                          showLaptopMobileOnly={true}
                          className="scale-75 sm:scale-90 md:scale-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground">
                        <div className="text-center p-4">
                          <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">{section.name}</p>
                        </div>
                      </div>
                    )}
                    <div className="p-4 bg-background">
                      <h3 className="font-semibold text-base truncate mb-1">{section.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{section.description || "No description available"}</p>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-semibold text-primary-foreground shadow-lg">
                        View Code
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal with Image, Instructions, and Code */}
              {selectedSection && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                      <DialogTitle className="text-2xl">{selectedSection.name}</DialogTitle>
                      <DialogDescription className="text-base">
                        {selectedSection.description || "No description available"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col lg:flex-row h-[calc(95vh-180px)] min-h-[400px] overflow-hidden">
                      {/* Left Side - Preview with Laptop and Mobile */}
                      <div className="lg:w-2/5 w-full bg-gradient-to-br from-muted/30 to-muted/10 p-4 md:p-6 overflow-auto flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border min-h-[300px] lg:min-h-0">
                        <DeviceMockup 
                          previewImage={selectedSection.previewImage}
                          alt={selectedSection.name}
                          showLaptopMobileOnly={true}
                          className="py-4"
                        />
                      </div>
                      
                      {/* Right Side - Instructions and Code */}
                      <div className="lg:w-3/5 w-full flex flex-col overflow-hidden bg-background">
                        {/* Instructions Section */}
                        <div className="border-b border-border bg-muted/20 p-4 md:p-6 overflow-y-auto flex-shrink-0" style={{ maxHeight: '35%' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">How to Add Section to Shopify</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                1
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Access Your Theme Editor</h4>
                                <p className="text-xs text-muted-foreground">
                                  Go to Shopify admin → <strong>Online Store</strong> → <strong>Themes</strong> → Click <strong>&quot;Customize&quot;</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                2
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Navigate to Theme Files</h4>
                                <p className="text-xs text-muted-foreground">
                                  Click <strong>&quot;Theme settings&quot;</strong> (gear icon) or access <strong>&quot;Sections&quot;</strong> folder
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                3
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Upload the Section File</h4>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Click <strong>&quot;Add a new section&quot;</strong> and name it: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{selectedSection.sectionId}.liquid</code>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Paste the code below or download the file
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                4
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Add Section to Your Page</h4>
                                <p className="text-xs text-muted-foreground">
                                  Go back to page editor → Click <strong>&quot;Add section&quot;</strong> → Select your new section
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                5
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Customize and Save</h4>
                                <p className="text-xs text-muted-foreground">
                                  Customize settings in the sidebar, then click <strong>&quot;Save&quot;</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Code Section */}
                        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                          <div className="flex flex-col gap-2 mb-4">
                            <div className="flex gap-2">
                              <Button 
                                onClick={copyToClipboard} 
                                variant="default" 
                                size="sm" 
                                className="flex-1"
                                disabled={!selectedSection || (downloadStats ? !downloadStats.allowed : false)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Code
                              </Button>
                              <Button 
                                onClick={downloadLiquid} 
                                variant="outline" 
                                size="sm"
                                disabled={!selectedSection || (downloadStats ? !downloadStats.allowed : false)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                            {downloadStats && downloadStats.limit !== Infinity && (
                              <p className="text-xs text-muted-foreground text-center">
                                {downloadStats.remaining > 0 
                                  ? `${downloadStats.remaining} download${downloadStats.remaining !== 1 ? 's' : ''} remaining (${downloadStats.count}/${downloadStats.limit} used)`
                                  : `Download limit reached (${downloadStats.count}/${downloadStats.limit}). Upgrade to Pro for unlimited downloads.`
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4">
                            <Textarea
                              value={selectedSection.liquidCode || ''}
                              readOnly
                              className="font-mono text-xs md:text-sm min-h-[200px] resize-none border-0 bg-transparent"
                              style={{ 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            />
                            {selectedSection.liquidCode && (
                              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                <span>Code length: {selectedSection.liquidCode.length.toLocaleString()} characters</span>
                                {selectedSection.liquidCode.includes('{% schema %}') && selectedSection.liquidCode.includes('{% endschema %}') 
                                  ? <span className="text-green-600 dark:text-green-400">✓ Includes schema</span>
                                  : <span className="text-orange-600 dark:text-orange-400">⚠ Missing schema</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {generatedSections.length === 0 && !loading && (
          <Card className="border-2 shadow-lg">
            <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No sections found yet</p>
                <p className="text-sm opacity-75">Enter keywords above and click &quot;Generate Section&quot; to find matching sections</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

