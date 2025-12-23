'use client';

import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, XCircle, Pencil, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const columns = [
  {
    accessorKey: 'name',
    header: 'Test Name',
    cell: ({ row }) => {
      const test = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{test.name}</p>
            <p className="text-sm text-muted-foreground">{test.subject} • {test.questions} questions</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date & Time',
    cell: ({ row }) => {
      const test = row.original;
      return (
        <div className="text-sm text-muted-foreground">
          {new Date(test.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const test = row.original;
      return (
        <Badge 
          variant={test.status === 'published' ? 'default' : 'outline'}
          className={test.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        >
          {test.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'participants',
    header: 'Participants',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.participants} students
      </div>
    ),
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: () => (
      <div className="flex space-x-2">
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="icon">
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">View Analytics</span>
        </Button>
      </div>
    ),
  },
];
