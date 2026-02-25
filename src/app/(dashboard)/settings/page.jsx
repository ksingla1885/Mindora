import { redirect } from 'next/navigation';

/**
 * /settings root page — redirect to /settings/profile
 * This file must exist to prevent a 404 when navigating to /settings.
 */
export default function SettingsPage() {
    redirect('/settings/profile');
}
