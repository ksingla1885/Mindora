'use client';

import { UserCog, Plus, Shield, UserCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function AccountSettingsPage() {
    const [team, setTeam] = useState([
        { id: 1, name: 'Ketan Singla', email: 'admin@mindora.com', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Ananya Sharma', email: 'ananya@mindora.com', role: 'Editor', status: 'Active' },
        { id: 3, name: 'Rahul Verma', email: 'rahul@mindora.com', role: 'Viewer', status: 'Pending' },
    ]);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Editor');

    const handleInvite = (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setTeam([
            ...team,
            {
                id: Date.now(),
                name: inviteEmail.split('@')[0],
                email: inviteEmail,
                role: inviteRole,
                status: 'Pending',
            },
        ]);
        setInviteEmail('');
    };

    const handleDelete = (id) => {
        setTeam(team.filter((member) => member.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Page Title & Intro */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Account & Roles</h2>
                    <p className="text-muted-foreground text-sm max-w-2xl">Manage administrative access levels, invite team members, and review roles.</p>
                </div>
            </div>

            {/* Invite Team Member */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Invite Administrator</h3>
                </div>
                <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
                        <input
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            placeholder="colleague@mindora.com"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role Permission</label>
                        <select
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block p-2.5"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                        >
                            <option>Admin</option>
                            <option>Editor</option>
                            <option>Viewer</option>
                        </select>
                    </div>
                    <button
                        className="w-full md:w-auto flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                        type="submit"
                    >
                        Send Invite
                    </button>
                </form>
            </div>

            {/* Administrators List */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <UserCog className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Team Directory</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                                <th className="pb-3 pl-2">Name</th>
                                <th className="pb-3">Email</th>
                                <th className="pb-3">Role</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="py-3.5 pl-2 font-medium flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                                            {member.name.slice(0, 2)}
                                        </div>
                                        {member.name}
                                    </td>
                                    <td className="py-3.5 text-muted-foreground">{member.email}</td>
                                    <td className="py-3.5">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20 font-medium">
                                            <Shield className="w-3.5 h-3.5" />
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="py-3.5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                            member.status === 'Active'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 text-right pr-2">
                                        <button
                                            className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                                            onClick={() => handleDelete(member.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
