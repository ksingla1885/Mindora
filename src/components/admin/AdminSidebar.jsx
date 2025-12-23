'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  BookOpen, 
  MessageSquare, 
  Award, 
  CreditCard,
  LogOut,
  Bookmark,
  FileVideo,
  FileQuestion,
  ClipboardList
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
        },
        {
          name: 'Users',
          href: '/admin/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          name: 'Courses',
          href: '/admin/courses',
          icon: BookOpen,
        },
        {
          name: 'Videos',
          href: '/admin/videos',
          icon: FileVideo,
        },
        {
          name: 'Tests',
          href: '/admin/tests',
          icon: FileText,
        },
        {
          name: 'Questions',
          href: '/admin/questions',
          icon: FileQuestion,
        },
        {
          name: 'Practice Sets',
          href: '/admin/practice-sets',
          icon: ClipboardList,
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          name: 'Performance',
          href: '/admin/analytics/performance',
          icon: BarChart3,
        },
        {
          name: 'Leaderboards',
          href: '/admin/leaderboards',
          icon: Award,
        },
        {
          name: 'Payments',
          href: '/admin/payments',
          icon: CreditCard,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="bg-background border-r h-full w-64 flex flex-col fixed inset-y-0 left-0 z-50">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Mindora Admin</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-8">
        {menuItems.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
