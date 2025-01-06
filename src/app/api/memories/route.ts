import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const RECORDINGS_DIR = join(process.cwd(), 'public', 'recordings')
const METADATA_FILE = join(RECORDINGS_DIR, 'metadata.json')

// Helper function to ensure directories exist
async function ensureDirectoryExists() {
  console.log('Checking directories');
  if (!existsSync(RECORDINGS_DIR)) {
    await mkdir(RECORDINGS_DIR, { recursive: true });
  }
  if (!existsSync(METADATA_FILE)) {
    await writeFile(METADATA_FILE, JSON.stringify([]));
  }
}

// GET /api/memories
export async function GET() {
  try {
    console.log('GET request received');
    await ensureDirectoryExists();
    
    const data = await readFile(METADATA_FILE, 'utf8');
    const recordings = JSON.parse(data);
    
    // Add audioUrl to each recording if it doesn't exist
    const recordingsWithUrls = recordings.map(rec => {
      if (!rec.audioUrl) {
        return {
          ...rec,
          audioUrl: `/recordings/${rec.filename}`
        };
      }
      return rec;
    });
    
    console.log('Sending recordings:', recordingsWithUrls);
    return NextResponse.json(recordingsWithUrls);
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ error: 'Failed to read memories' }, { status: 500 });
  }
}

// POST /api/memories
export async function POST(request: Request) {
  try {
    console.log('Starting POST request handling');
    
    const data = await request.json();
    console.log('Received data:', { ...data, audioData: '[truncated]' });

    const { audioData, title, description = '', location = '', recordingType } = data;

    if (!audioData) {
      console.error('No audio data in request');
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    await ensureDirectoryExists();

    // Save audio file
    const base64Data = audioData.split(';base64,').pop();
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const filename = `${Date.now()}.webm`;
    const filePath = join(RECORDINGS_DIR, filename);
    
    console.log('Saving file to:', filePath);
    await writeFile(filePath, audioBuffer);
    console.log('File saved successfully');

    // Create metadata entry
    const newRecording = {
      id: Date.now().toString(),
      title,
      description,
      location,
      recordingType,
      filename,
      audioUrl: `/recordings/${filename}`,
      locationImage: null,
      date: new Date().toISOString()
    };

    console.log('Created metadata:', newRecording);

    // Update metadata file
    const metadata = JSON.parse(await readFile(METADATA_FILE, 'utf8'));
    metadata.push(newRecording);
    await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log('Metadata updated successfully');

    return NextResponse.json(newRecording);
  } catch (error) {
    console.error('Detailed error in POST:', error);
    return NextResponse.json({ 
      error: 'Failed to save memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/memories?id=[id]
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    }
    
    const metadataStr = await readFile(METADATA_FILE, 'utf8');
    const metadata = JSON.parse(metadataStr);
    const recordingIndex = metadata.findIndex((r: any) => r.id === id);
    
    if (recordingIndex === -1) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    const recording = metadata[recordingIndex];
    const audioPath = join(RECORDINGS_DIR, recording.filename);
    
    // Delete the audio file if it exists
    if (existsSync(audioPath)) {
      await unlink(audioPath);
    }
    
    // Update metadata
    metadata.splice(recordingIndex, 1);
    await writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}