'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import FileUploader from '@/components/content/FileUploader';

export default function TestUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('single');
  const [isUploading, setIsUploading] = useState(false);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleUploadComplete = (uploadedFiles) => {
    console.log('Uploaded files:', uploadedFiles);
    toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
  };

  const handleError = (error) => {
    console.error('Upload error:', error);
    toast.error(error.message || 'Failed to upload files');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test File Upload</h1>
          <p className="text-muted-foreground">
            Test the file upload functionality
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload Tester</CardTitle>
          <CardDescription>
            Try uploading different types of files to test the upload functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="single" 
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <div className="space-y-6">
                <FileUploader
                  onUploadComplete={handleUploadComplete}
                  onError={handleError}
                  maxFiles={1}
                  maxSize={1024 * 1024 * 500} // 500MB
                  className="max-w-3xl"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="multiple">
              <div className="space-y-6">
                <FileUploader
                  onUploadComplete={handleUploadComplete}
                  onError={handleError}
                  multiple
                  maxFiles={10}
                  maxSize={1024 * 1024 * 1024} // 1GB per file
                  className="max-w-4xl"
                />
                <div className="text-sm text-muted-foreground">
                  <p>• Maximum 10 files per upload</p>
                  <p>• Maximum file size: 1GB per file</p>
                  <p>• Supported formats: MP4, WebM, PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
