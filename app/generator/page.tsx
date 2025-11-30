"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Loader2, FileText, Code } from "lucide-react"

export default function GeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [sectionInput, setSectionInput] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [previewImage, setPreviewImage] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("code")
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

      if (!data.liquidCode) {
        throw new Error("No code generated. Please try again.")
      }

      setGeneratedCode(data.liquidCode)
      setPreviewImage(data.previewImage || "")
      
      // Track the generated section ID and input for next generation
      if (data.sectionId) {
        if (currentInput === lastInput) {
          // Add to excluded list if same input
          setExcludedSectionIds(prev => {
            if (!prev.includes(data.sectionId)) {
              return [...prev, data.sectionId]
            }
            return prev
          })
        } else {
          // Reset excluded list for new input
          setExcludedSectionIds([data.sectionId])
          setLastInput(currentInput)
        }
      }
      
      toast({
        title: "Success",
        description: "Section generated successfully!",
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
    navigator.clipboard.writeText(generatedCode)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    })
  }

  const downloadLiquid = () => {
    if (!generatedCode) return

    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `section-${Date.now()}.liquid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Section file downloaded successfully",
    })
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

          {/* Generated Section Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Section</CardTitle>
              <CardDescription>Click on the preview image to view and copy the code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedCode ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <Button onClick={downloadLiquid} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download .liquid
                    </Button>
                  </div>
                  
                  {/* Preview Image - Clickable */}
                  <div 
                    className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                    onClick={() => setIsModalOpen(true)}
                  >
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Section Preview" 
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[400px] bg-muted/50 text-muted-foreground">
                        <div className="text-center">
                          <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Preview image not available</p>
                          <p className="text-xs mt-1">Click to view code</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-4 py-2 rounded-md border">
                        <p className="text-sm font-medium">Click to view code</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal with Image and Code */}
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0 gap-0 overflow-hidden">
                      <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle>Section Code</DialogTitle>
                        <DialogDescription>
                          Preview on the left, code on the right. Click copy to copy the code.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col md:flex-row h-[calc(95vh-180px)] min-h-[400px] overflow-hidden">
                        {/* Left Side - Image */}
                        <div className="md:w-1/2 w-full bg-muted/30 p-4 md:p-6 overflow-auto flex items-center justify-center border-r border-border">
                          {previewImage ? (
                            <img 
                              src={previewImage} 
                              alt="Section Preview" 
                              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">Preview image not available</p>
                                <p className="text-xs mt-2 opacity-75">Add a preview_image field to your section JSON</p>
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
                          </div>
                          <div className="flex-1 overflow-auto">
                            <Textarea
                              value={generatedCode}
                              readOnly
                              className="font-mono text-xs md:text-sm min-h-[300px] resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <p>Generated section preview will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

