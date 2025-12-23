'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function CertificatesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/certificates');

                if (!response.ok) {
                    if (response.status === 401) {
                        // Let the auth check below handle redirect
                        return;
                    }
                    throw new Error('Failed to fetch certificates');
                }

                const data = await response.json();
                setCertificates(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading certificates:', err);
                setError('Failed to load your certificates. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchCertificates();
        } else if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/certificates');
        }
    }, [status, router]);

    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    const handleDownload = (certId) => {
        // Open download link in new tab
        window.open(`/api/certificates/download/${certId}`, '_blank');
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
                <p className="text-muted-foreground">
                    View and download your earned certificates from completions and achievements.
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    {error}
                </div>
            )}

            {!loading && !error && certificates.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No Certificates Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        Complete courses, pass tests, or achieve milestones to earn your first certificate!
                    </p>
                    <Button
                        className="mt-6"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                    <Card key={cert.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Award className="h-8 w-8 text-amber-500 mb-2" />
                                {cert.isNew && (
                                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                        New
                                    </span>
                                )}
                            </div>
                            <CardTitle className="line-clamp-1">{cert.title || 'Certificate of Achievement'}</CardTitle>
                            <CardDescription className="line-clamp-2">
                                {cert.description || `Awarded for completing ${cert.test?.title || 'a milestone'}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground mt-2">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Earned on {cert.createdAt ? format(new Date(cert.createdAt), 'MMM d, yyyy') : 'Recently'}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 pt-4">
                            <Button
                                variant="default"
                                className="w-full"
                                onClick={() => handleDownload(cert.id)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
