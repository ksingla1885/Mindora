'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CourseForm } from '../_components/course-form';

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/admin/courses">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
          <p className="text-muted-foreground">
            Set up a new course with all necessary details
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <CourseForm />
      </div>
    </div>
  );
}
