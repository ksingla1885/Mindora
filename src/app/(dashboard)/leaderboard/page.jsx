"use client";

import React from 'react';
import {
    Trophy,
    Users,
} from 'lucide-react';

// No static data - will be fetched from API
const leaderboardData = [];

export default function LeaderboardPage() {
    const hasData = leaderboardData.length > 0;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col overflow-x-hidden pb-32">
            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Leaderboard</h1>
                        <p className="text-muted-foreground text-lg">See how you stack up against your peers. Consistency is key!</p>
                    </div>
                </div>

                {/* Empty State */}
                {!hasData && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-6">
                            <Trophy className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">No Leaderboard Data Available</h2>
                        <p className="text-muted-foreground max-w-md leading-relaxed">
                            There is currently no leaderboard data available. Complete some tests to see your ranking!
                        </p>
                    </div>
                )}

                {/* Leaderboard content would go here when data is available */}
                {hasData && (
                    <div>
                        {/* Filters, podium, and table would be rendered here */}
                    </div>
                )}
            </main>
        </div>
    );
}
