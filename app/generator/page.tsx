"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Loader2, Eye, Code } from "lucide-react"
import { liquidToPreviewHtml, hasRenderableContent } from "@/lib/liquid-preview"

export default function GeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [sectionInput, setSectionInput] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("code")
  
  // Generate preview HTML from liquid code
  const previewHtml = useMemo(() => {
    if (!generatedCode) {
      return null
    }
    
    if (!hasRenderableContent(generatedCode)) {
      console.log("No renderable content detected in generated code")
      return null
    }
    
    try {
      const html = liquidToPreviewHtml(generatedCode)
      console.log("Preview HTML generated successfully", html.substring(0, 200))
      return html
    } catch (error) {
      console.error("Error generating preview:", error)
      return null
    }
  }, [generatedCode])

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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionInput: sectionInput.trim(),
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

          {/* Generated Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Section</CardTitle>
              <CardDescription>Your Shopify section liquid code with schema tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedCode ? (
                <>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </Button>
                    <Button onClick={downloadLiquid} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download .liquid
                    </Button>
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="code">
                        <Code className="mr-2 h-4 w-4" />
                        Code
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="code" className="mt-4">
                      <Textarea
                        value={generatedCode}
                        readOnly
                        className="font-mono text-sm min-h-[400px]"
                      />
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-4">
                      {previewHtml ? (
                        <div className="border rounded-md overflow-hidden bg-background" style={{ height: '400px' }}>
                          <iframe
                            key={generatedCode.substring(0, 50)} // Force re-render when code changes
                            srcDoc={previewHtml}
                            className="w-full h-full border-0"
                            title="Section Preview"
                            sandbox="allow-same-origin allow-scripts"
                            style={{ backgroundColor: 'transparent' }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[400px] text-muted-foreground border rounded-md">
                          <div className="text-center">
                            <p className="mb-2">Preview not available</p>
                            <p className="text-xs">This section may not contain renderable HTML content</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <p>Generated code will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

