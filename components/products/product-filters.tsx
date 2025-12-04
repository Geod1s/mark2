"use client"

import type React from "react"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/lib/types"
import { Search, X } from "lucide-react"
import { useState, useCallback } from "react"

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`${pathname}?${createQueryString("search", searchValue)}`)
  }

  const handleCategoryChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("category", value === "all" ? "" : value)}`)
  }

  const handleSortChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("sort", value)}`)
  }

  const clearFilters = () => {
    setSearchValue("")
    router.push(pathname)
  }

  const hasFilters = searchParams.get("search") || searchParams.get("category") || searchParams.get("sort")

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 bg-secondary border-0"
        />
      </form>

      <div className="flex items-center gap-3">
        <Select value={searchParams.get("category") || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[160px] bg-secondary border-0">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("sort") || "newest"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] bg-secondary border-0">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
