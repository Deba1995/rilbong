// lib/storage.ts
import { supabase } from './supabase'

export async function uploadEventFile(file: File, folder = 'registrations'): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('event-uploads')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }

  // Get public accessible URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-uploads')
    .getPublicUrl(data.path)

  return publicUrl
}