// app/actions/products.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData, vendorId: string) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category_id = formData.get('category_id') as string
  const inventory_count = parseInt(formData.get('inventory_count') as string) || 0

  // Generate unique slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  let baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1

  // Check for existing slug
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    // Try up to 100 variations
    while (counter <= 100) {
      slug = `${baseSlug}-${counter}`
      const { data: check } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('slug', slug)
        .maybeSingle()

      if (!check) break
      counter++
    }
  }

  // Insert product
  const { error } = await supabase
    .from('products')
    .insert({
      name,
      description,
      price,
      category_id,
      vendor_id: vendorId,
      slug,
      inventory_count,
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with this name already exists. Please use a different name.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/products')
  redirect('/dashboard/products')
}