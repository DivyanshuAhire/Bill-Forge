"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  UsersIcon, 
  ArchiveBoxIcon, 
  Cog6ToothIcon, 
  DocumentPlusIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Invoices", href: "/", icon: HomeIcon },
    { name: "Create Invoice", href: "/create", icon: DocumentPlusIcon },
    { name: "Products", href: "/products", icon: ArchiveBoxIcon },
    { name: "Clients", href: "/clients", icon: UsersIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col relative">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 truncate" title={companyName}>
          {companyName}
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400 group-hover:text-red-700" />
          Logout
        </button>
      </div>
    </div>
  );
}
