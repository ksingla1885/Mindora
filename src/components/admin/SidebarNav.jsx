'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function SidebarNav({ className, items, ...props }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState(() => {
    // Initialize expanded state based on current path
    const initialExpanded = {};
    items.forEach((item) => {
      if (item.items) {
        const isActive = item.items.some((subItem) => {
          return pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
        });
        if (isActive) {
          initialExpanded[item.href] = true;
        }
      }
    });
    return initialExpanded;
  });

  const toggleExpanded = (href) => {
    setExpandedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const renderIcon = (iconName) => {
    // This is a simplified version - you should use actual icons from your icon library
    return (
      <span className="mr-3 flex h-5 w-5 items-center justify-center">
        {iconName === 'LayoutDashboard' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        )}
        {iconName === 'BookOpen' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        )}
        {iconName === 'ClipboardList' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <line x1="9" y1="12" x2="15" y2="12"></line>
            <line x1="9" y1="16" x2="15" y2="16"></line>
          </svg>
        )}
        {iconName === 'Calendar' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        )}
        {iconName === 'Users' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        )}
        {iconName === 'BarChart3' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10"></path>
            <path d="M12 20V4"></path>
            <path d="M6 20v-6"></path>
          </svg>
        )}
        {iconName === 'Settings' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.4.7.4 1.5 0 2.2z"></path>
          </svg>
        )}
      </span>
    );
  };

  return (
    <div className={cn('flex flex-col space-y-1 p-4', className)} {...props}>
      <div className="flex items-center justify-between px-4 py-3 mb-4">
        <h2 className="text-lg font-semibold">Mindora Admin</h2>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <div key={item.href} className="space-y-1">
            {item.items ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-between font-normal',
                    (pathname === item.href ||
                      item.items.some(
                        (subItem) =>
                          pathname === subItem.href ||
                          pathname.startsWith(`${subItem.href}/`)
                      )) &&
                      'bg-accent text-accent-foreground'
                  )}
                  onClick={() => toggleExpanded(item.href)}
                >
                  <div className="flex items-center">
                    {item.icon && renderIcon(item.icon)}
                    <span>{item.title}</span>
                  </div>
                  {expandedItems[item.href] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {expandedItems[item.href] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground',
                          pathname === subItem.href ||
                            pathname.startsWith(`${subItem.href}/`)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                  'justify-start'
                )}
              >
                {item.icon && renderIcon(item.icon)}
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
