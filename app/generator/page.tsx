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
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Loader2, FileText, Code } from "lucide-react"

export default function GeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [sectionInput, setSectionInput] = useState<string>("")
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("code")
  const [excludedSectionIds, setExcludedSectionIds] = useState<string[]>([])
  const [lastInput, setLastInput] = useState<string>("")

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
                      <TabsTrigger value="instructions">
                        <FileText className="mr-2 h-4 w-4" />
                        Instructions
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="code" className="mt-4">
                      <Textarea
                        value={generatedCode}
                        readOnly
                        className="font-mono text-sm min-h-[400px]"
                      />
                    </TabsContent>
                    
                    <TabsContent value="instructions" className="mt-4">
                      <div className="space-y-4 text-sm">
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <h3 className="font-semibold text-base mb-3">How to Add This Section to Shopify</h3>
                          <ol className="space-y-3 list-decimal list-inside">
                            <li className="space-y-1">
                              <span className="font-medium">Download the section file</span>
                              <p className="text-muted-foreground ml-6">Click the &quot;Download .liquid&quot; button above to save the file to your computer.</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Access your Shopify theme</span>
                              <p className="text-muted-foreground ml-6">Go to your Shopify admin → Online Store → Themes → Actions → Edit code</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Navigate to the sections folder</span>
                              <p className="text-muted-foreground ml-6">In the left sidebar, click on &quot;Sections&quot; folder</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Add a new section file</span>
                              <p className="text-muted-foreground ml-6">Click &quot;Add a new section&quot; and give it a name (e.g., &quot;custom-hero.liquid&quot;)</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Paste your code</span>
                              <p className="text-muted-foreground ml-6">Copy the entire code from the &quot;Code&quot; tab and paste it into the new section file. Click &quot;Save&quot;</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Add to your page</span>
                              <p className="text-muted-foreground ml-6">Go to Online Store → Themes → Customize. Navigate to the page where you want to add the section, then click &quot;Add section&quot; and select your new section from the list.</p>
                            </li>
                            <li className="space-y-1">
                              <span className="font-medium">Customize settings</span>
                              <p className="text-muted-foreground ml-6">Click on the section in the theme editor to customize colors, text, images, and other settings defined in the schema.</p>
                            </li>
                          </ol>
                        </div>
                        
                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Pro Tips:</h4>
                          <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-xs ml-4 list-disc">
                            <li>Make sure your theme supports Online Store 2.0 (sections everywhere)</li>
                            <li>You can add this section to any page: home, product, collection, or custom pages</li>
                            <li>Test the section on different screen sizes using the theme editor&apos;s responsive preview</li>
                            <li>If you encounter errors, check the browser console and ensure all required settings are configured</li>
                          </ul>
                        </div>
                        
                        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
                          <h4 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">⚠️ Important Notes:</h4>
                          <ul className="space-y-2 text-amber-800 dark:text-amber-200 text-xs ml-4 list-disc">
                            <li>Always backup your theme before making changes</li>
                            <li>Some sections may require specific theme features or CSS classes to work properly</li>
                            <li>If the section doesn&apos;t appear, check that the file name ends with &quot;.liquid&quot;</li>
                            <li>For best results, use a theme that&apos;s compatible with Shopify Online Store 2.0</li>
                          </ul>
                        </div>
                      </div>
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

