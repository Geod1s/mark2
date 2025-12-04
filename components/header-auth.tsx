"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Store, Package, LogOut, LayoutDashboard } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Profile, Vendor } from "@/lib/types"

interface HeaderAuthProps {
  user: SupabaseUser | null
  profile: Profile | null
  vendor: Vendor | null
}

export function HeaderAuth({ user, profile, vendor }: HeaderAuthProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      router.push("/")
      router.refresh()
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button size="sm">Sign up</Button>
        </Link>
      </div>
    )
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {vendor ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Vendor Dashboard
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/become-vendor" className="flex items-center cursor-pointer">
              <Store className="mr-2 h-4 w-4" />
              Become a Vendor
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/orders" className="flex items-center cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
