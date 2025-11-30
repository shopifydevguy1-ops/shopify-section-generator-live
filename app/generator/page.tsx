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

      setGeneratedSections(data.sections)
      setSelectedSection(null) // Reset selection
      
      toast({
        title: "Success",
        description: `Found ${data.sections.length} section${data.sections.length > 1 ? 's' : ''}. Click on an image to view the code.`,
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Section Generator</h1>
          <p className="text-muted-foreground">Enter section references to generate your Shopify section with schema tags</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Section Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Section</CardTitle>
                <CardDescription>Describe what you need in natural language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section-input">What section do you need?</Label>
                  <Textarea
                    id="section-input"
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    placeholder="I need a hero banner with gradient background and CTA button"
                    className="mt-1 min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Describe what you need in plain English (e.g., &quot;hero banner with animation&quot;). The system will automatically find the best matching sections from the library.
                  </p>
                </div>
                <Button
                  onClick={generateSection}
                  disabled={loading || !sectionInput.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Section"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Sections Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Sections</CardTitle>
              <CardDescription>
                {generatedSections.length > 0 
                  ? `Found ${generatedSections.length} section${generatedSections.length > 1 ? 's' : ''}. Click on an image to view and copy the code.`
                  : "Generated sections will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedSections.length > 0 ? (
                <>
                  {/* Grid of Section Previews */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSections.map((section, index) => (
                      <div
                        key={section.sectionId}
                        className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-lg"
                        onClick={() => handleSectionSelect(section)}
                      >
                        {section.previewImage ? (
                          <div className="relative aspect-video bg-muted/30">
                            <Image 
                              src={section.previewImage} 
                              alt={section.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center bg-muted/50 text-muted-foreground">
                            <div className="text-center p-4">
                              <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-medium">{section.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3 bg-background border-t">
                          <h3 className="font-semibold text-sm truncate">{section.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-1">{section.description}</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium border">
                            Click to view code
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal with Image and Code */}
                  {selectedSection && (
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 gap-0 overflow-hidden">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b">
                          <DialogTitle>{selectedSection.name}</DialogTitle>
                          <DialogDescription>
                            {selectedSection.description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col md:flex-row h-[calc(95vh-180px)] min-h-[400px] overflow-hidden">
                          {/* Left Side - Image */}
                          <div className="md:w-1/2 w-full bg-muted/30 p-4 md:p-6 overflow-auto flex items-center justify-center border-r border-border">
                            {selectedSection.previewImage ? (
                              <div className="relative w-full h-full min-h-[300px]">
                                <Image 
                                  src={selectedSection.previewImage} 
                                  alt={selectedSection.name}
                                  fill
                                  className="object-contain rounded-lg shadow-lg"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                  <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                  <p className="text-sm">Preview image not available</p>
                                  <p className="text-xs mt-2 opacity-75">Section: {selectedSection.sectionId}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Side - Code */}
                          <div className="md:w-1/2 w-full flex flex-col p-4 md:p-6 overflow-hidden">
                            <div className="flex gap-2 mb-4">
                              <Button onClick={copyToClipboard} variant="outline" size="sm" className="flex-1">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Code
                              </Button>
                              <Button onClick={downloadLiquid} variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                            <div className="flex-1 overflow-auto">
                              <Textarea
                                value={selectedSection.liquidCode}
                                readOnly
                                className="font-mono text-xs md:text-sm min-h-[300px] resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generated sections will appear here</p>
                    <p className="text-sm mt-2 opacity-75">Enter a description and click &quot;Generate Section&quot;</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

