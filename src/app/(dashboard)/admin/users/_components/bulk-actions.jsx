'use client';

import { useState } from 'react';
import { Upload, Download, Users, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export function BulkUserActions() {
  const [importOpen, setImportOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response
      const mockResponse = {
        total: 25,
        success: 23,
        failed: 2,
        errors: [
          { row: 5, email: 'invalid@example.com', error: 'Invalid email format' },
          { row: 12, email: 'duplicate@example.com', error: 'Email already exists' },
        ],
      };
      
      setImportResults(mockResponse);
      
      toast({
        title: 'Import completed',
        description: `Successfully imported ${mockResponse.success} of ${mockResponse.total} users`,
      });
      
      // Reset form
      setFile(null);
      setRole('student');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during import',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Simulate API call
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a dummy CSV file for download
      const csvContent = 'Name,Email,Role,Status\n' +
        'John Doe,john@example.com,student,active\n' +
        'Jane Smith,jane@example.com,teacher,active';
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export started',
        description: 'Your export will begin shortly',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred during export',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setImportOpen(true)}
        disabled={isLoading}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import Users
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport}
        disabled={isLoading}
      >
        <Download className="mr-2 h-4 w-4" />
        Export Users
      </Button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Users</DialogTitle>
            <DialogDescription>
              Upload a CSV file with user data. <a href="/templates/user_import_template.csv" download className="text-primary hover:underline">Download template</a>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">CSV File</Label>
              <Input 
                id="file" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                File must be in CSV format with columns: Name, Email, [Password], [Role]
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Default Role</Label>
              <Select 
                value={role} 
                onValueChange={setRole}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This role will be assigned to users without a specified role
              </p>
            </div>

            {importResults && (
              <div className="border rounded-lg p-4 mt-2">
                <h4 className="font-medium mb-2">Import Results</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="font-medium">{importResults.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success</p>
                    <p className="font-medium text-green-600">{importResults.success}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="font-medium text-red-600">{importResults.failed}</p>
                  </div>
                </div>
                
                {importResults.failed > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Errors</h5>
                    <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="flex items-start">
                          <X className="h-4 w-4 text-red-500 mt-0.5 mr-1.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Row {error.row}:</span> {error.email} - {error.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setImportOpen(false);
                setImportResults(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
