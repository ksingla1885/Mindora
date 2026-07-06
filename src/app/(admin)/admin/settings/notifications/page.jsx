'use client';

import { Bell, Mail, MessageSquare, ShieldAlert } from 'lucide-react';

export default function NotificationsSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Notification Settings</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Configure triggers, alert preferences, and third-party notification integrations.</p>
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

            {/* Email Notifications */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Email Notifications</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">System Alerts & Updates</p>
                            <p className="text-xs text-muted-foreground">Receive critical platform updates and server health notices.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="h-px bg-border/50"></div>
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">Student Action Reports</p>
                            <p className="text-xs text-muted-foreground">Receive weekly summaries of student performance and flag triggers.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="h-px bg-border/50"></div>
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">Billing & Payment Notices</p>
                            <p className="text-xs text-muted-foreground">Receive email alerts for invoices, payouts, and payment failures.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input defaultChecked className="sr-only peer" type="checkbox" />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Slack Integration */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Slack Webhook</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Webhook URL</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5 font-mono"
                            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                            type="text"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Post automatic notifications to a Slack channel when high-importance events (such as server error logs or critical payment flags) trigger.</p>
                </div>
            </div>
        </div>
    );
}
