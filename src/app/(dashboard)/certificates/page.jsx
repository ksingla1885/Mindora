'use client';

import React, { useState, useEffect } from 'react';
import {
    Award,
    Download,
    Search,
    ExternalLink,
    Calendar,
    BookOpen,
    CheckCircle2,
    Loader2,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function CertificatesPage() {
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const [search, setSearch] = useState('');

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/certificates');
            const result = await response.json();
            if (result.success) {
                setCertificates(result.certificates);
            }
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const handleDownload = async (certId) => {
        try {
            window.open(`/api/certificates/download/${certId}`, '_blank');
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const filteredCertificates = certificates.filter(cert =>
        cert.testTitle.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
            <div className="max-w-6xl mx-auto px-4 pt-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Award className="h-10 w-10 text-primary" />
                            My Certificates
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Your academic achievements and verified milestones.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search certificates..."
                            className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh]">
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Loading your achievements...</p>
                    </div>
                ) : filteredCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filteredCertificates.map((cert, index) => (
                                <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-900 h-full flex flex-col">
                                        <div className="h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative p-6 flex flex-col justify-between overflow-hidden">
                                            {/* Background Pattern */}
                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                                <Award className="h-40 w-40" />
                                            </div>

                                            <div className="flex justify-between items-start z-10">
                                                <Badge variant="secondary" className="bg-white/80 dark:bg-black/40 backdrop-blur-sm border-none font-bold">
                                                    {cert.certificateId}
                                                </Badge>
                                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                                </div>
                                            </div>

                                            <div className="z-10">
                                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">CERTIFICATE OF EXCELLENCE</p>
                                                <h3 className="text-xl font-black text-slate-800 dark:text-white line-clamp-2 leading-tight">
                                                    {cert.testTitle}
                                                </h3>
                                            </div>
                                        </div>

                                        <CardContent className="p-6 flex-grow space-y-4">
                                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Issued: {format(new Date(cert.issuedAt), 'MMM dd, yyyy')}</span>
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Score</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{cert.score}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cert.score}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                                            <Button
                                                onClick={() => handleDownload(cert.id)}
                                                className="flex-1 font-bold rounded-xl"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                            <Award className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Certificates Earned Yet</h2>
                        <p className="text-slate-500 max-w-sm mt-3 text-lg leading-relaxed">
                            Pass your tests with flying colors to earn verified certificates of achievement!
                        </p>
                        <Button
                            className="mt-10 px-10 py-7 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
                            onClick={() => window.location.href = '/tests'}
                        >
                            Explore Tests
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
