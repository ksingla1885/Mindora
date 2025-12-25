'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Copy, RefreshCw, Eye, EyeOff, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';

// Form schemas
const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  expiresAt: z.string().optional(),
  permissions: z.array(z.string()).nonempty('At least one permission is required'),
});

const rateLimitSchema = z.object({
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  limit: z.number().min(1, 'Limit must be at least 1'),
  window: z.string().min(1, 'Time window is required'),
});

// Permission options
const PERMISSIONS = [
  { id: 'read', label: 'Read', description: 'Read access to resources' },
  { id: 'write', label: 'Write', description: 'Create and update resources' },
  { id: 'delete', label: 'Delete', description: 'Delete resources' },
  { id: 'admin', label: 'Admin', description: 'Full administrative access' },
  { id: 'analytics', label: 'Analytics', description: 'Access to analytics data' },
  { id: 'webhook', label: 'Webhook', description: 'Webhook management' },
];

// Time window options for rate limiting
const TIME_WINDOWS = [
  { value: '1m', label: 'Per Minute' },
  { value: '1h', label: 'Per Hour' },
  { value: '1d', label: 'Per Day' },
  { value: '7d', label: 'Per Week' },
  { value: '30d', label: 'Per Month' },
];

export default function ApiManagementPage() {
  const [activeTab, setActiveTab] = useState('keys');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [apiKeys, setApiKeys] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form hooks
  const apiKeyForm = useForm({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      expiresAt: '',
      permissions: ['read'],
    },
  });

  const rateLimitForm = useForm({
    resolver: zodResolver(rateLimitSchema),
    defaultValues: {
      path: '',
      limit: 100,
      window: '1h',
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchApiSettings = async () => {
      try {
        setIsLoading(true);
        const [keysRes, limitsRes, usageRes] = await Promise.all([
          fetch('/api/admin/settings/api/keys').then(res => res.json()),
          fetch('/api/admin/settings/api/rate-limits').then(res => res.json()),
          fetch('/api/admin/settings/api/usage').then(res => res.json()),
        ]);

        if (keysRes.data) setApiKeys(keysRes.data);
        if (limitsRes.data) setRateLimits(limitsRes.data);
        if (usageRes.data) setUsageData(usageRes.data);
      } catch (error) {
        console.error('Error fetching API settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load API settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiSettings();
  }, []);

  // API Key actions
  const generateApiKey = async (data) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate API key');
      }

      setNewKey(result.data.key);
      setShowNewKey(true);
      setApiKeys(prev => [result.data, ...prev]);
      apiKeyForm.reset();
      
      toast({
        title: 'Success',
        description: 'API key generated successfully',
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate API key',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const revokeApiKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/settings/api/keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      setApiKeys(prev => prev.filter(key => key.id !== id));
      
      toast({
        title: 'Success',
        description: 'API key revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke API key',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  // Rate limit actions
  const addRateLimit = async (data) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings/api/rate-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add rate limit');
      }

      setRateLimits(prev => [result.data, ...prev]);
      rateLimitForm.reset();
      
      toast({
        title: 'Success',
        description: 'Rate limit added successfully',
      });
    } catch (error) {
      console.error('Error adding rate limit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add rate limit',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeRateLimit = async (id) => {
    if (!confirm('Are you sure you want to remove this rate limit?')) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/settings/api/rate-limits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove rate limit');
      }

      setRateLimits(prev => prev.filter(limit => limit.id !== id));
      
      toast({
        title: 'Success',
        description: 'Rate limit removed successfully',
      });
    } catch (error) {
      console.error('Error removing rate limit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove rate limit',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter API keys by search term
  const filteredApiKeys = apiKeys.filter(key => 
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (key.prefix && key.prefix.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // API Keys table columns
  const apiKeyColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
          {row.original.isActive ? (
            <Badge variant="outline" className="ml-2">Active</Badge>
          ) : (
            <Badge variant="outline" className="ml-2" color="gray">Revoked</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'prefix',
      header: 'Key Prefix',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.prefix}•••••{row.original.lastFour}
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.permissions.map(permission => (
            <Badge key={permission} variant="secondary" className="text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => revokeApiKey(row.original.id)}
            disabled={!row.original.isActive || isSaving}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Revoke
          </Button>
        </div>
      ),
    },
  ];

  // Rate Limits table columns
  const rateLimitColumns = [
    {
      accessorKey: 'path',
      header: 'Path',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.path}
        </div>
      ),
    },
    {
      accessorKey: 'limit',
      header: 'Limit',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.limit} requests
        </div>
      ),
    },
    {
      accessorKey: 'window',
      header: 'Per',
      cell: ({ row }) => {
        const window = TIME_WINDOWS.find(w => w.value === row.original.window);
        return (
          <div className="text-sm">
            {window ? window.label : row.original.window}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeRateLimit(row.original.id)}
            disabled={isSaving}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Usage data columns
  const usageColumns = [
    {
      accessorKey: 'endpoint',
      header: 'Endpoint',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.method} {row.original.endpoint}
        </div>
      ),
    },
    {
      accessorKey: 'requests',
      header: 'Requests',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.requests.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'successRate',
      header: 'Success Rate',
      cell: ({ row }) => (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              row.original.successRate > 90 ? 'bg-green-500' : 
              row.original.successRate > 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${row.original.successRate}%` }}
          ></div>
        </div>
      ),
    },
    {
      accessorKey: 'avgResponseTime',
      header: 'Avg. Response',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.avgResponseTime}ms
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Management</h1>
          <p className="text-muted-foreground">
            Manage API keys, rate limits, and monitor usage
          </p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>
                Create a new API key with specific permissions
              </CardDescription>
            </CardHeader>
            <form onSubmit={apiKeyForm.handleSubmit(generateApiKey)}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production Server"
                      {...apiKeyForm.register('name')}
                    />
                    {apiKeyForm.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {apiKeyForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-expiry">Expiration (Optional)</Label>
                    <Input
                      id="key-expiry"
                      type="date"
                      {...apiKeyForm.register('expiresAt')}
                    />
                    {apiKeyForm.formState.errors.expiresAt && (
                      <p className="text-sm text-red-500">
                        {apiKeyForm.formState.errors.expiresAt.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {PERMISSIONS.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`perm-${permission.id}`}
                          value={permission.id}
                          checked={apiKeyForm.watch('permissions').includes(permission.id)}
                          onChange={(e) => {
                            const current = apiKeyForm.getValues('permissions');
                            if (e.target.checked) {
                              apiKeyForm.setValue('permissions', [...current, permission.id]);
                            } else {
                              apiKeyForm.setValue(
                                'permissions',
                                current.filter((p) => p !== permission.id)
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`perm-${permission.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {permission.label}
                          </label>
                          <p className="text-xs text-gray-500">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {apiKeyForm.formState.errors.permissions && (
                    <p className="text-sm text-red-500">
                      {apiKeyForm.formState.errors.permissions.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate API Key
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {showNewKey && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-green-700">
                    Your new API key has been generated. Make sure to copy it now - you won't be able to see it again!
                  </p>
                  <p className="mt-3 text-sm md:mt-0 md:ml-6">
                    <button
                      type="button"
                      className="whitespace-nowrap font-medium text-green-700 hover:text-green-600"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      Copy key <span aria-hidden="true">&rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 bg-green-50 font-mono text-green-900 focus:ring-2 focus:ring-green-500 sm:text-sm"
                    value={newKey}
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      className="text-green-500 hover:text-green-700"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Your API Keys</h2>
              <div className="relative w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search keys..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <DataTable
                columns={apiKeyColumns}
                data={filteredApiKeys}
                isLoading={isLoading}
                emptyMessage="No API keys found. Generate your first key to get started."
              />
            </div>
          </div>
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Rate Limit</CardTitle>
              <CardDescription>
                Configure rate limits for specific API endpoints
              </CardDescription>
            </CardHeader>
            <form onSubmit={rateLimitForm.handleSubmit(addRateLimit)}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="path">API Path</Label>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                        /api/
                      </span>
                      <Input
                        id="path"
                        placeholder="v1/courses/*"
                        className="rounded-l-none"
                        {...rateLimitForm.register('path', {
                          setValueAs: (value) => value.replace(/^\/+|\/+$/g, ''), // Remove leading/trailing slashes
                        })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use * as a wildcard (e.g., users/* for all user endpoints)
                    </p>
                    {rateLimitForm.formState.errors.path && (
                      <p className="text-sm text-red-500">
                        {rateLimitForm.formState.errors.path.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Request Limit</Label>
                    <div className="relative">
                      <Input
                        id="limit"
                        type="number"
                        min="1"
                        {...rateLimitForm.register('limit', { valueAsNumber: true })}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">requests</span>
                      </div>
                    </div>
                    {rateLimitForm.formState.errors.limit && (
                      <p className="text-sm text-red-500">
                        {rateLimitForm.formState.errors.limit.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="window">Time Window</Label>
                    <Select
                      onValueChange={(value) =>
                        rateLimitForm.setValue('window', value)
                      }
                      defaultValue={rateLimitForm.getValues('window')}
                    >
                      <SelectTrigger id="window">
                        <SelectValue placeholder="Select time window" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_WINDOWS.map((window) => (
                          <SelectItem key={window.value} value={window.value}>
                            {window.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rateLimitForm.formState.errors.window && (
                      <p className="text-sm text-red-500">
                        {rateLimitForm.formState.errors.window.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Rate Limit
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Current Rate Limits</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Refresh rate limits
                  fetch('/api/admin/settings/api/rate-limits')
                    .then(res => res.json())
                    .then(data => {
                      if (data.data) setRateLimits(data.data);
                    })
                    .catch(console.error);
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="rounded-md border">
              <DataTable
                columns={rateLimitColumns}
                data={rateLimits}
                isLoading={isLoading}
                emptyMessage="No rate limits configured. Add your first rate limit above."
              />
            </div>
          </div>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Analytics</CardTitle>
              <CardDescription>
                Monitor your API usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {usageData.totalRequests?.toLocaleString() || '0'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Last 30 days
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {usageData.successRate ? `${usageData.successRate.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Successful requests
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Avg. Response Time</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {usageData.avgResponseTime ? `${usageData.avgResponseTime}ms` : 'N/A'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Last 24 hours
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Active API Keys</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {apiKeys.filter(k => k.isActive).length}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {apiKeys.length} total
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Endpoint Usage</h3>
                <div className="rounded-md border">
                  <DataTable
                    columns={usageColumns}
                    data={usageData.endpoints || []}
                    isLoading={isLoading}
                    emptyMessage="No usage data available"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate with our API
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Getting Started</h3>
              <p>
                Welcome to the Mindora API! This documentation will help you get started with our API and integrate it into your applications.
              </p>

              <h4>Base URL</h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1`}</code>
              </pre>

              <h4>Authentication</h4>
              <p>
                Authenticate your API requests by including your API key in the <code>Authorization</code> header:
              </p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{
`Authorization: Bearer your_api_key_here
Content-Type: application/json`
                }</code>
              </pre>

              <h4>Rate Limiting</h4>
              <p>
                API requests are subject to rate limiting. By default, the API allows {rateLimits.find(r => r.path === '*')?.limit || '100'} requests per {TIME_WINDOWS.find(w => w.value === (rateLimits.find(r => r.path === '*')?.window || '1h'))?.label.toLowerCase() || 'hour'} per API key.
              </p>
              <p>
                The following headers are included in rate-limited responses:
              </p>
              <ul>
                <li><code>X-RateLimit-Limit</code> - The maximum number of requests allowed in the current period</li>
                <li><code>X-RateLimit-Remaining</code> - The number of requests remaining in the current period</li>
                <li><code>X-RateLimit-Reset</code> - The time at which the current rate limit window resets (UTC epoch seconds)</li>
              </ul>

              <h4>Best Practices</h4>
              <ul>
                <li>Always use HTTPS for all API requests</li>
                <li>Never expose your API keys in client-side code</li>
                <li>Implement exponential backoff for handling rate limits</li>
                <li>Cache responses when possible to reduce API calls</li>
                <li>Use webhooks for real-time updates instead of polling</li>
              </ul>

              <h4>Example Request</h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{
`// List all courses
fetch('${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/courses', {
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));`
                }</code>
              </pre>

              <div className="mt-8 p-4 bg-blue-50 rounded-md">
                <h4 className="text-blue-800">Need Help?</h4>
                <p className="text-blue-700">
                  Check out our <a href="#" className="text-blue-600 hover:underline">full API documentation</a> or 
                  contact our <a href="#" className="text-blue-600 hover:underline">support team</a> for assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
