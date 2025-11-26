"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Loader2 } from "lucide-react"

interface SectionTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  type: string
  liquid_code: string
  variables: Record<string, any>
}

export default function GeneratorPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [templates, setTemplates] = useState<SectionTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SectionTemplate | null>(null)
  const [customizations, setCustomizations] = useState<Record<string, any>>({})
  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [types, setTypes] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<string>("")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }

    // Load templates
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => {
        if (data.templates) {
          setTemplates(data.templates)
          const uniqueTypes = Array.from(new Set(data.templates.map((t: SectionTemplate) => t.type)))
          setTypes(uniqueTypes as string[])
        }
      })
      .catch(err => {
        console.error("Error loading templates:", err)
        toast({
          title: "Error",
          description: "Failed to load templates. Please try again.",
          variant: "destructive",
        })
      })
  }, [user, isLoaded, router, toast])

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      // Initialize customizations with default values
      const defaults: Record<string, any> = {}
      for (const [key, variable] of Object.entries(template.variables)) {
        defaults[key] = variable.default
      }
      setCustomizations(defaults)
      setGeneratedCode("")
    }
  }

  const handleCustomizationChange = (key: string, value: any) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const generateSection = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
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
          templateId: selectedTemplate.id,
          customizations,
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
    if (!generatedCode || !selectedTemplate) return

    const blob = new Blob([generatedCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, "-")}.liquid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: "Section file downloaded successfully",
    })
  }

  const filteredTemplates = selectedType
    ? templates.filter(t => t.type === selectedType)
    : templates

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
          <p className="text-muted-foreground">Select a template and customize it to generate your Shopify section</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Template Selection & Customization */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Template</CardTitle>
                <CardDescription>Choose a section type and template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Section Type</Label>
                  <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Template</Label>
                  <Select
                    value={selectedTemplate?.id || ""}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-semibold mb-2">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Customize</CardTitle>
                  <CardDescription>Adjust the template variables</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(selectedTemplate.variables).map(([key, variable]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{variable.label}</Label>
                      {variable.type === "textarea" ? (
                        <Textarea
                          id={key}
                          value={customizations[key] || ""}
                          onChange={(e) => handleCustomizationChange(key, e.target.value)}
                          placeholder={variable.description}
                          className="mt-1"
                        />
                      ) : (
                        <Input
                          id={key}
                          type={variable.type === "color" ? "color" : "text"}
                          value={customizations[key] || ""}
                          onChange={(e) => handleCustomizationChange(key, e.target.value)}
                          placeholder={variable.description}
                          className="mt-1"
                        />
                      )}
                      {variable.description && (
                        <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={generateSection}
                    disabled={loading}
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
            )}
          </div>

          {/* Generated Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Code</CardTitle>
              <CardDescription>Your Shopify section liquid code</CardDescription>
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
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="font-mono text-sm min-h-[400px]"
                  />
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

