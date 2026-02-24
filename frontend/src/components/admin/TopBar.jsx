import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Bell, Search, Star, MessageSquare } from 'lucide-react';

export default function TopBar() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || { username: 'user', name: 'User' };
        } catch (e) {
            return { username: 'user', name: 'User' };
        }
    });

    const handleSearchChange = (e) => {
        const query = e.target.value;
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
        navigate('/login');
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        const syncUser = () => {
            try {
                const newUser = JSON.parse(localStorage.getItem('user'));
                if (newUser) setUser(newUser);
            } catch (e) {
                console.error("Failed to sync user", e);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('auth-change', syncUser);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('auth-change', syncUser);
        };
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
            {/* Left: Spacer since logo moved to sidebar */}
            <div className="flex items-center gap-4 w-64 md:hidden">
                <Link to="/dashboard" className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    🌳 My Linktree
                </Link>
            </div>
            <div className="hidden md:block w-0"></div>

            {/* Center: Search/Upgrade (optional, matching style broadly) */}
            <div className="flex-1 max-w-xl mx-auto hidden md:block px-8">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search your Linktrees..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <div className="relative ml-2" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-9 h-9 bg-purple-100 rounded-full overflow-hidden border border-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center text-purple-600 font-bold text-xs relative"
                    >
                        <div className="w-full h-full items-center justify-center flex">
                            {(user.name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                        </div>
                        {user.profile_image && (
                            <img
                                src={user.profile_image}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="Profile"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                    </button>
                    {/* Dropdown menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 transition-all transform origin-top-right z-50">
                            <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Account</a>
                            <hr className="my-1 border-gray-100" />
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
