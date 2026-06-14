"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  DocumentPlusIcon,
  ArchiveBoxIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function MobileNav() {
  const pathname = usePathname();
  const navItems = [
    { name: "Invoices", href: "/", icon: HomeIcon },
    { name: "Create Invoice", href: "/create", icon: DocumentPlusIcon },
    { name: "Products", href: "/products", icon: ArchiveBoxIcon },
    { name: "Clients", href: "/clients", icon: UsersIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];
  return (
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
      {/* Black Box in left bottom corner */}
      <div className="absolute left-2 bottom-2 bg-black text-white px-2 py-1 rounded">Black Box</div>
    </nav>
  );
}
