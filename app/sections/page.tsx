"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionSearchBar } from "@/components/section-search-bar"
import { SectionCard } from "@/components/section-card"
import { SectionPreviewModal } from "@/components/section-preview-modal"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Section {
  filename: string
  name: string
  tags: string[]
  description: string
  liquidCode: string
  previewImage?: string
}

export default function SectionsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [allSections, setAllSections] = useState<Section[]>([])
  const [searchResults, setSearchResults] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "search">("all")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }
  }, [user, isLoaded, router])

  // Load all sections on mount
  useEffect(() => {
    loadAllSections()
  }, [])

  const loadAllSections = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sections/list")
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 403 && errorData.requiresExpert) {
          toast({
            title: "Expert Plan Required",
            description: errorData.error || "Full section library access requires Expert plan. Upgrade to browse and download unlimited sections.",
            variant: "destructive",
          })
          router.push("/pricing")
          return
        }
        throw new Error(errorData.error || "Failed to load sections")
      }

      const data = await response.json()
      setAllSections(data.sections || [])
      setSearchResults(data.sections || [])
    } catch (error: any) {
      console.error("Error loading sections:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(allSections)
      setActiveTab("all")
      return
    }

    try {
      setLoading(true)
      setSearchQuery(query)
      setActiveTab("search")

      const response = await fetch(`/api/sections/search?query=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error("Failed to search sections")
      }

      const data = await response.json()
      setSearchResults(data.sections || [])

      if (data.sections.length === 0) {
        toast({
          title: "No results",
          description: `No sections found for "${query}"`,
        })
      }
    } catch (error: any) {
      console.error("Error searching sections:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to search sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (section: Section) => {
    setSelectedSection(section)
    setIsModalOpen(true)
  }

  const sectionsToDisplay = activeTab === "search" ? searchResults : allSections

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Section Library</h1>
          <p className="text-muted-foreground">
            Browse and search existing sections from your /sections folder
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Sections</CardTitle>
            <CardDescription>
              Search by name, tags, description, or filename
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SectionSearchBar onSearch={handleSearch} loading={loading} />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "search")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All Sections ({allSections.length})
            </TabsTrigger>
            {searchQuery && (
              <TabsTrigger value="search">
                Search Results ({searchResults.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sectionsToDisplay.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === "search" 
                      ? `No sections found for "${searchQuery}"`
                      : "No sections found in /sections folder"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionsToDisplay.map((section) => (
                  <SectionCard
                    key={section.filename}
                    section={section}
                    onClick={() => handleSectionClick(section)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SectionPreviewModal
          section={selectedSection}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </main>
    </div>
  )
}

