'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Home,
  PlusCircle,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Link2,
  MessageSquare,
  Image,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  User,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Create Post', href: '/dashboard/create', icon: PlusCircle },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Link2 },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Media Library', href: '/dashboard/media', icon: Image },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 lg:hidden bg-gray-900 bg-opacity-50" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`}>
          
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {sidebarOpen && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">AllIN</span>
              </div>
            )}
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft className={`h-5 w-5 transform transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-8 px-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {sidebarOpen && item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout */}
          {sidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'Member'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2 p-1.5"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          {/* Top navigation */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  
                  <div className="hidden lg:flex lg:items-center lg:space-x-4">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-500">
                    <Search className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}