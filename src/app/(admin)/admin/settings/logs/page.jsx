'use client';

import { History, Search, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function AuditLogsSettingsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [logs, setLogs] = useState([
        { id: 1, timestamp: '2026-07-06 18:24:12', user: 'admin@mindora.com', action: 'API Key Rotated', resource: 'AI Settings', status: 'Success', ip: '192.168.1.101' },
        { id: 2, timestamp: '2026-07-06 17:15:32', user: 'admin@mindora.com', action: 'Invited team member', resource: 'Accounts', status: 'Success', ip: '192.168.1.101' },
        { id: 3, timestamp: '2026-07-06 15:02:44', user: 'ananya@mindora.com', action: 'Updated pricing plan', resource: 'Payments', status: 'Success', ip: '192.168.1.105' },
        { id: 4, timestamp: '2026-07-06 12:44:19', user: 'admin@mindora.com', action: 'Failed Login Attempt', resource: 'Authentication', status: 'Failed', ip: '104.244.73.12' },
        { id: 5, timestamp: '2026-07-05 09:12:05', user: 'admin@mindora.com', action: 'Modified System Prompts', resource: 'AI Settings', status: 'Success', ip: '192.168.1.101' },
    ]);

    const filteredLogs = logs.filter((log) =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Audit & Logs</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Track and review administrative actions, system modifications, and authentication logs.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Logs Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block pl-10 pr-4 py-2"
                        placeholder="Search logs by action, user or resource..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors border border-border text-sm font-medium whitespace-nowrap"
                    onClick={() => {
                        // mock reload
                    }}
                >
                    <RefreshCw className="w-4 h-4" /> Refresh Logs
                </button>
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                        <History className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Activity History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                                <th className="pb-3 pl-2">Timestamp</th>
                                <th className="pb-3">User</th>
                                <th className="pb-3">Action</th>
                                <th className="pb-3">Resource</th>
                                <th className="pb-3">IP Address</th>
                                <th className="pb-3 text-right pr-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="py-3.5 pl-2 text-muted-foreground font-mono text-xs">{log.timestamp}</td>
                                    <td className="py-3.5 font-medium">{log.user}</td>
                                    <td className="py-3.5">{log.action}</td>
                                    <td className="py-3.5 text-muted-foreground">{log.resource}</td>
                                    <td className="py-3.5 text-muted-foreground font-mono text-xs">{log.ip}</td>
                                    <td className="py-3.5 text-right pr-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                            log.status === 'Success'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
