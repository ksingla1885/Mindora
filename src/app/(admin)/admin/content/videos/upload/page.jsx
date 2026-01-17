'use client';


import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import ContentUploadForm to avoid SSR issues
const ContentUploadForm = dynamic(() => import('@/components/admin/ContentUploadForm'), { ssr: false });

export default function UploadVideoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/admin/content/videos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Video</h1>
          <p className="text-muted-foreground">
            Add a new video to your content library
          </p>
        </div>
      </div>
      <ContentUploadForm />
    </div>
  );
}
