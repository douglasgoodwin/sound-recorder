'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, Save, Trash2 } from 'lucide-react'

const RECORDING_TYPES = {
  soundmark: {
    label: 'Soundmark',
    description: 'A unique or characteristic sound that defines a location'
  },
  keynote: {
    label: 'Keynote Sound',
    description: 'Background sounds that create the acoustic atmosphere'
  },
  pointer: {
    label: 'Sound Pointer',
    description: 'A sound that indicates the next place in your soundwalk'
  }
};

function AdminPage() {
  const [memories, setMemories] = useState([]);
  const [editingMemory, setEditingMemory] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [existingLocations, setExistingLocations] = useState(new Set());
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    // Collect all unique locations whenever memories change
    const locations = new Set();
    memories.forEach(memory => {
      if (memory.location) locations.add(memory.location);
      if (memory.destination) locations.add(memory.destination);
    });
    setExistingLocations(locations);
  }, [memories]);

  const fetchMemories = async () => {
    const response = await fetch('/api/memories');
    const data = await response.json();
    setMemories(data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('description', '');
      formData.append('location', '');
      formData.append('recordingType', 'soundmark');

      const response = await fetch('/api/memories', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('Upload response:', result);

      if (response.ok) {
        console.log('Upload successful');
        fetchMemories();
      } else {
        console.error('Upload failed:', result);
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  const startEditing = (memory) => {
    console.log('Starting edit for:', memory);
    setEditingMemory({
      ...memory,
      description: memory.description || '',
      location: memory.location || '',
      destination: memory.destination || ''
    });
    setEditDialogOpen(true);
  };

  const updateMemory = async () => {
    try {
      const response = await fetch(`/api/memories/${editingMemory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingMemory.title,
          description: editingMemory.description,
          location: editingMemory.location,
          destination: editingMemory.destination,
          recordingType: editingMemory.recordingType
        })
      });

      if (response.ok) {
        fetchMemories();
        setEditDialogOpen(false);
        setEditingMemory(null);
      } else {
        const error = await response.json();
        console.error('Update failed:', error);
        alert('Failed to update recording');
      }
    } catch (error) {
      console.error('Error updating memory:', error);
      alert('Error updating recording');
    }
  };

  const deleteMemory = async (id) => {
    try {
      const response = await fetch(`/api/memories?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchMemories();
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload New Sound File</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="mb-4"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {memories.map((memory) => (
          <Card key={memory.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{memory.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-600">
                      {RECORDING_TYPES[memory.recordingType]?.label}
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => startEditing(memory)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => deleteMemory(memory.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-700 mb-2">{memory.description}</p>
              <audio controls src={memory.audioUrl} className="w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recording</DialogTitle>
          </DialogHeader>
          {editingMemory && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingMemory.title}
                  onChange={(e) => setEditingMemory({
                    ...editingMemory,
                    title: e.target.value
                  })}
                />
              </div>

              <div>
                <Label>Recording Type</Label>
                <RadioGroup
                  value={editingMemory.recordingType}
                  onValueChange={(value) => setEditingMemory({
                    ...editingMemory,
                    recordingType: value
                  })}
                >
                  {Object.entries(RECORDING_TYPES).map(([value, { label }]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={`edit-${value}`} />
                      <Label htmlFor={`edit-${value}`}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="relative">
                <Label>Location</Label>
                <Input
                  value={editingMemory.location}
                  onChange={(e) => setEditingMemory({
                    ...editingMemory,
                    location: e.target.value
                  })}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                />
                {showLocationSuggestions && editingMemory.location && (
                  <div className="absolute z-50 w-full bg-white shadow-lg rounded-md mt-1 border">
                    {Array.from(existingLocations)
                      .filter(loc => loc.toLowerCase().includes(editingMemory.location.toLowerCase()))
                      .map((loc, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => setEditingMemory({
                            ...editingMemory,
                            location: loc
                          })}
                        >
                          {loc}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {editingMemory.recordingType === 'pointer' && (
                <div className="relative">
                  <Label>Destination</Label>
                  <Input
                    value={editingMemory.destination || ''}
                    onChange={(e) => setEditingMemory({
                      ...editingMemory,
                      destination: e.target.value
                    })}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  />
                  {showDestinationSuggestions && editingMemory.destination && (
                    <div className="absolute z-50 w-full bg-white shadow-lg rounded-md mt-1 border">
                      {Array.from(existingLocations)
                        .filter(loc => loc.toLowerCase().includes(editingMemory.destination.toLowerCase()))
                        .map((loc, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            onClick={() => setEditingMemory({
                              ...editingMemory,
                              destination: loc
                            })}
                          >
                            {loc}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Description</Label>
                <Input
                  value={editingMemory.description}
                  onChange={(e) => setEditingMemory({
                    ...editingMemory,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateMemory}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default AdminPage;