'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiAward, FiZap, FiUsers, FiBarChart2, FiSettings, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/gamification',
    icon: <FiBarChart2 className="w-5 h-5" />,
  },
  {
    name: 'Badges',
    href: '/admin/gamification/badges',
    icon: <FiAward className="w-5 h-5" />,
  },
  {
    name: 'Challenges',
    href: '/admin/gamification/challenges',
    icon: <FiZap className="w-5 h-5" />,
  },
  {
    name: 'Award Badges',
    href: '/admin/gamification/awards',
    icon: <FiAward className="w-5 h-5" />,
  },
  {
    name: 'User Progress',
    href: '/admin/gamification/users',
    icon: <FiUsers className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    href: '/admin/gamification/settings',
    icon: <FiSettings className="w-5 h-5" />,
  },
];

export default function GamificationAdminLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (name) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="block h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-center h-16 px-6 bg-indigo-600">
          <h1 className="text-xl font-bold text-white">Gamification Admin</h1>
        </div>
        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuOpen = openSubmenus[item.name];

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (hasSubmenu) {
                        e.preventDefault();
                        toggleSubmenu(item.name);
                      }
                    }}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {hasSubmenu && (
                      <span className="ml-2">
                        {isSubmenuOpen ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    )}
                  </Link>
                  
                  {hasSubmenu && isSubmenuOpen && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.name}>
                          <Link
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm rounded-lg ${
                              pathname === subItem.href
                                ? 'text-indigo-700 bg-indigo-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
