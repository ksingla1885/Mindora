'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CourseForm } from '../../_components/course-form';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/courses/${params.courseId}`);
        // const data = await response.json();
        
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockCourse = {
          id: params.courseId,
          title: 'JEE Main Physics Complete Course',
          slug: 'jee-main-physics',
          description: 'A comprehensive course covering all topics for JEE Main Physics',
          shortDescription: 'Master JEE Main Physics with expert guidance and practice',
          category: 'jee-main',
          level: 'advanced',
          price: 4999,
          isPaid: true,
          status: 'published',
          featured: true,
          thumbnail: 'https://example.com/thumbnails/jee-physics.jpg',
          prerequisites: [
            'Basic knowledge of Class 11 Physics',
            'Understanding of basic calculus',
          ],
          learningOutcomes: [
            'Solve complex JEE Main Physics problems',
            'Understand key concepts and their applications',
            'Develop problem-solving strategies',
          ],
          sections: [
            {
              id: 'section-1',
              title: 'Introduction',
              description: 'Get started with the course',
              lectures: [
                {
                  id: 'lecture-1',
                  title: 'Course Overview',
                  type: 'video',
                  duration: 15,
                  isFree: true,
                  content: 'https://example.com/videos/course-overview',
                  resources: [
                    { id: 'res-1', name: 'Course Syllabus', type: 'pdf', url: '#' },
                  ],
                },
              ],
            },
            // Add more sections as needed
          ],
        };
        
        setCourse(mockCourse);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.courseId) {
      fetchCourse();
    }
  }, [params.courseId]);

  const handleSuccess = () => {
    // Refresh the page or navigate to the course list
    router.push('/admin/courses');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Error Loading Course</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Course not found</h2>
        <p className="text-muted-foreground mt-2">The requested course could not be found.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Edit Course</h1>
          <p className="text-muted-foreground">
            Update the course details and content
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <CourseForm course={course} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
