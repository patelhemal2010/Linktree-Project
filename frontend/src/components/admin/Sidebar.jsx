import React, { useState } from 'react';
import {
    Users,
    BarChart2,
    Layout,
    Settings,
    Zap,
    Share2,
    Layers,
    MessageSquare,
    Link as LinkIcon,
    Lightbulb,
    TreeDeciduous,
    MoreHorizontal
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
    const location = useLocation();
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || { username: 'user', name: 'User' };
        } catch (e) {
            return { username: 'user', name: 'User' };
        }
    });

    React.useEffect(() => {
        const syncUser = () => {
            try {
                const newUser = JSON.parse(localStorage.getItem('user'));
                if (newUser) setUser(newUser);
            } catch (e) {
                console.error("Failed to sync user", e);
            }
        };
        window.addEventListener('auth-change', syncUser);
        return () => window.removeEventListener('auth-change', syncUser);
    }, []);

    const isActive = (path) => {
        // Basic active check
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const NavItem = ({ icon: Icon, label, to, badge }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${isActive(to)
                ? 'bg-gray-200 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <Icon size={20} className={isActive(to) ? 'text-gray-900' : 'text-gray-500'} />
            <span className="flex-1">{label}</span>
            {badge && <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-purple-100 italic">Coming soon</span>}
        </Link>
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col hidden md:flex">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="text-2xl">🌳</span> My Linktree
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {/* Main Nav */}
                <div className="mb-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</h3>
                    <NavItem icon={Layers} label="My Linktrees" to="/dashboard" />
                </div>

            </div>
        </aside>
    );
}
