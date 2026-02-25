import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileForm } from './_components/profile-form';

export const metadata = {
    title: 'Profile Settings | Mindora',
    description: 'Manage your personal information and account settings.',
};

export default async function ProfileSettingsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login?callbackUrl=/settings/profile');
    }

    // Fetch full user data from DB
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            class: true,
            // Add other fields that ProfileForm might need
        }
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="container max-w-4xl py-10">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="grid gap-8">
                    <ProfileForm user={user} />
                </div>
            </div>
        </div>
    );
}
