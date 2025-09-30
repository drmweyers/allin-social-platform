'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Settings, Trash2, Clock, Calendar, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface PostingQueue {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  timezone: string;
  timeSlots: TimeSlot[];
  posts: QueuePost[];
}

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  time: string;
  isActive: boolean;
}

interface QueuePost {
  id: string;
  content: string;
  position: number;
  scheduledFor: string;
  status: string;
}

interface QueueManagerProps {
  posts: any[];
  onUpdate: () => void;
}

export function QueueManager({ posts, onUpdate }: QueueManagerProps) {
  const [queues, setQueues] = useState<PostingQueue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [newQueueDescription, setNewQueueDescription] = useState('');
  const [editingTimeSlots, setEditingTimeSlots] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      const response = await fetch('/api/schedule/queues');
      if (response.ok) {
        const data = await response.json();
        setQueues(data.queues);
        if (data.queues.length > 0 && !selectedQueue) {
          setSelectedQueue(data.queues[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  };

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a queue name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/schedule/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newQueueName,
          description: newQueueDescription,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Queue created successfully',
        });
        setNewQueueName('');
        setNewQueueDescription('');
        setIsCreatingQueue(false);
        fetchQueues();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create queue',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQueue = async (queueId: string) => {
    try {
      const response = await fetch(`/api/schedule/queues/${queueId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Queue deleted successfully',
        });
        fetchQueues();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete queue',
        variant: 'destructive',
      });
    }
  };

  const handleAddTimeSlot = async (queueId: string, dayOfWeek: number, time: string) => {
    try {
      const response = await fetch(`/api/schedule/queues/${queueId}/timeslots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, time }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Time slot added successfully',
        });
        fetchQueues();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add time slot',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTimeSlot = async (queueId: string, slotId: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `/api/schedule/queues/${queueId}/timeslots/${slotId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      );

      if (response.ok) {
        fetchQueues();
      }
    } catch (error) {
      console.error('Failed to toggle time slot:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const queueId = result.source.droppableId;
    const postId = result.draggableId;
    const newPosition = result.destination.index;

    try {
      const response = await fetch(`/api/schedule/queues/${queueId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          newPosition,
        }),
      });

      if (response.ok) {
        fetchQueues();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reorder posts',
        variant: 'destructive',
      });
    }
  };

  const currentQueue = queues.find((q) => q.id === selectedQueue);

  return (
    <div className="space-y-6">
      {/* Queue Selection and Management */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedQueue || ''} onValueChange={setSelectedQueue}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a queue" />
            </SelectTrigger>
            <SelectContent>
              {queues.map((queue) => (
                <SelectItem key={queue.id} value={queue.id}>
                  {queue.name}
                  {!queue.isActive && (
                    <Badge variant="secondary" className="ml-2">
                      Inactive
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentQueue && (
            <Badge variant={currentQueue.isActive ? 'default' : 'secondary'}>
              {currentQueue.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={isCreatingQueue} onOpenChange={setIsCreatingQueue}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Queue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Queue</DialogTitle>
                <DialogDescription>
                  Set up a new posting queue with custom time slots
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="queue-name">Queue Name</Label>
                  <Input
                    id="queue-name"
                    value={newQueueName}
                    onChange={(e) => setNewQueueName(e.target.value)}
                    placeholder="e.g., Morning Posts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queue-description">Description</Label>
                  <Input
                    id="queue-description"
                    value={newQueueDescription}
                    onChange={(e) => setNewQueueDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatingQueue(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQueue}>Create Queue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {currentQueue && (
            <>
              <Button
                variant="outline"
                onClick={() => setEditingTimeSlots(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Time Slots
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeleteQueue(currentQueue.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Queue Content */}
      {currentQueue ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Queue Posts */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Queue Posts</CardTitle>
                <CardDescription>
                  {currentQueue.posts.length} posts in queue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={currentQueue.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {currentQueue.posts.length > 0 ? (
                          currentQueue.posts.map((post, index) => (
                            <Draggable
                              key={post.id}
                              draggableId={post.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-3 bg-white border rounded-lg ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move"
                                    >
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {post.content.substring(0, 100)}...
                                      </p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          Position {post.position + 1}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          Scheduled for {new Date(post.scheduledFor).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No posts in queue. Add posts to start scheduling.
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          {/* Time Slots */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Time Slots</CardTitle>
                <CardDescription>
                  Active time slots for this queue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentQueue.timeSlots.length > 0 ? (
                  currentQueue.timeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {daysOfWeek[slot.dayOfWeek]} at {slot.time}
                        </span>
                      </div>
                      <Switch
                        checked={slot.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleTimeSlot(currentQueue.id, slot.id, checked)
                        }
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No time slots configured</p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingTimeSlots(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Slot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No queues available. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}