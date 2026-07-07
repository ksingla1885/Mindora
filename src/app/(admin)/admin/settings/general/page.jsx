'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Mail, ShieldAlert, Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
    const [siteName, setSiteName] = useState('Mindora');
    const [tagline, setTagline] = useState('Master Your Olympiads');
    const [supportEmail, setSupportEmail] = useState('support@mindora.com');
    const [contactPhone, setContactPhone] = useState('+1 (555) 019-2834');

    const [original, setOriginal] = useState({
        maintenanceMode: false,
        allowSelfRegistration: true,
        siteName: 'Mindora',
        tagline: 'Master Your Olympiads',
        supportEmail: 'support@mindora.com',
        contactPhone: '+1 (555) 019-2834',
    });

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/settings/general');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setMaintenanceMode(data.maintenanceMode);
            setAllowSelfRegistration(data.allowSelfRegistration);
            setSiteName(data.siteName);
            setTagline(data.tagline);
            setSupportEmail(data.supportEmail);
            setContactPhone(data.contactPhone);
            setOriginal({
                maintenanceMode: data.maintenanceMode,
                allowSelfRegistration: data.allowSelfRegistration,
                siteName: data.siteName,
                tagline: data.tagline,
                supportEmail: data.supportEmail,
                contactPhone: data.contactPhone,
            });
        } catch (err) {
            toast.error('Failed to load settings. Using defaults.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleReset = () => {
        setMaintenanceMode(original.maintenanceMode);
        setAllowSelfRegistration(original.allowSelfRegistration);
        setSiteName(original.siteName);
        setTagline(original.tagline);
        setSupportEmail(original.supportEmail);
        setContactPhone(original.contactPhone);
        toast.info('Changes discarded.');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch('/api/admin/settings/general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maintenanceMode,
                    allowSelfRegistration,
                    siteName,
                    tagline,
                    supportEmail,
                    contactPhone,
                }),
            });
            if (!res.ok) throw new Error('Save failed');
            setOriginal({
                maintenanceMode,
                allowSelfRegistration,
                siteName,
                tagline,
                supportEmail,
                contactPhone,
            });
            toast.success(maintenanceMode
                ? '🔒 Maintenance mode enabled. Only admins can access the site.'
                : '✅ Settings saved successfully.'
            );
        } catch {
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">General Settings</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Configure branding, contact information, and global platform status.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={handleReset}
                        disabled={loading || saving}
                        className="flex items-center gap-2 justify-center h-9 px-4 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="flex items-center gap-2 justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Site Branding */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Site Branding</h3>
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading branding...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Site Name</label>
                            <input
                                className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tagline</label>
                            <input
                                className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                                type="text"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Contact Details */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading contact info...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Support Email</label>
                            <input
                                className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                                type="email"
                                value={supportEmail}
                                onChange={(e) => setSupportEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Phone</label>
                            <input
                                className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                                type="text"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Platform Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Platform Access</h3>
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading settings...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Maintenance Mode Toggle */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                                <p className="text-xs text-muted-foreground">
                                    Block all access to the portal. Only admins can access the site.
                                </p>
                                {maintenanceMode && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
                                        🔒 Currently active — site is locked to admins only
                                    </span>
                                )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                <input
                                    className="sr-only peer"
                                    type="checkbox"
                                    checked={maintenanceMode}
                                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                        <div className="h-px bg-border"></div>
                        {/* Self Registration Toggle */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium text-foreground">Allow Self Registration</p>
                                <p className="text-xs text-muted-foreground">Allow new users to sign up for accounts from the login screen.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                <input
                                    className="sr-only peer"
                                    type="checkbox"
                                    checked={allowSelfRegistration}
                                    onChange={(e) => setAllowSelfRegistration(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
