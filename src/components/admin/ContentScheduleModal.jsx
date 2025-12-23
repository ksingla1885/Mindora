import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function ContentScheduleModal({ 
  content, 
  isOpen, 
  onClose, 
  onSchedule, 
  onPublishNow,
  onUnpublish
}) {
  const [date, setDate] = useState(() => {
    // If content is scheduled, use that date, otherwise default to now + 1 hour
    if (content?.scheduledFor) {
      return new Date(content.scheduledFor);
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);
    return now;
  });

  const [time, setTime] = useState(() => {
    if (content?.scheduledFor) {
      const d = new Date(content.scheduledFor);
      return d.toTimeString().slice(0, 5); // Returns 'HH:MM'
    }
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toTimeString().slice(0, 5);
  });

  const [isScheduling, setIsScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      if (content?.scheduledFor) {
        const d = new Date(content.scheduledFor);
        setDate(d);
        setTime(d.toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        setDate(now);
        setTime(now.toTimeString().slice(0, 5));
      }
    }
  }, [isOpen, content]);

  const handleTimeChange = (e) => {
    setTime(e.target.value);
    
    // Update the date with the new time
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    setDate(newDate);
  };

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return;
    
    // Keep the time but update the date
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);
    
    setDate(newDate);
  };

  const handleSchedule = async () => {
    if (!date) return;
    
    setIsScheduling(true);
    try {
      await onSchedule(date);
      onClose();
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      await onPublishNow();
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Are you sure you want to unpublish this content?')) return;
    
    setIsUnpublishing(true);
    try {
      await onUnpublish();
      onClose();
    } finally {
      setIsUnpublishing(false);
    }
  };

  const isScheduled = content?.status === 'scheduled';
  const isPublished = content?.status === 'published';
  const canUnpublish = isScheduled || isPublished;
  
  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {isScheduled ? 'Update Schedule' : 'Schedule Content'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Publish Date & Time
              </label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <input
                  type="time"
                  value={time}
                  onChange={handleTimeChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {date ? `Will publish on ${format(date, "PPP 'at' h:mm a")}` : 'Select a date and time'}
              </p>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isScheduling || isPublishing || isUnpublishing}
                >
                  Cancel
                </Button>
                {canUnpublish && (
                  <Button 
                    variant="outline" 
                    onClick={handleUnpublish}
                    disabled={isScheduling || isPublishing || isUnpublishing}
                  >
                    {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
                  </Button>
                )}
              </div>
              
              <div className="space-x-2">
                <Button 
                  onClick={handlePublishNow}
                  disabled={isScheduling || isPublishing || isUnpublishing}
                >
                  {isPublishing ? 'Publishing...' : 'Publish Now'}
                </Button>
                <Button 
                  onClick={handleSchedule}
                  disabled={isScheduling || isPublishing || isUnpublishing}
                >
                  {isScheduling ? 'Scheduling...' : isScheduled ? 'Update Schedule' : 'Schedule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
