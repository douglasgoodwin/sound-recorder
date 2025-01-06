'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Mic, StopCircle } from 'lucide-react';

const RECORDING_TYPES = {
  soundmark: {
    label: 'Soundmark',
    description: 'A description or a memory of a place'
  },
  keynote: {
    label: 'Keynote Sound',
    description: 'Ambient sounds that make the acoustic atmosphere of a place (e.g., traffic hum, wind in trees, water flowing)'
  },
  pointer: {
    label: 'Sound Pointer',
    description: 'The name of a place or a sound that points to the next place in your soundwalk'
  }
};

export default function AudioMemoryMap() {
  const [memories, setMemories] = useState([]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [recordingType, setRecordingType] = useState('soundmark');
  const [existingLocations, setExistingLocations] = useState(new Set());
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    const locations = new Set();
    memories.forEach(memory => {
      if (memory.location) locations.add(memory.location);
      if (memory.destination) locations.add(memory.destination);
    });
    setExistingLocations(locations);
  }, [memories]);

  const loadRecordings = async () => {
    try {
      const response = await fetch('/api/memories');
      if (response.ok) {
        const data = await response.json();
        setMemories(data);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const startRecording = async () => {
    if (!title) {
      alert('Please enter a title before recording');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          const newMemory = {
            id: Date.now().toString(),
            title,
            description,
            location,
            destination: recordingType === 'pointer' ? destination : undefined,
            audioData: base64Audio,
            recordingType,
          };

          try {
            const response = await fetch('/api/memories', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newMemory)
            });

            if (response.ok) {
              loadRecordings();
              setTitle('');
              setDescription('');
              setLocation('');
              setDestination('');
            }
          } catch (error) {
            console.error('Error saving recording:', error);
          }
        };

        reader.readAsDataURL(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const deleteMemory = async (id) => {
    try {
      const response = await fetch(`/api/memories?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadRecordings();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Record New Memory</CardTitle>
          <CardDescription>
            Select the type of sound you want to record and provide details about the location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Recording Type</Label>
              <RadioGroup
                value={recordingType}
                onValueChange={setRecordingType}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                {Object.entries(RECORDING_TYPES).map(([value, { label, description }]) => (
                  <div key={value} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <RadioGroupItem value={value} id={value} />
                    </div>
                    <div className="ml-2 flex flex-col">
                      <Label htmlFor={value} className="font-medium">{label}</Label>
                      <span className="text-sm text-gray-500">{description}</span>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your recording a name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe what you're recording and why it's significant"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="relative">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter the location of this recording"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                />
                {showLocationSuggestions && location && (
                  <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border">
                    {Array.from(existingLocations)
                      .filter(loc => loc.toLowerCase().includes(location.toLowerCase()))
                      .map((loc, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => setLocation(loc)}
                        >
                          {loc}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {recordingType === 'pointer' && (
                <div className="relative">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Enter the destination this pointer leads to"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  />
                  {showDestinationSuggestions && destination && (
                    <div className="absolute z-10 w-full bg-white shadow-lg rounded-md mt-1 border">
                      {Array.from(existingLocations)
                        .filter(loc => loc.toLowerCase().includes(destination.toLowerCase()))
                        .map((loc, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => setDestination(loc)}
                          >
                            {loc}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={recording ? stopRecording : startRecording}
                className={`w-full ${recording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {recording ? (
                  <><StopCircle className="mr-2" /> Stop Recording</>
                ) : (
                  <><Mic className="mr-2" /> Start Recording</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      
      Current Recordings:

      <div className="space-y-4">
        {memories.map((memory) => (
          <Card key={memory.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{memory.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-600">
                      {RECORDING_TYPES[memory.recordingType]?.label || 'Recording'}
                    </span>
                    {memory.location && (
                      <span className="text-sm text-gray-600">
                        📍 {memory.location}
                      </span>
                    )}
                    {memory.recordingType === 'pointer' && memory.destination && (
                      <span className="text-sm text-gray-600">
                        ➡️ {memory.destination}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{memory.date}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMemory(memory.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="sr-only">Delete</span>
                    ×
                  </Button>
                </div>
              </div>
              <p className="text-gray-700 mb-2">{memory.description}</p>
              <audio controls src={memory.audioUrl} className="w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}