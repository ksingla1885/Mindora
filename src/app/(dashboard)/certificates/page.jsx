"use client";

import React from 'react';
import {
    Award,
} from 'lucide-react';

// No static data - will be fetched from API
const certificates = [];

export default function CertificatesPage() {
    const hasCertificates = certificates.length > 0;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground animate-fade-in" suppressHydrationWarning>
            <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Page Heading */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">My Certificates</h1>
                            <p className="text-base md:text-lg text-muted-foreground">Your learning milestones and achievements in one place</p>
                        </div>
                    </div>

                    {/* Empty State */}
                    {!hasCertificates && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
                                <Award className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-3">No Certificates Yet</h2>
                            <p className="text-muted-foreground max-w-md leading-relaxed">
                                You haven't earned any certificates yet. Complete courses and tests to earn your first certificate!
                            </p>
                        </div>
                    )}

                    {/* Certificates content would go here when data is available */}
                    {hasCertificates && (
                        <div>
                            {/* Stats, filters, and certificate grid would be rendered here */}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
