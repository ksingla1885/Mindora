'use client';

import { Settings, Globe, Mail, ShieldAlert } from 'lucide-react';

export default function GeneralSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">General Settings</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Configure branding, contact information, and global platform status.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button className="flex items-center justify-center h-9 px-4 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                        Reset
                    </button>
                    <button className="flex items-center justify-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Site Name</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            type="text"
                            defaultValue="Mindora"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tagline</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            type="text"
                            defaultValue="Master Your Olympiads"
                        />
                    </div>
                </div>
            </div>

            {/* Contact Details */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Support Email</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            type="email"
                            defaultValue="support@mindora.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Contact Phone</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            type="text"
                            defaultValue="+1 (555) 019-2834"
                        />
                    </div>
                </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Platform Access</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                            <p className="text-xs text-muted-foreground">Block student access to the portal for scheduled updates.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="h-px bg-border"></div>
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">Allow Self Registration</p>
                            <p className="text-xs text-muted-foreground">Allow new users to sign up for accounts from the login screen.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
