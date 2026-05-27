"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  X
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Products", href: "/products", icon: Package },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    // Basic logout - in a real app you'd hit an API to clear cookies
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col shadow-2xl md:shadow-none">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">BillForge</h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-white w-full rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
