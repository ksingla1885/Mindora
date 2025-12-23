import Leaderboard from '@/components/leaderboard/Leaderboard';

export const metadata = {
    title: 'Leaderboard | Mindora',
    description: 'See top performers and your ranking.',
};

export default function LeaderboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                <p className="text-muted-foreground">
                    Compete with other students and track your progress.
                </p>
            </div>

            <Leaderboard />
        </div>
    );
}
