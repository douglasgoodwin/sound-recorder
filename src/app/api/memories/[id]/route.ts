import { NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

const RECORDINGS_DIR = join(process.cwd(), 'public', 'recordings')
const METADATA_FILE = join(RECORDINGS_DIR, 'metadata.json')

// Simplified route handler
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { title, description, location, destination, recordingType } = data;

    // Read current metadata
    const metadataStr = await readFile(METADATA_FILE, 'utf8');
    const metadata = JSON.parse(metadataStr);
    
    // Find and update the memory
    const memoryIndex = metadata.findIndex((m: any) => m.id === params.id);
    if (memoryIndex === -1) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Update the memory while preserving the filename and audioUrl
    metadata[memoryIndex] = {
      ...metadata[memoryIndex],
      title,
      description,
      location,
      destination,
      recordingType,
      // Preserve other fields
      id: params.id,
      audioUrl: metadata[memoryIndex].audioUrl,
      filename: metadata[memoryIndex].filename,
      date: metadata[memoryIndex].date
    };

    // Save updated metadata
    await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));

    return NextResponse.json(metadata[memoryIndex]);
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}