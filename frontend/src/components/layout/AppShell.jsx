import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogIn, LogOut, User } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import useAuthStore from '../../store/authStore';

export default function AppShell({ onLoginClick }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[var(--header-height)] flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] hidden sm:block">
              <span className="font-nepali">पौड्याल कुल वंशावली</span>
              <span className="mx-2 text-[var(--color-border)]">|</span>
              Paudyal Family Lineage
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                  <User size={14} className="inline mr-1" />
                  {user?.username}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <LogIn size={14} />
                Admin Login
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--color-surface-secondary)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
