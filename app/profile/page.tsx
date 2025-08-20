"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Camera, Save, Trash2, Upload, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { profile, loading, error, updateProfile, uploadAvatar, removeAvatar, deleteAccount } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedEmailOptIn, setEditedEmailOptIn] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize edited values when profile loads
  useEffect(() => {
    if (profile) {
      setEditedName(profile.name)
      setEditedEmailOptIn(profile.emailOptIn)
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      await updateProfile({
        name: editedName,
        emailOptIn: editedEmailOptIn
      })
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditedName(profile.name)
      setEditedEmailOptIn(profile.emailOptIn)
    }
    setIsEditing(false)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      await uploadAvatar(file)
    } catch (err) {
      console.error("Failed to upload avatar:", err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true)
      await removeAvatar()
    } catch (err) {
      console.error("Failed to remove avatar:", err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
    } catch (err) {
      console.error("Failed to delete account:", err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p>Please log in to view your profile.</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-500">Error loading profile: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.image || "/default-user-avatar.png"} alt={profile.name} />
              <AvatarFallback className="text-lg">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="font-medium">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">Upload a new profile photo (max 2MB)</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePhotoClick}
                  disabled={uploadingAvatar}
                  className="hover:cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </Button>
                {profile.image && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="hover:cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <span className="flex-1">{profile.name}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">{profile.email}</span>
                {profile.verified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end">
            <div className="space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !editedName.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button className="hover:cursor-pointer" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Profile Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Your personal preferences for the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive updates about your exams and progress</p>
              </div>
              <Switch
                checked={isEditing ? editedEmailOptIn : profile.emailOptIn}
                onCheckedChange={setEditedEmailOptIn}
                disabled={!isEditing}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Study Statistics</CardTitle>
          <CardDescription>Your progress and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{profile.stats.completedExams}</div>
              <div className="text-sm text-muted-foreground">Completed Exams</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{profile.stats.totalAttempts}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{profile.stats.purchasedExams}</div>
              <div className="text-sm text-muted-foreground">Purchased Exams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that will permanently affect your account</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full text-white hover:cursor-pointer hover:bg-destructive/90 hover:text-white hover:border-black">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from
                  our servers, including:
                  <br />• All exam results and progress
                  <br />• Profile information and settings
                  <br />• Study statistics and history
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white hover:cursor-pointer"
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
