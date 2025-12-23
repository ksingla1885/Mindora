'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiDownload, FiFileText, FiAlertCircle, FiCheckCircle, FiX, FiInfo } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

export default function BulkOperations() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('import');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedType, setSelectedType] = useState('badges');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a JSON file to import.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', selectedType);
    formData.append('action', 'import');

    setIsLoading(true);
    setImportResults(null);

    try {
      const response = await fetch('/api/admin/gamification/bulk', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import data');
      }

      setImportResults(result);
      
      toast({
        title: 'Import successful',
        description: `Successfully imported ${result.success} of ${result.total} items.`,
      });

      // Refresh the data
      router.refresh();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/gamification/bulk?type=${selectedType}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-template.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: 'Template downloaded',
        description: 'The template file has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Download template error:', error);
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to download template.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/gamification/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          action: 'export',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: 'Export successful',
        description: `The ${selectedType} have been exported successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Operations</h2>
          <p className="text-muted-foreground">
            Import or export {selectedType} in bulk using JSON files
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              resetImport();
            }}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="badges">Badges</option>
            <option value="challenges">Challenges</option>
          </select>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import {selectedType}</CardTitle>
              <CardDescription>
                Upload a JSON file to import {selectedType} in bulk. 
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate}
                  className="ml-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Download template
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div 
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FiUpload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JSON file up to 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiFileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetImport}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {importResults && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Import Results</h3>
                    <div className="text-sm text-gray-500">
                      {importResults.success} of {importResults.total} succeeded
                    </div>
                  </div>
                  
                  <Progress 
                    value={(importResults.success / importResults.total) * 100} 
                    className="h-2"
                  />
                  
                  {importResults.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {importResults.errors.length} error(s) occurred:
                      </h4>
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <FiAlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                              {importResults.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>
                                  Item {error.item}: {error.error}
                                </li>
                              ))}
                              {importResults.errors.length > 5 && (
                                <li>...and {importResults.errors.length - 5} more errors</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              {importResults ? (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetImport}
                >
                  Import Another File
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleImport}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? 'Importing...' : 'Import'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export {selectedType}</CardTitle>
              <CardDescription>
                Export all {selectedType} to a JSON file for backup or migration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiInfo className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      The export will include all {selectedType} in your system, including inactive ones.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="button" 
                onClick={handleExport}
                disabled={isLoading}
              >
                {isLoading ? 'Exporting...' : `Export ${selectedType}`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
