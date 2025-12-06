"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Edit } from "lucide-react"
import { EditProfileDialog } from "./edit-profile-dialog"

interface AccountProfileCardProps {
  user: {
    firstName: string | null
    lastName: string | null
    email: string
    id: string
  }
}

export function AccountProfileCard({ user }: AccountProfileCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  const handleProfileUpdated = () => {
    // Refresh the page to get updated user data
    window.location.reload()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{currentUser.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-sm">
              {currentUser.firstName || currentUser.lastName
                ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="text-sm font-mono text-xs">{currentUser.id}</p>
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  )
}

