import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { AlertCircle } from 'lucide-react';
import LivePreview from '../components/preview/LivePreview';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Strip /api from the end for direct redirect links if needed, 
// or ensure redirect links include the base domain.
const REDIRECT_BASE = API_BASE.replace('/api', '');

export default function PublicProfile() {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/profile/${username}`);
                setProfile(res.data.profile);
            } catch (err) {
                setError("User not found or server error");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    const settings = useMemo(() => profile?.appearance || {}, [profile]);

    const trackedProfile = useMemo(() => {
        if (!profile) return null;
        const trackedLinks = (profile.links || []).map(link => ({
            ...link,
            url: link.id ? `${REDIRECT_BASE}/l/${link.id}` : link.url
        }));
        return { ...profile, links: trackedLinks };
    }, [profile]);

    const pageStyle = useMemo(() => {
        const style = {
            backgroundColor: '#f3f3f1',
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            transition: 'background 0.5s ease'
        };

        if (settings.wallpaperStyle === 'obsidian-gold') {
            style.background = 'radial-gradient(circle at center, #1a1408 0%, #000000 100%)';
        } else if (settings.wallpaperStyle === 'jewelry-lux') {
            style.background = 'radial-gradient(circle at center, #1E120A 0%, #0D0805 100%)';
        } else if (settings.wallpaperStyle === 'gradient') {
            style.background = `linear-gradient(to bottom, #FFFFFF, ${settings.backgroundColor || '#f3f3f1'})`;
        }

        return style;
    }, [settings]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f3f3f1]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Profile Not Found</h2>
                <p className="text-gray-600 mt-2">The user @{username} does not exist.</p>
            </div>
        );
    }

    return (
        <div style={pageStyle} className="public-profile-shell">
            <div className="w-full max-w-[580px] h-auto md:rounded-[3.5rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="w-full h-full md:rounded-[3.5rem] overflow-hidden">
                    <LivePreview settings={settings} profile={trackedProfile} />
                </div>
            </div>
        </div>
    );
}
