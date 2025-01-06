'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SoundwalkPage() {
  const [memories, setMemories] = useState([]);
  const [locations, setLocations] = useState(new Set());
  const [selectedLocation, setSelectedLocation] = useState('');
  const [pointersAtLocation, setPointersAtLocation] = useState([]);

  useEffect(() => {
    const fetchMemories = async () => {
      const response = await fetch('/api/memories')
      const data = await response.json()
      setMemories(data)
      
      // Collect all unique locations
      const locs = new Set()
      data.forEach(memory => {
        if (memory.location) locs.add(memory.location)
        if (memory.destination) locs.add(memory.destination)
      })
      setLocations(locs)
    }
    fetchMemories()
  }, [])

  useEffect(() => {
    // Find all pointers at the selected location
    const pointers = memories.filter(
      memory => memory.recordingType === 'pointer' && memory.location === selectedLocation
    );
    setPointersAtLocation(pointers);
  }, [selectedLocation, memories]);

  const getLocationSounds = (location) => {
    return memories.filter(
      memory => memory.location === location && memory.recordingType !== 'pointer'
    );
  };

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Soundwalk Explorer</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Choose a Location</CardTitle>
          <CardDescription>
            Select a location to explore its sounds and connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(locations).map((location) => (
                <SelectItem key={location} value={location}>
                  📍 {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedLocation && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Sounds at {selectedLocation}</h2>
            <div className="space-y-4">
              {getLocationSounds(selectedLocation).map((memory) => (
                <Card key={memory.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{memory.title}</h3>
                    <span className="text-sm text-blue-600">
                      {memory.recordingType === 'soundmark' ? 'Soundmark' : 'Keynote Sound'}
                    </span>
                    <p className="text-gray-700 my-2">{memory.description}</p>
                    <audio controls src={memory.audioUrl} className="w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Pointers from {selectedLocation}</h2>
            <div className="space-y-4">
              {pointersAtLocation.map((pointer) => (
                <Card key={pointer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{pointer.title}</span>
                      <span className="text-gray-600">➡️ {pointer.destination}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{pointer.description}</p>
                    <audio controls src={pointer.audioUrl} className="w-full" />
                  </CardContent>
                </Card>
              ))}
              {pointersAtLocation.length === 0 && (
                <p className="text-gray-500">No pointers from this location yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}