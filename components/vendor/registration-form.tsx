"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function VendorRegistrationForm() {
  const [storeName, setStoreName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    if (!slug || slug === generateSlug(storeName)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Please sign in to continue")
      setIsLoading(false)
      return
    }

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error: profileCreateError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
        role: "customer",
      })

      if (profileCreateError) {
        setError("Failed to create user profile: " + profileCreateError.message)
        setIsLoading(false)
        return
      }
    }

    // Check if slug is available
    const { data: existingVendor } = await supabase.from("vendors").select("id").eq("slug", slug).maybeSingle()

    if (existingVendor) {
      setError("This pos URL is already taken. Please choose another.")
      setIsLoading(false)
      return
    }

    // Create vendor profile
    const { error: vendorError } = await supabase.from("vendors").insert({
      user_id: user.id,
      store_name: storeName,
      slug,
      description: description || null,
    })

    if (vendorError) {
      setError(vendorError.message)
      setIsLoading(false)
      return
    }

    // Update user role to vendor
    const { error: profileError } = await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id)

    if (profileError) {
      setError(profileError.message)
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="storeName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          POS Name
        </Label>
        <Input
          id="storeName"
          type="text"
          placeholder="Your POS Name"
          required
          value={storeName}
          onChange={(e) => handleStoreNameChange(e.target.value)}
         
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          POS URL
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">marketjo.com/pos/</span>
          <Input
            id="slug"
            type="text"
            placeholder="your-pos-url"
            required
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
           
          />
          <p className="text-xs text-muted-foreground">POS URL cannot be changed</p>
        </div>
      </div>

      {/* <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Store Description (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Tell customers about your store..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]  resize-none"
        />
      </div> */}

      {error && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full h-12 font-medium" disabled={isLoading}>
        {isLoading ? "Creating POS..." : "Create POS"}
      </Button>
    </form>
  )
}
