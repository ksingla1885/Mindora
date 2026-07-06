'use client';

import { ShieldCheck, Lock, ShieldAlert, Key } from 'lucide-react';

export default function SecuritySettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Security Settings</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Configure user authentication rules, session management, and login safety protocols.</p>
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

            {/* Two-Factor Authentication */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Multi-Factor Authentication (MFA)</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <p className="text-xs text-muted-foreground">Require administrators and teachers to verify their identity via an OTP app or SMS upon logging in.</p>
            </div>

            {/* Password Policy */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Password Policy</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Minimum Password Length</label>
                        <input
                            className="w-32 bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            type="number"
                            defaultValue="8"
                            min="6"
                        />
                    </div>
                    <div className="h-px bg-border/50"></div>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" type="checkbox" />
                            <span className="text-sm font-medium text-foreground">Require at least one uppercase letter</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" type="checkbox" />
                            <span className="text-sm font-medium text-foreground">Require at least one number</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" type="checkbox" />
                            <span className="text-sm font-medium text-foreground">Require at least one special character (!@#$%^&*)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Session Management */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Key className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Session Expiration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Inactivity Timeout</label>
                        <select defaultValue="1h" className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5">
                            <option value="15m">15 Minutes</option>
                            <option value="1h">1 Hour</option>
                            <option value="4h">4 Hours</option>
                            <option value="24h">24 Hours</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Concurrent Sessions</label>
                        <select defaultValue="3" className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5">
                            <option value="1">1 Session</option>
                            <option value="3">3 Sessions</option>
                            <option value="unlimited">Unlimited</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
