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
      {/* Hamburger menu removed; only bottom navbar retained */}
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
