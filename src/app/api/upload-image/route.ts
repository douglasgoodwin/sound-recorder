import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const IMAGES_DIR = join(process.cwd(), 'public', 'location-images')

// Ensure images directory exists
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const location = formData.get('location') as string

    if (!image) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Create safe filename from location
    const safeLocation = location
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
    const extension = image.name.split('.').pop()
    const filename = `${safeLocation}.${extension}`
    const filepath = join(IMAGES_DIR, filename)

    // Convert file to buffer and save
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the URL for the saved image
    const imageUrl = `/location-images/${filename}`
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error handling image upload:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}