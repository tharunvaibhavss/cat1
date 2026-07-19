'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import { 
  LayoutDashboard, 
  Cpu, 
  FileText, 
  Users, 
  LogOut, 
  Wrench, 
  Activity, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, activeRole, switchRole, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Define navigation items based on active role permissions
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Maintenance Engineer', 'Operator', 'Supervisor'] },
    { name: 'Machine Fleet', href: '/dashboard/machines', icon: Cpu, roles: ['Administrator', 'Maintenance Engineer', 'Operator', 'Supervisor'] },
    { name: 'Diagnostic Bench', href: '/dashboard/diagnostics', icon: Wrench, roles: ['Administrator', 'Maintenance Engineer', 'Operator'] },
    { name: 'PDF Reports', href: '/dashboard/reports', icon: FileText, roles: ['Administrator', 'Maintenance Engineer', 'Supervisor'] },
    { name: 'User Management', href: '/dashboard/users', icon: Users, roles: ['Administrator'] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(activeRole || ''));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* ----------------- SIDEBAR (DESKTOP) ----------------- */}
      <aside className="hidden md:flex md:flex-col md:w-64 sidebar-dark border-r border-gray-800 flex-shrink-0">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-black border-b border-gray-900">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-black text-black text-lg">
              CAT
            </div>
            <span className="font-extrabold text-sm tracking-widest text-white">DIAGNOSTICS</span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'sidebar-active-link font-bold'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Account */}
        <div className="p-4 border-t border-gray-800 bg-[#151515]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-full text-primary">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{user?.employee_id}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-800 transition-colors"
              title="Logout from terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MOBILE SIDEBAR DIALOG ----------------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-xs sidebar-dark border-r border-gray-800 h-full z-50">
            <div className="flex items-center justify-between h-16 px-6 bg-black">
              <span className="font-extrabold text-sm tracking-widest text-primary">CAT DIAGNOSTICS</span>
              <button onClick={() => setMobileOpen(false)} className="text-white hover:text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-md ${
                      isActive
                        ? 'sidebar-active-link font-bold'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-800 bg-[#151515] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-white">{user?.username}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{user?.employee_id}</p>
                </div>
              </div>
              <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-800">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ----------------- MAIN WORKSPACE CONTENT AREA ----------------- */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="p-1 -ml-1 text-gray-500 rounded-md md:hidden hover:text-gray-900 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center space-x-3 text-sm font-medium text-gray-500">
              <Activity className="w-4 h-4 text-primary-dark" />
              <span>Diagnostic System Gateway</span>
            </div>
          </div>

          {/* User Session & Dynamic Role Switcher (RBAC Tester) */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className={`flex items-center bg-gray-100 border border-gray-300 rounded-md p-1 shadow-sm ${user.role === 'Administrator' ? 'pr-3' : 'pr-1'}`}>
                <div className="flex items-center px-3 py-1 bg-industrial-dark text-white rounded text-xs font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  ROLE: {activeRole}
                </div>
                
                {/* Role Switcher Dropdown only accessible to Administrator */}
                {user.role === 'Administrator' && (
                  <select
                    value={activeRole || ''}
                    onChange={(e) => switchRole(e.target.value)}
                    className="text-xs font-semibold bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ml-2 cursor-pointer"
                    title="Dynamic RBAC Switcher (Prototype utility)"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Maintenance Engineer">Maintenance Engineer</option>
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Scrolling View */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
