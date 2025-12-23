'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiCalendar, 
  FiAward, 
  FiUsers, 
  FiClock,
  FiChevronLeft, 
  FiChevronRight,
  FiGift,
  FiCheckCircle,
  FiAlertTriangle,
  FiExternalLink,
  FiPlus,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import { format, addDays, isAfter, isBefore, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Mock data for event categories
const EVENT_CATEGORIES = [
  { id: 'all', name: 'All Events' },
  { id: 'active', name: 'Active', icon: <FiZap className="mr-2 h-4 w-4 text-yellow-500" /> },
  { id: 'upcoming', name: 'Upcoming', icon: <FiClock className="mr-2 h-4 w-4 text-blue-500" /> },
  { id: 'completed', name: 'Completed', icon: <FiCheckCircle className="mr-2 h-4 w-4 text-green-500" /> },
  { id: 'featured', name: 'Featured', icon: <FiAward className="mr-2 h-4 w-4 text-purple-500" /> },
  { id: 'community', name: 'Community', icon: <FiUsers className="mr-2 h-4 w-4 text-green-500" /> },
];

// Mock data for event types
const EVENT_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'challenge', name: 'Challenges', color: 'bg-blue-100 text-blue-800' },
  { id: 'tournament', name: 'Tournaments', color: 'bg-purple-100 text-purple-800' },
  { id: 'season', name: 'Seasons', color: 'bg-green-100 text-green-800' },
  { id: 'special', name: 'Special Events', color: 'bg-yellow-100 text-yellow-800' },
];

// Helper function to get event status
const getEventStatus = (event) => {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const registrationEnd = new Date(event.registrationEnd || event.startDate);
  
  if (now < startDate) {
    return {
      status: 'upcoming',
      label: 'Starts ' + formatDistanceToNow(startDate, { addSuffix: true }),
      color: 'bg-blue-100 text-blue-800',
      progress: 0,
    };
  }
  
  if (now > endDate) {
    return {
      status: 'completed',
      label: 'Event ended',
      color: 'bg-gray-100 text-gray-800',
      progress: 100,
    };
  }
  
  if (now > registrationEnd && now < startDate) {
    return {
      status: 'registration_closed',
      label: 'Registration closed',
      color: 'bg-gray-100 text-gray-800',
      progress: 0,
    };
  }
  
  // Event is active
  const totalDuration = endDate - startDate;
  const elapsed = now - startDate;
  const progress = Math.min((elapsed / totalDuration) * 100, 100);
  
  return {
    status: 'active',
    label: `Ends in ${differenceInDays(endDate, now)} days`,
    color: 'bg-green-100 text-green-800',
    progress,
  };
};

// Mock event data
const MOCK_EVENTS = [
  {
    id: 'summer-challenge-2023',
    title: 'Summer Learning Challenge 2023',
    description: 'Join our biggest learning event of the year! Complete challenges, earn badges, and compete with learners worldwide.',
    type: 'challenge',
    category: 'featured',
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-08-31T23:59:59Z',
    registrationEnd: '2023-07-15T23:59:59Z',
    image: '/images/events/summer-challenge.jpg',
    participants: 12543,
    maxParticipants: 20000,
    difficulty: 'medium',
    rewards: [
      { type: 'xp', amount: 5000, description: 'Bonus XP' },
      { type: 'badge', id: 'summer-champion-2023', name: 'Summer Champion 2023' },
      { type: 'premium', days: 30, description: '1 Month Premium' },
    ],
    leaderboard: true,
    tags: ['featured', 'seasonal', 'premium'],
  },
  {
    id: 'math-olympiad-july',
    title: 'July Math Olympiad',
    description: 'Test your math skills in this competitive event with participants from around the world.',
    type: 'tournament',
    category: 'active',
    startDate: '2023-07-15T00:00:00Z',
    endDate: '2023-07-22T23:59:59Z',
    registrationEnd: '2023-07-14T23:59:59Z',
    image: '/images/events/math-olympiad.jpg',
    participants: 3245,
    maxParticipants: 5000,
    difficulty: 'hard',
    rewards: [
      { type: 'xp', amount: 2000, description: 'Bonus XP' },
      { type: 'badge', id: 'math-olympiad-contestant', name: 'Math Olympiad Contestant' },
    ],
    leaderboard: true,
    tags: ['competitive', 'math', 'time-limited'],
  },
  {
    id: 'back-to-school-2023',
    title: 'Back to School 2023',
    description: 'Prepare for the new school year with our special learning tracks and challenges.',
    type: 'season',
    category: 'upcoming',
    startDate: '2023-08-15T00:00:00Z',
    endDate: '2023-09-15T23:59:59Z',
    registrationEnd: '2023-09-01T23:59:59Z',
    image: '/images/events/back-to-school.jpg',
    participants: 0,
    maxParticipants: null,
    difficulty: 'easy',
    rewards: [
      { type: 'xp', amount: 1500, description: 'Bonus XP' },
      { type: 'badge', id: 'back-to-school-2023', name: 'Back to School 2023' },
    ],
    leaderboard: true,
    tags: ['seasonal', 'education'],
  },
  {
    id: 'community-week-july',
    title: 'Community Week',
    description: 'A week-long celebration of our amazing learning community. Participate in discussions, help others, and earn rewards!',
    type: 'special',
    category: 'community',
    startDate: '2023-07-24T00:00:00Z',
    endDate: '2023-07-30T23:59:59Z',
    registrationEnd: '2023-07-30T23:59:59Z',
    image: '/images/events/community-week.jpg',
    participants: 0,
    maxParticipants: null,
    difficulty: 'easy',
    rewards: [
      { type: 'xp', amount: 1000, description: 'Bonus XP' },
      { type: 'badge', id: 'community-champion', name: 'Community Champion' },
    ],
    leaderboard: false,
    tags: ['community', 'social'],
  },
  {
    id: 'spring-challenge-2023',
    title: 'Spring Learning Challenge',
    description: 'Our spring learning challenge has ended. Stay tuned for the next one!',
    type: 'challenge',
    category: 'completed',
    startDate: '2023-03-01T00:00:00Z',
    endDate: '2023-05-31T23:59:59Z',
    registrationEnd: '2023-04-15T23:59:59Z',
    image: '/images/events/spring-challenge.jpg',
    participants: 9876,
    maxParticipants: 15000,
    difficulty: 'medium',
    rewards: [
      { type: 'xp', amount: 3000, description: 'Bonus XP' },
      { type: 'badge', id: 'spring-champion-2023', name: 'Spring Champion 2023' },
    ],
    leaderboard: true,
    tags: ['completed', 'seasonal'],
  },
];

const SeasonalEvents = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('active');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch events data
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['seasonalEvents', { 
      category: selectedCategory,
      type: selectedType,
      search: searchQuery,
    }],
    queryFn: async () => {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Filter events based on selected filters
      let filteredEvents = [...MOCK_EVENTS];
      
      // Filter by category
      if (selectedCategory !== 'all') {
        filteredEvents = filteredEvents.filter(event => 
          selectedCategory === 'active' 
            ? getEventStatus(event).status === 'active'
            : selectedCategory === 'upcoming'
              ? getEventStatus(event).status === 'upcoming'
              : selectedCategory === 'completed'
                ? getEventStatus(event).status === 'completed'
                : event.category === selectedCategory || 
                  (selectedCategory === 'featured' && event.tags?.includes('featured'))
        );
      }
      
      // Filter by type
      if (selectedType !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.type === selectedType);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(query) || 
          event.description.toLowerCase().includes(query) ||
          event.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Add status to each event
      return filteredEvents.map(event => ({
        ...event,
        status: getEventStatus(event),
      }));
    },
    // In a real app, you might want to refetch events periodically
    refetchOnWindowFocus: false,
  });

  // Handle event registration
  const { mutate: registerForEvent, isPending: isRegistering } = useMutation({
    mutationFn: async (eventId) => {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, eventId };
    },
    onSuccess: (data) => {
      // In a real app, you would update the event's participants count
      // and the user's registered events list
      queryClient.invalidateQueries({ queryKey: ['seasonalEvents'] });
      
      // Show success message
      // You can use a toast notification here
      console.log(`Successfully registered for event: ${data.eventId}`);
    },
    onError: (error) => {
      console.error('Error registering for event:', error);
      // Show error message
    },
  });

  // Handle event view
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Get event difficulty badge
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Beginner</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Intermediate</Badge>;
      case 'hard':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Advanced</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  // Format date range
  const formatEventDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    } else if (format(start, 'yyyy') === format(end, 'yyyy')) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };

  // Get event type badge
  const getEventTypeBadge = (type) => {
    const typeInfo = EVENT_TYPES.find(t => t.id === type);
    if (!typeInfo) return null;
    
    return (
      <Badge variant="outline" className={cn("capitalize", typeInfo.color?.replace('text-', 'text-') || '')}>
        {typeInfo.name}
      </Badge>
    );
  };

  // Get event card class based on status
  const getEventCardClass = (status) => {
    switch (status) {
      case 'active':
        return 'border-green-200 dark:border-green-900/50 hover:border-green-300 dark:hover:border-green-800';
      case 'upcoming':
        return 'border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800';
      case 'completed':
        return 'opacity-70 hover:opacity-100 border-gray-200 dark:border-gray-800';
      case 'registration_closed':
        return 'opacity-70 border-gray-200 dark:border-gray-800';
      default:
        return 'border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Seasonal Events</h2>
          <p className="text-muted-foreground">
            Participate in limited-time events and earn exclusive rewards
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['seasonalEvents'] })}
            disabled={isLoading}
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  {category.icon || <FiCalendar className="mr-2 h-4 w-4" />}
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${type.color || 'bg-gray-200'}`}></span>
                  {type.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : eventsData?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsData.map((event) => (
            <Card 
              key={event.id} 
              className={cn(
                'h-full flex flex-col transition-all hover:shadow-md overflow-hidden',
                getEventCardClass(event.status.status)
              )}
            >
              {/* Event Image */}
              <div className="relative h-40 bg-muted overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${event.image})`,
                    filter: event.status.status === 'completed' ? 'grayscale(50%)' : 'none',
                    opacity: event.status.status === 'completed' ? 0.7 : 1
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={cn(
                      'capitalize',
                      event.status.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                      event.status.status === 'upcoming' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                      event.status.status === 'completed' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    )}
                  >
                    {event.status.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                {/* Event Type */}
                <div className="absolute top-3 left-3">
                  {getEventTypeBadge(event.type)}
                </div>
                
                {/* Progress Bar for Active Events */}
                {event.status.status === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${event.status.progress}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 p-5">
                {/* Event Title and Difficulty */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold line-clamp-2">{event.title}</h3>
                  {getDifficultyBadge(event.difficulty)}
                </div>
                
                {/* Event Date */}
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <FiCalendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span>{formatEventDateRange(event.startDate, event.endDate)}</span>
                </div>
                
                {/* Event Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>
                
                {/* Participants */}
                <div className="mt-auto pt-3 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Participants</span>
                    <span className="font-medium">
                      {event.participants.toLocaleString()}
                      {event.maxParticipants && ` / ${event.maxParticipants.toLocaleString()}`}
                    </span>
                  </div>
                  {event.maxParticipants && (
                    <Progress 
                      value={(event.participants / event.maxParticipants) * 100} 
                      className="h-2 mb-3" 
                    />
                  )}
                  
                  {/* Status Message */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.status.label}</span>
                    {event.status.status === 'active' && event.leaderboard && (
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-xs"
                        onClick={() => handleViewEvent(event)}
                      >
                        View Leaderboard
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-5 pb-5">
                <Button 
                  className="w-full"
                  disabled={['completed', 'registration_closed'].includes(event.status.status) || isRegistering}
                  onClick={() => {
                    if (event.status.status === 'upcoming') {
                      handleViewEvent(event);
                    } else {
                      registerForEvent(event.id);
                    }
                  }}
                >
                  {event.status.status === 'upcoming' ? 'View Details' : 
                   event.status.status === 'completed' ? 'Event Ended' :
                   event.status.status === 'registration_closed' ? 'Registration Closed' :
                   isRegistering ? 'Registering...' : 'Join Event'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FiCalendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery 
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'There are no events matching your current filters.'}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedType('all');
            }}
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Event Header */}
            <div 
              className="relative h-48 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${selectedEvent.image})`,
                filter: selectedEvent.status.status === 'completed' ? 'grayscale(50%)' : 'none',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
              
              <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {getEventTypeBadge(selectedEvent.type)}
                      {getDifficultyBadge(selectedEvent.difficulty)}
                      {selectedEvent.tags?.includes('featured') && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
                    <p className="text-white/90 mt-1">{selectedEvent.description}</p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/10"
                    onClick={() => setShowEventModal(false)}
                  >
                    <FiX className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-white/80 text-sm">
                      <FiCalendar className="h-4 w-4 mr-1.5" />
                      {formatEventDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                    </div>
                    
                    <div className="flex items-center text-white/80 text-sm">
                      <FiUsers className="h-4 w-4 mr-1.5" />
                      {selectedEvent.participants.toLocaleString()} participants
                      {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants.toLocaleString()}`}
                    </div>
                  </div>
                  
                  <Badge 
                    className={cn(
                      'capitalize',
                      selectedEvent.status.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                      selectedEvent.status.status === 'upcoming' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                      selectedEvent.status.status === 'completed' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    )}
                  >
                    {selectedEvent.status.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Event Content */}
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                  <TabsTrigger value="leaderboard" disabled={!selectedEvent.leaderboard}>
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="rules">Rules</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="mt-4">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">About This Event</h3>
                    <p className="text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="font-medium mb-3">Event Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Starts</span>
                            <span>{format(new Date(selectedEvent.startDate), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ends</span>
                            <span>{format(new Date(selectedEvent.endDate), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          {selectedEvent.registrationEnd && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Registration Closes</span>
                              <span>{format(new Date(selectedEvent.registrationEnd), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Participants</span>
                            <span>
                              {selectedEvent.participants.toLocaleString()}
                              {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className="capitalize">{selectedEvent.status.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Quick Stats</h4>
                        <div className="space-y-3">
                          {selectedEvent.status.status === 'active' && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span>{Math.round(selectedEvent.status.progress)}% Complete</span>
                              </div>
                              <Progress value={selectedEvent.status.progress} className="h-2" />
                              <div className="text-xs text-muted-foreground mt-1">
                                {selectedEvent.status.label}
                              </div>
                            </div>
                          )}
                          
                          {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Tags</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedEvent.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="capitalize">
                                    {tag.replace('-', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'rewards' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Event Rewards</h3>
                    
                    {selectedEvent.rewards && selectedEvent.rewards.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedEvent.rewards.map((reward, i) => (
                            <div 
                              key={i} 
                              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  reward.type === 'xp' ? 'bg-yellow-100 text-yellow-600' :
                                  reward.type === 'badge' ? 'bg-blue-100 text-blue-600' :
                                  'bg-purple-100 text-purple-600'
                                }`}>
                                  {reward.type === 'xp' ? (
                                    <FiZap className="h-5 w-5" />
                                  ) : reward.type === 'badge' ? (
                                    <FiAward className="h-5 w-5" />
                                  ) : (
                                    <FiStar className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {reward.type === 'xp' ? `${reward.amount} XP` :
                                     reward.type === 'badge' ? reward.name :
                                     reward.type === 'premium' ? `${reward.days} Days Premium` :
                                     'Reward'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {reward.description || 
                                     (reward.type === 'xp' ? 'Bonus experience points' :
                                      reward.type === 'badge' ? 'Exclusive badge for your profile' :
                                      reward.type === 'premium' ? 'Premium membership benefits' :
                                      'Event reward')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex">
                            <FiInfo className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-blue-800 dark:text-blue-200">How to earn rewards</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {selectedEvent.status.status === 'upcoming' 
                                  ? 'Rewards will be available once the event starts. Make sure to register before the registration deadline!'
                                  : selectedEvent.status.status === 'completed'
                                    ? 'This event has ended. Rewards have been distributed to eligible participants.'
                                    : 'Complete the event challenges and activities to earn these rewards. Some rewards may require specific achievements.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FiGift className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        <p>No rewards have been announced for this event yet.</p>
                        <p className="text-sm mt-1">Check back later for updates!</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'leaderboard' && selectedEvent.leaderboard && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Event Leaderboard</h3>
                    
                    {selectedEvent.status.status === 'upcoming' ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FiClock className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        <p>The leaderboard will be available once the event starts.</p>
                      </div>
                    ) : selectedEvent.status.status === 'completed' ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FiAward className="mx-auto h-10 w-10 mb-3 opacity-30" />
                        <p>This event has ended. Here are the final standings:</p>
                        
                        {/* Mock leaderboard */}
                        <div className="mt-6 max-w-2xl mx-auto">
                          <div className="bg-muted/30 rounded-lg overflow-hidden border">
                            <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-medium text-sm">
                              <div className="col-span-1">#</div>
                              <div className="col-span-6">Participant</div>
                              <div className="col-span-3 text-right">Score</div>
                              <div className="col-span-2 text-right">Rewards</div>
                            </div>
                            
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="grid grid-cols-12 gap-4 p-3 border-t items-center">
                                <div className="col-span-1 font-medium">
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                </div>
                                <div className="col-span-6 flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 1}`} />
                                    <AvatarFallback>U{i + 1}</AvatarFallback>
                                  </Avatar>
                                  <span>User {i + 1}</span>
                                </div>
                                <div className="col-span-3 text-right font-mono">
                                  {Math.floor(Math.random() * 1000) + 900}
                                </div>
                                <div className="col-span-2 text-right">
                                  {i < 3 ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      {i === 0 ? 'Gold' : i === 1 ? 'Silver' : 'Bronze'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Participant</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            <div className="p-3 bg-muted/20 text-center text-sm">
                              <Button variant="link" className="h-auto p-0">
                                View Full Leaderboard
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {selectedEvent.participants.toLocaleString()} participants
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select defaultValue="overall">
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="overall">Overall</SelectItem>
                                <SelectItem value="friends">Friends</SelectItem>
                                <SelectItem value="region">Your Region</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm">
                              <FiRefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg overflow-hidden border">
                          <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 font-medium text-sm">
                            <div className="col-span-1">#</div>
                            <div className="col-span-7">Participant</div>
                            <div className="col-span-2 text-right">Score</div>
                            <div className="col-span-2 text-right">You</div>
                          </div>
                          
                          {/* Top 3 with special styling */}
                          {[1, 2, 3].map((pos) => (
                            <div 
                              key={pos} 
                              className={cn(
                                'grid grid-cols-12 gap-4 p-3 border-t items-center',
                                pos === 1 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                                pos === 2 ? 'bg-gray-100 dark:bg-gray-800/50' :
                                pos === 3 ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                              )}
                            >
                              <div className="col-span-1 font-medium">
                                {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                              </div>
                              <div className="col-span-7 flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://i.pravatar.cc/150?img=${pos + 10}`} />
                                  <AvatarFallback>U{pos}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">Top Performer {pos}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.floor(Math.random() * 100) + 50} activities
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-2 text-right font-mono font-medium">
                                {Math.floor(Math.random() * 1000) + 900}
                              </div>
                              <div className="col-span-2 text-right">
                                {pos === 1 && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Leading
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* User's position */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800/50">
                            <div className="grid grid-cols-12 gap-4 p-3 items-center font-medium">
                              <div className="col-span-1 text-muted-foreground">
                                {Math.floor(Math.random() * 50) + 4}
                              </div>
                              <div className="col-span-7 flex items-center space-x-3">
                                <Avatar className="h-8 w-8 border-2 border-blue-500">
                                  <AvatarImage src={session?.user?.image} />
                                  <AvatarFallback>You</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-blue-600 dark:text-blue-400">
                                    You
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.floor(Math.random() * 30) + 5} activities
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-2 text-right font-mono text-blue-600 dark:text-blue-400">
                                {Math.floor(Math.random() * 500) + 200}
                              </div>
                              <div className="col-span-2 text-right">
                                <Button variant="outline" size="sm" className="h-7">
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-muted/20 text-center text-sm">
                            <Button variant="link" className="h-auto p-0">
                              Load More
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          Leaderboard updates every 5 minutes. Your position is based on your total score.
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'rules' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Event Rules</h3>
                    
                    <div className="prose dark:prose-invert max-w-none">
                      <h4>Participation</h4>
                      <ul>
                        <li>This event is open to all registered users.</li>
                        <li>You must be logged in to participate and earn rewards.</li>
                        <li>Only activities completed during the event period will count towards your score.</li>
                      </ul>
                      
                      <h4 className="mt-6">Scoring</h4>
                      <ul>
                        <li>Complete lessons: <strong>10 points</strong> per lesson</li>
                        <li>Pass quizzes: <strong>20 points</strong> per quiz (score 80% or higher)</li>
                        <li>Daily login: <strong>5 points</strong> (once per day)</li>
                        <li>Perfect quiz score: <strong>+10 bonus points</strong></li>
                        <li>Complete all daily goals: <strong>+20 bonus points</strong></li>
                      </ul>
                      
                      <h4 className="mt-6">Rewards</h4>
                      <ul>
                        <li>All participants who complete at least one activity will receive a participation badge.</li>
                        <li>Top 3 performers will receive special badges and additional rewards.</li>
                        <li>All rewards will be distributed within 24 hours after the event ends.</li>
                      </ul>
                      
                      <h4 className="mt-6">Fair Play</h4>
                      <ul>
                        <li>Any attempt to manipulate scores or exploit the system will result in disqualification.</li>
                        <li>We reserve the right to remove any participant who violates our terms of service.</li>
                        <li>All decisions by the event organizers are final.</li>
                      </ul>
                      
                      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium flex items-center">
                          <FiAlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                          Important Notes
                        </h5>
                        <ul className="mt-2">
                          <li>Event dates and rewards are subject to change without prior notice.</li>
                          <li>We are not responsible for any technical issues that may affect your participation.</li>
                          <li>For any questions or issues, please contact our support team.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEventModal(false)}
                >
                  Close
                </Button>
                
                {selectedEvent.status.status === 'upcoming' ? (
                  <Button 
                    disabled={isRegistering}
                    onClick={() => registerForEvent(selectedEvent.id)}
                  >
                    {isRegistering ? 'Registering...' : 'Register for Event'}
                  </Button>
                ) : selectedEvent.status.status === 'active' ? (
                  <Button 
                    disabled={isRegistering}
                    onClick={() => {
                      // In a real app, this would navigate to the event
                      console.log('Starting event:', selectedEvent.id);
                    }}
                  >
                    Start Event
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalEvents;
