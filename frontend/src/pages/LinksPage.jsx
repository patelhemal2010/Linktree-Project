import React, { useState, useEffect } from 'react';
import MiniSidebar from '../components/admin/MiniSidebar';
import LinkManager from '../components/admin/LinkManager';
import { Share, ExternalLink, Zap } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function LinksPage() {
    const { profileId } = useParams();
    const [profile, setProfile] = useState(null);
    const [previewKey, setPreviewKey] = useState(Date.now());
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'user', name: 'User' };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We'll use a new endpoint or just filter profiles on frontend if needed, 
                // but better yet, use the getUserProfiles and find the one.
                const res = await api.get('/profile/all/me');
                const currentProfile = res.data.profiles.find(p => p.id == profileId);
                setProfile(currentProfile);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, [profileId]);

    const refreshPreview = () => setPreviewKey(Date.now());

    if (!profile) return <div className="p-20 text-center">Loading profile...</div>;

    const slug = profile.slug;

    return (
        <div className="flex h-screen bg-white">
            {/* 1. Sidebar (Fixed) */}
            <MiniSidebar />
            <div className="w-20 flex-shrink-0" /> {/* Spacer */}

            {/* 2. Main Content (Scrollable) */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50/30">

                {/* Header / Tabs */}
                <div className="bg-white px-8 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex gap-8">
                        <button className="text-sm font-bold text-gray-900 border-b-2 border-black pb-4 hover:opacity-75 transition-opacity">Links</button>
                        <Link to={`/dashboard/${profileId}/appearance`} className="text-sm font-medium text-gray-500 pb-4 hover:text-gray-900 transition-colors border-b-2 border-transparent hover:border-gray-200">Appearance</Link>
                    </div>

                    <a
                        href={`/u/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-all hidden sm:flex border border-gray-200/50"
                    >
                        <span className="font-medium">{`linktr.ee/${slug}`}</span>
                        <ExternalLink size={14} className="text-gray-400" />
                    </a>
                </div>

                {/* Action Bar (Add Link / Enhance) */}
                <div className="max-w-3xl w-full mx-auto px-6 py-8">

                    {/* Giant Add Button / Component */}
                    <div className="mb-8">
                        {/* The LinkManager we built earlier fits perfectly here */}
                        <LinkManager onUpdate={refreshPreview} profileId={profileId} />
                    </div>
                </div>
            </main>

            {/* 3. Preview Panel (Fixed Right) */}
            <aside className="w-[400px] border-l border-gray-200 bg-white h-screen hidden xl:flex flex-col items-center justify-center relative p-8">
                <div className="absolute top-4 right-4 z-40">
                    <a href={`/u/${slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                        <ExternalLink size={20} />
                    </a>
                </div>

                {/* Phone Frame */}
                <div className="w-[300px] h-[600px] bg-black rounded-[45px] p-3 shadow-2xl border-[6px] border-gray-800 relative">
                    {/* Notch/Camera Area */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-20"></div>

                    <div className="w-full h-full bg-white rounded-[35px] overflow-hidden relative">
                        <iframe
                            src={`/u/${slug}?t=${previewKey}`}
                            className="w-full h-[120%] border-none pointer-events-none select-none transform scale-[0.83] origin-top bg-white"
                            title="Preview"
                            scrolling="no"
                        />
                        {/* Overlay to prevent clicks in preview */}
                        <div className="absolute inset-0 z-10 bg-transparent"></div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
