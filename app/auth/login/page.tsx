"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Store, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push(redirect)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2">
              <Store className="h-8 w-8" />
            </Link>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary border-0 placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary border-0"
                />
              </div>
            </div>

            {error && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full h-12 font-medium" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
