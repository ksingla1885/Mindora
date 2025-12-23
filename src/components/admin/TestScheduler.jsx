'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, addHours, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, X, Clock, Calendar as CalendarIcon2 } from 'lucide-react';

const testSchedulerSchema = z.object({
  testId: z.string().min(1, 'Test is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  timezone: z.string().default('UTC'),
  maxAttempts: z.number().min(1, 'At least 1 attempt is required').default(1),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    interval: z.number().min(1).default(1),
    endDate: z.date().optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
  instructions: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export function TestScheduler({ test, onSuccess, onCancel, existingSchedule }) {
  const router = useRouter();
  const [availableTests, setAvailableTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(testSchedulerSchema),
    defaultValues: {
      testId: existingSchedule?.testId || '',
      startDate: existingSchedule?.startDate ? new Date(existingSchedule.startDate) : addDays(new Date(), 1),
      startTime: existingSchedule?.startTime || '09:00',
      duration: existingSchedule?.duration || 60, // in minutes
      timezone: existingSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      maxAttempts: existingSchedule?.maxAttempts || 1,
      isRecurring: existingSchedule?.isRecurring || false,
      recurrence: {
        frequency: existingSchedule?.recurrence?.frequency || 'WEEKLY',
        interval: existingSchedule?.recurrence?.interval || 1,
        endDate: existingSchedule?.recurrence?.endDate ? new Date(existingSchedule.recurrence.endDate) : addDays(new Date(), 30),
        daysOfWeek: existingSchedule?.recurrence?.daysOfWeek || [1, 3, 5], // Default to Mon, Wed, Fri
      },
      instructions: existingSchedule?.instructions || '',
      isPublished: existingSchedule?.isPublished || false,
    },
  });

  const isRecurring = form.watch('isRecurring');
  const frequency = form.watch('recurrence.frequency');

  // Fetch available tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/tests');
        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }
        const data = await response.json();
        setAvailableTests(Array.isArray(data) ? data : []);
        
        // If this is a new schedule and no test is selected, select the first one
        if (!existingSchedule && data.length > 0) {
          form.setValue('testId', data[0].id);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available tests',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [existingSchedule, form]);

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Format dates for API
      const formattedData = {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        ...(data.isRecurring && data.recurrence?.endDate && {
          recurrence: {
            ...data.recurrence,
            endDate: format(data.recurrence.endDate, 'yyyy-MM-dd'),
          },
        }),
      };

      const url = existingSchedule 
        ? `/api/admin/tests/${existingSchedule.id}/schedule`
        : '/api/admin/tests/schedule';
      const method = existingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save test schedule');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: existingSchedule 
          ? 'Test schedule updated successfully!' 
          : 'Test schedule created successfully!',
      });

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push('/admin/tests');
      }
    } catch (error) {
      console.error('Error saving test schedule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time slots for the time picker
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {existingSchedule ? 'Edit Test Schedule' : 'Schedule New Test'}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {existingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Selection */}
            <FormField
              control={form.control}
              name="testId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Test</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!existingSchedule}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Loading tests...
                        </div>
                      ) : availableTests.length > 0 ? (
                        availableTests.map((test) => (
                          <SelectItem key={test.id} value={test.id}>
                            {test.title}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No tests available. Create a test first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon2 className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select start time" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Duration */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {Intl.supportedValuesOf('timeZone').map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Max Attempts */}
            <FormField
              control={form.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Attempts</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Recurring Schedule */}
            <div className="md:col-span-2 space-y-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a recurring test</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Schedule this test to repeat at regular intervals
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              {isRecurring && (
                <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-6">
                  <FormField
                    control={form.control}
                    name="recurrence.frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence</FormLabel>
                        <div className="flex space-x-2">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DAILY">Daily</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <FormField
                            control={form.control}
                            name="recurrence.interval"
                            render={({ field: intervalField }) => (
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <span>every</span>
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    className="w-16" 
                                    {...intervalField}
                                    onChange={(e) => intervalField.onChange(parseInt(e.target.value, 10) || 1)}
                                  />
                                  <span>
                                    {frequency === 'DAILY' ? 'day(s)' : 
                                     frequency === 'WEEKLY' ? 'week(s)' : 'month(s)'}
                                  </span>
                                </div>
                              </FormControl>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {frequency === 'WEEKLY' && (
                    <FormField
                      control={form.control}
                      name="recurrence.daysOfWeek"
                      render={({ field }) => {
                        const days = [
                          { value: 0, label: 'Sun' },
                          { value: 1, label: 'Mon' },
                          { value: 2, label: 'Tue' },
                          { value: 3, label: 'Wed' },
                          { value: 4, label: 'Thu' },
                          { value: 5, label: 'Fri' },
                          { value: 6, label: 'Sat' },
                        ];
                        
                        const toggleDay = (day) => {
                          const currentDays = field.value || [];
                          const newDays = currentDays.includes(day)
                            ? currentDays.filter(d => d !== day)
                            : [...currentDays, day];
                          field.onChange(newDays);
                        };
                        
                        return (
                          <FormItem>
                            <FormLabel>Days of the Week</FormLabel>
                            <div className="flex space-x-2">
                              {days.map((day) => (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() => toggleDay(day.value)}
                                  className={`px-3 py-1 rounded-md text-sm ${
                                    field.value?.includes(day.value)
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="recurrence.endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick an end date</span>
                                )}
                                <CalendarIcon2 className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < form.getValues('startDate')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any special instructions for test takers..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Publish Toggle */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Schedule</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value 
                          ? 'This test schedule is visible to users.'
                          : 'This test schedule is hidden from users.'}
                      </p>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {field.value ? 'Published' : 'Draft'}
                        </span>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            field.value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              field.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
