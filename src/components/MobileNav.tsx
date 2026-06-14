"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  HomeIcon,
  DocumentPlusIcon,
  ArchiveBoxIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { name: "Invoices", href: "/", icon: HomeIcon },
    { name: "Create Invoice", href: "/create", icon: DocumentPlusIcon },
    { name: "Products", href: "/products", icon: ArchiveBoxIcon },
    { name: "Clients", href: "/clients", icon: UsersIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];
  return (
    <>
      {/* Hamburger button visible on small screens */}
      <button
        className="fixed top-4 left-8 z-50 md:hidden text-gray-600"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-4">
            <button
              className="mb-4 text-gray-600"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-2 py-2 px-2 rounded ${isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {/* Bottom navigation bar for small screens */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden relative">
        <ul className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center text-sm ${isActive ? "text-blue-600" : "text-gray-600"}`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
