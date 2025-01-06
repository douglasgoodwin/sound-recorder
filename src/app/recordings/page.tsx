'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

const RECORDING_TYPES = {
  soundmark: 'Soundmark',
  keynote: 'Keynote Sound',
  pointer: 'Sound Pointer'
};

export default function RecordingsPage() {
  const [memories, setMemories] = useState([]);
  const [expandedLocations, setExpandedLocations] = useState(new Set());

  useEffect(() => {
    const fetchMemories = async () => {
      const response = await fetch('/api/memories')
      const data = await response.json()
      console.log('Fetched memories:', data) // Debug log
      setMemories(data)
    }
    fetchMemories()
  }, [])

  // Group memories by location
  const groupedMemories = memories.reduce((acc, memory) => {
    const location = memory.location || 'Unspecified Location';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(memory);
    return acc;
  }, {});

  const toggleLocation = (location) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(location)) {
      newExpanded.delete(location);
    } else {
      newExpanded.add(location);
    }
    setExpandedLocations(newExpanded);
  };

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Recordings by Location</h1>
      
      <div className="space-y-4">
        {Object.entries(groupedMemories).map(([location, locationMemories]) => (
          <Card key={location}>
            <CardHeader className="cursor-pointer" onClick={() => toggleLocation(location)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {locationMemories[0]?.locationImage && (
                    <img 
                      src={locationMemories[0].locationImage}
                      alt={location}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  )}
                  <CardTitle className="text-xl">
                    📍 {location}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {locationMemories.length} recording{locationMemories.length !== 1 ? 's' : ''}
                  </span>
                  {expandedLocations.has(location) ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            
            {expandedLocations.has(location) && (
              <CardContent>
                <div className="space-y-4">
                  {locationMemories.map((memory) => (
                    <div key={memory.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{memory.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-600">
                              {RECORDING_TYPES[memory.recordingType]}
                            </span>
                            {memory.recordingType === 'pointer' && memory.destination && (
                              <span className="text-sm text-gray-600">
                                ➡️ {memory.destination}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{memory.date}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{memory.description}</p>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Audio URL: {memory.audioUrl}</p>
                        <audio 
                          controls 
                          src={memory.audioUrl} 
                          className="w-full"
                          key={memory.audioUrl} // Force reload if URL changes
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </main>
  )
}