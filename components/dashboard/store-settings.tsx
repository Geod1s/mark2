"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Vendor } from "@/lib/types"

interface StoreSettingsProps {
  vendor: Vendor
}

export function StoreSettings({ vendor }: StoreSettingsProps) {
  const [storeName, setStoreName] = useState(vendor.store_name)
  const [description, setDescription] = useState(vendor.description || "")
  const [logoUrl, setLogoUrl] = useState(vendor.logo_url || "")
  const [bannerUrl, setBannerUrl] = useState(vendor.banner_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase
      .from("vendors")
      .update({
        store_name: storeName,
        description: description || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
      })
      .eq("id", vendor.id)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Settings saved successfully!" })
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="storeName">POS Name</Label>
          <Input
            id="storeName"
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            
          />
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="slug">POS URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">marketjo.com/pos/</span>
            <Input id="slug" type="text" value={vendor.slug} disabled />
          </div>
          <p className="text-xs text-muted-foreground">POS URL cannot be changed</p>
        </div> */}

        {/* <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about your store..."
            className="min-h-[100px] resize-none"
          />
        </div> */}

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.jpg"
            
          />
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="bannerUrl">Banner URL</Label>
          <Input
            id="bannerUrl"
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
            className="bg-secondary border-0"
          />
        </div> */}
      </div>

      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
