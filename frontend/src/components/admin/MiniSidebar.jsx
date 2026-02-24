import React from 'react';
import { Layers, PenTool, User, LayoutGrid } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';

export default function MiniSidebar() {
    const location = useLocation();
    const { profileId } = useParams();

    const NavItem = ({ icon: Icon, label, to }) => (
        <Link
            to={to}
            className={`flex flex-col items-center justify-center w-full py-4 text-xs font-medium transition-colors gap-1 ${location.pathname === to
                ? 'text-gray-900 bg-gray-100 border-l-2 border-black'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <Icon size={24} strokeWidth={1.5} />
            <span>{label}</span>
        </Link>
    );

    return (
        <aside className="w-20 bg-white border-r border-gray-200 h-screen flex flex-col items-center fixed left-0 top-0 z-50">
            <div className="w-full mt-4">
                <NavItem icon={LayoutGrid} label="Dashboard" to="/dashboard" />
            </div>

            <nav className="flex-1 w-full flex flex-col gap-1 mt-2">
                <NavItem icon={Layers} label="Links" to={profileId ? `/dashboard/${profileId}/links` : "/dashboard/links"} />
                <NavItem icon={PenTool} label="Appearance" to={profileId ? `/dashboard/${profileId}/appearance` : "/dashboard/appearance"} />
            </nav>

            <div className="mt-auto w-full pb-4 flex flex-col gap-1">
                <button className="flex flex-col items-center justify-center w-full py-4 text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                    <User size={24} strokeWidth={1.5} />
                </button>
            </div>
        </aside>
    );
}
