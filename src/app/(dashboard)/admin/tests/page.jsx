import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Download, Upload, Calendar, Clock, Award, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with API calls
const tests = [
  {
    id: '1',
    title: 'Physics Weekly Test - Mechanics',
    type: 'weekly',
    subject: 'Physics',
    topic: 'Mechanics',
    startTime: '2023-11-15T10:00:00Z',
    endTime: '2023-11-15T11:30:00Z',
    duration: 90,
    isPublished: true,
    isPaid: false,
    participants: 124,
    avgScore: 72,
    questions: 25
  },
  {
    id: '2',
    title: 'Chemistry Olympiad Qualifier',
    type: 'olympiad',
    subject: 'Chemistry',
    topic: 'Organic Chemistry',
    startTime: '2023-11-20T14:00:00Z',
    endTime: '2023-11-20T17:00:00Z',
    duration: 180,
    isPublished: true,
    isPaid: true,
    price: 299,
    participants: 89,
    avgScore: 65,
    questions: 50
  },
  {
    id: '3',
    title: 'Mathematics Challenge - Algebra',
    type: 'practice',
    subject: 'Mathematics',
    topic: 'Algebra',
    startTime: null,
    endTime: null,
    duration: 60,
    isPublished: true,
    isPaid: false,
    participants: 0,
    avgScore: null,
    questions: 15
  },
  {
    id: '4',
    title: 'Biology Weekly Test - Genetics',
    type: 'weekly',
    subject: 'Biology',
    topic: 'Genetics',
    startTime: '2023-11-17T10:00:00Z',
    endTime: '2023-11-17T11:00:00Z',
    duration: 60,
    isPublished: false,
    isPaid: false,
    participants: 0,
    avgScore: null,
    questions: 20
  },
];

export default function TestsPage() {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestStatus = (test) => {
    const now = new Date();
    const start = test.startTime ? new Date(test.startTime) : null;
    const end = test.endTime ? new Date(test.endTime) : null;
    
    if (!test.isPublished) {
      return { label: 'Draft', variant: 'outline' };
    }
    
    if (start && now < start) {
      return { label: 'Upcoming', variant: 'secondary' };
    }
    
    if (end && now > end) {
      return { label: 'Completed', variant: 'default' };
    }
    
    if (start && end && now >= start && now <= end) {
      return { label: 'In Progress', variant: 'destructive' };
    }
    
    return { label: 'Scheduled', variant: 'default' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Test Management</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage tests for students
          </p>
        </div>
        <div className="flex gap-2
        ">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Tests</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium">
                  <div className="col-span-5">Test</div>
                  <div className="col-span-2">Subject</div>
                  <div className="col-span-2">Schedule</div>
                  <div className="col-span-1 text-center">Questions</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {tests.map((test) => {
                  const status = getTestStatus(test);
                  return (
                    <div key={test.id} className="grid grid-cols-12 gap-4 p-4 items-center border-t">
                      <div className="col-span-5">
                        <div className="font-medium">
                          <Link href={`/admin/tests/${test.id}`} className="hover:underline">
                            {test.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          {test.isPaid && (
                            <Badge variant="outline" className="text-xs">
                              ₹{test.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {test.subject} • {test.topic}
                      </div>
                      <div className="col-span-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                          {test.startTime ? formatDate(test.startTime) : 'Not scheduled'}
                        </div>
                        {test.startTime && test.endTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {test.duration} mins
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 text-center text-sm">
                        {test.questions}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/tests/${test.id}/results`}>
                            <BarChart3 className="h-4 w-4" />
                            <span className="sr-only">Results</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/tests/${test.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">1-{tests.length}</span> of <span className="font-medium">{tests.length}</span> tests
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/tests/import">
                <Upload className="mr-2 h-4 w-4" />
                Import Questions
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/tests/templates">
                <FileText className="mr-2 h-4 w-4" />
                Use Template
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/tests/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Bulk Tests
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests
              .filter(t => t.startTime && new Date(t.startTime) > new Date())
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
              .slice(0, 3)
              .map(test => (
                <div key={test.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{test.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(test.startTime)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tests/${test.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            {tests.filter(t => t.startTime && new Date(t.startTime) > new Date()).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No upcoming tests scheduled
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
