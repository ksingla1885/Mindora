'use client';

import { UserForm } from '../_components/user-form';

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New User</h1>
        <p className="text-muted-foreground">
          Create a new user account
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-6">
        <UserForm />
      </div>
    </div>
  );
}
