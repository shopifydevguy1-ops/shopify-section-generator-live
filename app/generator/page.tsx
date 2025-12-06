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
import { Copy, Download, Loader2, Code } from "lucide-react"

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

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }
  }, [user, isLoaded, router])

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
      
      toast({
        title: "Success",
        description: `Found ${data.sections.length} section${data.sections.length > 1 ? 's' : ''} from /sections folder. Click on an image to view the code.`,
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

  const copyToClipboard = () => {
    if (!selectedSection) return
    navigator.clipboard.writeText(selectedSection.liquidCode)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    })
  }

  const downloadLiquid = () => {
    if (!selectedSection) return

    const blob = new Blob([selectedSection.liquidCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedSection.sectionId}-${Date.now()}.liquid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Section file downloaded successfully",
    })
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
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Section Generator
          </h1>
          <p className="text-muted-foreground text-lg">Search and find sections from your /sections folder</p>
        </div>

        {/* Section Input - Full Width on Top */}
        <div className="mb-8">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Describe Your Section</CardTitle>
              <CardDescription className="text-base">Describe what you need in natural language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="section-input" className="text-base font-semibold">What section do you need?</Label>
                <Textarea
                  id="section-input"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  placeholder="I need a hero banner with gradient background and CTA button"
                  className="mt-2 min-h-[150px] text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      generateSection()
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Search for sections by name, tags, or description (e.g., &quot;hero&quot;, &quot;banner&quot;, &quot;testimonial&quot;). The system will find matching sections from your /sections folder.
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
                    Searching Sections...
                  </>
                ) : (
                  "Search Sections"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Sections Preview - Full Width Below */}
        {generatedSections.length > 0 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Generated Sections</CardTitle>
              <CardDescription className="text-base">
                Found {generatedSections.length} section{generatedSections.length > 1 ? 's' : ''} from /sections folder. Click on an image to view and copy the code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grid of Section Previews - Larger and More Spacious */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {generatedSections.map((section, index) => (
                  <div
                    key={section.sectionId}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-xl hover:scale-[1.02] bg-card"
                    onClick={() => handleSectionSelect(section)}
                  >
                    {section.previewImage ? (
                      <div className="relative aspect-video bg-muted/30">
                        <Image 
                          src={section.previewImage} 
                          alt={section.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
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

              {/* Modal with Image and Code */}
              {selectedSection && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                      <DialogTitle className="text-2xl">{selectedSection.name}</DialogTitle>
                      <DialogDescription className="text-base">
                        {selectedSection.description || "No description available"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col md:flex-row h-[calc(95vh-180px)] min-h-[400px] overflow-hidden">
                      {/* Left Side - Image */}
                      <div className="md:w-1/2 w-full bg-gradient-to-br from-muted/30 to-muted/10 p-4 md:p-6 overflow-auto flex items-center justify-center border-r border-border">
                        {selectedSection.previewImage ? (
                          <div className="relative w-full h-full min-h-[300px]">
                            <Image 
                              src={selectedSection.previewImage} 
                              alt={selectedSection.name}
                              fill
                              className="object-contain rounded-lg shadow-2xl"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p className="text-sm font-medium">Preview image not available</p>
                              <p className="text-xs mt-2 opacity-75">Section: {selectedSection.sectionId}</p>
                              <p className="text-xs mt-1 opacity-50">Add an image to sections/images/{selectedSection.sectionId}.png</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Side - Code */}
                      <div className="md:w-1/2 w-full flex flex-col p-4 md:p-6 overflow-hidden bg-background">
                        <div className="flex gap-2 mb-4">
                          <Button onClick={copyToClipboard} variant="default" size="sm" className="flex-1">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </Button>
                          <Button onClick={downloadLiquid} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4">
                          <Textarea
                            value={selectedSection.liquidCode || ''}
                            readOnly
                            className="font-mono text-xs md:text-sm min-h-[300px] resize-none border-0 bg-transparent"
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
                <p className="text-sm opacity-75">Enter keywords above and click &quot;Search Sections&quot; to find matching sections</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

