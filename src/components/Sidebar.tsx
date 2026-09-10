import Link from "next/link";
import { LayoutDashboard, FileText, Settings, Camera } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">BillScan</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/scan" className="flex items-center px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
          <Camera className="mr-3 h-5 w-5" />
          Scan New Bill
        </Link>
        <Link href="/history" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
          <FileText className="mr-3 h-5 w-5" />
          Bill History
        </Link>
        <Link href="/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
      </nav>
    </div>
  );
}
