import React, { useState, useEffect, useRef } from 'react';
import LivePreview from '../components/preview/LivePreview';
import MiniSidebar from '../components/admin/MiniSidebar';
import {
    Share, ExternalLink, Zap, Plus, User, Image as ImageIcon, Type,
    MousePointer2, Palette, LayoutTemplate, PenTool, Video, Lock,
    ChevronDown, Grid, Trash2, X, Sparkles, Upload, MapPin, Star
} from 'lucide-react';
import api from '../api/client';
import { useParams, Link } from 'react-router-dom';

// Simple Toggle Component
const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
);

// Color Picker Component
const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 uppercase">{value}</span>
            <div className="relative">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
                />
                <div
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                    style={{ backgroundColor: value }}
                />
            </div>
        </div>
    </div>
);

const blobUrlToBase64 = async (url) => {
    if (!url || !url.startsWith('blob:')) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Blob conversion failed", e);
        return null;
    }
};


export default function AppearancePage() {
    const { profileId } = useParams();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { username: 'user', name: 'User' });
    const [activeSection, setActiveSection] = useState('header');
    const [activeThemeTab, setActiveThemeTab] = useState('customizable');
    const [isDirty, setIsDirty] = useState(false);
    const [profile, setProfile] = useState({});
    const [showImageModal, setShowImageModal] = useState(false);
    const fileInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const wallpaperInputRef = useRef(null);

    // Consolidated settings state
    const [settings, setSettings] = useState({
        // Header
        layout: 'classic',
        titleStyle: 'text',
        size: 'small',
        altFont: false,
        bio: '',
        title: '',
        tagline: '',
        locations: '',
        logoImage: null,

        // Theme
        theme: 'custom',

        // Wallpaper
        wallpaperStyle: 'fill', // fill, gradient, blur, pattern, image, video
        backgroundColor: '#000000',
        wallpaperImage: null,

        // Text
        font: 'Link Sans',
        pageTextColor: '#FFFFFF',
        titleColor: '#FFFFFF',

        // Buttons
        buttonStyle: 'solid', // solid, glass, outline
        buttonRoundness: 'rounder', // square, round, rounder, full
        buttonShadow: 'none', // none, soft, strong, hard
        buttonColor: '#FFFFFF20',
        buttonTextColor: '#FFFFFF',

        // Footer
        hideFooter: false,

        // Widgets
        goldWidget: {
            enabled: false,
            autoUpdate: true,
            currency: 'INR',
            title: "TODAY'S GOLD RATE",
            titleColor: '#D4AF37',
            subtitleColor: '#6B7280',
            labelColor: '#9CA3AF',
            valueColor: '#D4AF37',
            date: "20th Feb, 2026",
            rates: [
                { label: '18KT', value: '11640/GM' },
                { label: '22KT', value: '14227/GM' },
                { label: '24KT', value: '15520/GM' },
                { label: 'SILVER', value: '248/GM' },
                { label: 'PLATINUM', value: '7300/GM' }
            ],
            footer: "RATES ARE NOT FIXED FOR THE DAY AND MAY CHANGE AT ANY TIME"
        },
        mapWidget: {
            enabled: false,
            multiLocation: true,
            title: 'Patel Jewellers Mehsanawala',
            query: 'Patel Jewellers Mehsanawala, Radhanpur Cir, beside Dr t. l. Patel hospital, Radhanpur Road, Mehsana, Gujarat 384002, India',
            title2: 'Patel Jewellers Palanpur',
            query2: 'Patel Jewellers, Palanpur',
        }
    });

    useEffect(() => {
        // Fetch existing profile data
        const fetchData = async () => {
            try {
                const res = await api.get('/profile/all/me');
                const profData = res.data.profiles.find(p => p.id == profileId);

                if (!profData) {
                    setLoading(false);
                    return;
                }

                setProfile(profData);
                setSettings(prev => {
                    const merged = {
                        ...prev,
                        bio: profData.bio || '',
                        ...(profData.appearance_settings || {})
                    };
                    // Deep merge goldWidget to ensure we don't lose default rates/keys
                    if (profData.appearance_settings?.goldWidget) {
                        merged.goldWidget = {
                            ...prev.goldWidget,
                            ...profData.appearance_settings.goldWidget
                        };
                    }
                    return merged;
                });
                setIsDirty(false);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [profileId]);

    const handleSettingChange = (key, value) => {
        if (key === 'theme') {
            const themePresets = {
                air: { backgroundColor: '#FFFFFF', pageTextColor: '#000000', buttonColor: '#F3F4F6', buttonTextColor: '#000000', buttonStyle: 'solid', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#000000' },
                moon: { backgroundColor: '#000000', pageTextColor: '#FFFFFF', buttonColor: '#1F2937', buttonTextColor: '#FFFFFF', buttonStyle: 'solid', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#FFFFFF' },
                agate: { backgroundColor: '#10b981', pageTextColor: '#FFFFFF', buttonColor: '#ffffff20', buttonTextColor: '#FFFFFF', buttonStyle: 'glass', buttonRoundness: 'full', wallpaperStyle: 'gradient', titleColor: '#FFFFFF' },
                lake: { backgroundColor: '#1e293b', pageTextColor: '#FFFFFF', buttonColor: '#0f172a', buttonTextColor: '#FFFFFF', buttonStyle: 'solid', buttonRoundness: 'square', wallpaperStyle: 'fill', titleColor: '#FFFFFF' },
                billie: { backgroundColor: '#000000', pageTextColor: '#00ffcc', buttonColor: '#000000', buttonTextColor: '#00ffcc', buttonStyle: 'outline', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#00ffcc' },
                olivia: { backgroundColor: '#5b21b6', pageTextColor: '#FFFFFF', buttonColor: '#ffffff20', buttonTextColor: '#FFFFFF', buttonStyle: 'glass', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#FFFFFF' },
                selena: { backgroundColor: '#fdf2f8', pageTextColor: '#000000', buttonColor: '#ec4899', buttonTextColor: '#FFFFFF', buttonStyle: 'solid', buttonRoundness: 'full', wallpaperStyle: 'fill', titleColor: '#db2777' },
                maroon: { backgroundColor: '#FFFFFF', pageTextColor: '#1a1a1a', buttonColor: '#FFFFFF', buttonTextColor: '#1a1a1a', buttonStyle: 'outline', buttonRoundness: 'full', wallpaperStyle: 'fill', titleColor: '#800000' },
                daniel: { backgroundColor: '#4338ca', pageTextColor: '#ffffff', buttonColor: '#ffffff20', buttonTextColor: '#ffffff', buttonStyle: 'glass', buttonRoundness: 'rounder', wallpaperStyle: 'gradient', titleColor: '#ffffff' },
                luke: { backgroundColor: '#e0f2fe', pageTextColor: '#3b82f6', buttonColor: '#ffffffff', buttonTextColor: '#3b82f6', buttonStyle: 'solid', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#1d4ed8' },
                starry: { backgroundColor: '#0f172a', pageTextColor: '#e2e8f0', buttonColor: '#1e293b', buttonTextColor: '#e2e8f0', buttonStyle: 'outline', buttonRoundness: 'rounder', wallpaperStyle: 'fill', titleColor: '#f1f5f9' }
            };
            if (themePresets[value]) {
                setSettings(prev => ({ ...prev, ...themePresets[value], theme: value }));
                setIsDirty(true);
                return;
            }
        }
        setSettings(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleGoldWidgetChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            goldWidget: { ...prev.goldWidget, [key]: value }
        }));
        setIsDirty(true);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUser(prev => ({ ...prev, profile_image: imageUrl })); // Memory only
            setProfile(prev => ({ ...prev, profile_image: imageUrl }));
            setShowImageModal(false);
            setIsDirty(true);
        }
    };

    const handleRemoveImage = () => {
        setUser(prev => ({ ...prev, profile_image: null }));
        setProfile(prev => ({ ...prev, profile_image: null }));
        setShowImageModal(false);
        setIsDirty(true);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSettings(prev => ({ ...prev, logoImage: imageUrl }));
            setIsDirty(true);
        }
    };

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logoImage: null }));
        setIsDirty(true);
    };

    const handleWallpaperUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSettings(prev => ({ ...prev, wallpaperImage: imageUrl, wallpaperStyle: 'image' }));
            setIsDirty(true);
        }
    };

    const handleRemoveWallpaper = () => {
        setSettings(prev => ({ ...prev, wallpaperImage: null, wallpaperStyle: 'fill' }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            // Process Logo Image
            let logoBase64 = settings.logoImage;
            if (settings.logoImage && settings.logoImage.startsWith('blob:')) {
                logoBase64 = await blobUrlToBase64(settings.logoImage);
            }

            // Process Wallpaper Image
            let wallpaperBase64 = settings.wallpaperImage;
            if (settings.wallpaperImage && settings.wallpaperImage.startsWith('blob:')) {
                wallpaperBase64 = await blobUrlToBase64(settings.wallpaperImage);
            }

            // Process Profile Image
            let profileImageToSend = null;
            if (user.profile_image && user.profile_image.startsWith('blob:')) {
                profileImageToSend = await blobUrlToBase64(user.profile_image);
            }

            const settingsToSave = {
                ...settings,
                logoImage: logoBase64,
                wallpaperImage: wallpaperBase64
            };

            const payload = {
                settings: settingsToSave,
                bio: settings.bio,
                profile_id: profileId
            };

            if (profileImageToSend) {
                payload.profile_image = profileImageToSend;
            }

            const res = await api.put('/profile/update', payload);
            alert('Settings saved successfully!');

            // Sync permanent storage with server response
            if (res.data.user) {
                // Update local user data but ONLY non-profile-specific fields if necessary
                // Traditionally we might update the name, but profile_image is now page-specific
                const updatedUser = { ...user };
                if (res.data.user.name) updatedUser.name = res.data.user.name;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            setIsDirty(false);

        } catch (err) {
            console.error("Failed to save", err);
            alert('Failed to save settings. Please try again.');
        }
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to discard unsaved changes?')) {
            window.location.reload();
        }
    };

    // Navigation Items
    const navItems = [
        { id: 'header', icon: User, label: 'Header' },
        { id: 'theme', icon: LayoutTemplate, label: 'Theme' },
        { id: 'wallpaper', icon: ImageIcon, label: 'Wallpaper' },
        { id: 'text', icon: Type, label: 'Text' },
        { id: 'buttons', icon: MousePointer2, label: 'Buttons' },
        { id: 'colors', icon: Palette, label: 'Colors' },
        { id: 'widgets', icon: Sparkles, label: 'Widgets' },
        { id: 'footer', icon: Grid, label: 'Footer' }, // Using Grid icon as placeholder for Footer
    ];

    // ------ CHILD COMPONENTS ------

    const renderHeaderSection = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold mb-6 text-gray-900">Profile image</h2>
                <div className="flex items-center gap-6">
                    <div
                        onClick={() => setShowImageModal(true)}
                        className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden relative group cursor-pointer transition-all hover:border-gray-300"
                    >
                        {profile?.profile_image ? (
                            <img src={profile.profile_image} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            (profile?.slug?.[0] || 'U').toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">Change</div>
                    </div>
                    <button
                        onClick={() => setShowImageModal(true)}
                        className="px-6 py-2.5 bg-[#4D45E4] text-white rounded-full font-bold text-sm hover:bg-[#3b35b9] transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> {user.profile_image ? 'Change' : 'Add'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            </div>

            {/* Image Picker Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImageModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-900">Profile Image</h3>
                            <button onClick={() => setShowImageModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                    <ImageIcon size={20} className="text-gray-900" />
                                </div>
                                <span className="font-semibold text-gray-700">Select image or GIF</span>
                            </button>

                            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                    <Sparkles size={20} className="text-gray-900" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-700">Restyle your image with AI</span>
                                    {/* <span className="text-xs text-gray-400 font-medium">Coming soon</span> */}
                                </div>
                                <Zap size={14} className="ml-auto text-gray-400" />
                            </button>

                            {user.profile_image && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors text-left group mt-2"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                        <Trash2 size={20} className="text-red-600" />
                                    </div>
                                    <span className="font-semibold text-red-600">Remove current profile image</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Profile image layout</h2>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleSettingChange('layout', 'classic')}
                        className={`flex-1 p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${settings.layout === 'classic' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="w-full py-4 bg-gray-100 rounded-lg flex justify-center">
                            <div className="w-10 h-10 rounded-full border-2 border-gray-400" />
                        </div>
                        <span className="font-semibold text-sm">Classic</span>
                    </button>
                    <button
                        onClick={() => handleSettingChange('layout', 'hero')}
                        className={`flex-1 p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all ${settings.layout === 'hero' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="w-full h-[72px] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="w-full h-full bg-gray-200 absolute top-0 left-0" />
                            <Zap size={12} className="absolute top-2 right-2 text-gray-400" />
                            <div className="w-8 h-8 rounded-full border-2 border-white absolute bottom-[-10px] bg-gray-300" />
                        </div>
                        <span className="font-semibold text-sm">Hero</span>
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Title</h2>
                <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => handleSettingChange('title', e.target.value)}
                    placeholder="Enter profile title"
                    className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-colors font-medium text-gray-900 placeholder-gray-500"
                />
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Bio / Tagline</h2>
                <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => handleSettingChange('tagline', e.target.value)}
                    placeholder="Enter a short tagline"
                    className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-colors font-medium text-gray-900 placeholder-gray-500 mb-4"
                />
                <textarea
                    value={settings.bio || ''}
                    onChange={(e) => handleSettingChange('bio', e.target.value)}
                    placeholder="Enter a bio for your profile"
                    rows={2}
                    className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-colors font-medium text-gray-900 placeholder-gray-500 text-sm"
                />
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Locations</h2>
                <textarea
                    value={settings.locations || ''}
                    onChange={(e) => handleSettingChange('locations', e.target.value)}
                    placeholder="Enter location(s)"
                    rows={2}
                    className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gray-300 focus:ring-0 outline-none transition-colors font-medium text-gray-900 placeholder-gray-500 text-sm"
                />
            </div>

            {/* Title Style */}
            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Title style</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleSettingChange('titleStyle', 'text')}
                        className={`flex-1 h-14 border-2 rounded-xl flex items-center justify-center font-bold text-gray-800 transition-all ${settings.titleStyle === 'text' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                        Aa <span className="text-xs font-normal ml-2 text-gray-500">Text</span>
                    </button>
                    <button
                        onClick={() => handleSettingChange('titleStyle', 'logo')}
                        className={`flex-1 h-14 border-2 rounded-xl flex items-center justify-center text-gray-400 transition-all ${settings.titleStyle === 'logo' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                        <ImageIcon size={20} className="mr-2" /> Logo
                    </button>
                </div>
            </div>

            {settings.titleStyle === 'logo' && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Logo</h3>
                    {settings.logoImage ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-4">
                            <div className="h-20 w-full flex items-center justify-center bg-[url('https://linktr.ee/static/images/transparent-pattern.png')] bg-repeat rounded-lg overflow-hidden border border-gray-200">
                                <img src={settings.logoImage} alt="Logo Preview" className="h-full w-auto object-contain" />
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="flex-1 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={handleRemoveLogo}
                                    className="flex-1 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                <Plus size={20} className="text-gray-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-900">Add a logo</p>
                                <p className="text-xs text-gray-500">Drag and drop or choose logo to upload</p>
                            </div>
                        </button>
                    )}
                    <input
                        type="file"
                        ref={logoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                    />
                </div>
            )}

            {/* Size */}
            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Size</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleSettingChange('size', 'small')}
                        className={`flex-1 h-12 border-2 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${settings.size === 'small' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                        Small
                    </button>
                    <button
                        onClick={() => handleSettingChange('size', 'large')}
                        className={`flex-1 h-12 border-2 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${settings.size === 'large' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                        Large
                    </button>
                </div>
            </div>

            {/* Font Toggles */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Alternative title font</h3>
                        <p className="text-xs text-gray-500">Matches page font by default</p>
                    </div>
                    <Toggle checked={settings.altFont} onChange={(val) => handleSettingChange('altFont', val)} />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-2">Title font color</h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-100 border border-transparent rounded-lg focus-within:bg-white focus-within:border-gray-300 transition-colors w-40">
                            <input
                                type="text"
                                value={settings.titleColor}
                                onChange={(e) => handleSettingChange('titleColor', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-medium p-0 uppercase text-sm"
                                placeholder="#000000"
                            />
                            <div className="relative w-6 h-6 rounded-full border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                                <input
                                    type="color"
                                    value={settings.titleColor}
                                    onChange={(e) => handleSettingChange('titleColor', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                                <div className="w-full h-full" style={{ backgroundColor: settings.titleColor }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderThemeSection = () => (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Themes</h2>
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button onClick={() => setActiveThemeTab('customizable')} className={`pb-3 border-b-2 font-semibold text-sm transition-colors ${activeThemeTab === 'customizable' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Customizable</button>
                <button onClick={() => setActiveThemeTab('curated')} className={`pb-3 border-b-2 font-semibold text-sm transition-colors ${activeThemeTab === 'curated' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Curated</button>
            </div>

            {activeThemeTab === 'customizable' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Custom Theme Card */}
                        <button onClick={() => handleSettingChange('theme', 'custom')} className={`group flex flex-col items-center gap-2 ${settings.theme === 'custom' ? 'ring-2 ring-black rounded-xl' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-gray-100 transition-colors">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm"><PenTool size={20} className="text-gray-600" /></div>
                                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-300 rounded-xl transition-colors pointer-events-none"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Custom</span>
                        </button>

                        {/* Theme Item: Air */}
                        <button
                            onClick={() => handleSettingChange('theme', 'air')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-full aspect-[3/4] rounded-xl border bg-white relative overflow-hidden shadow-sm group-hover:shadow-md transition-all ${settings.theme === 'air' ? 'border-black ring-1 ring-black' : 'border-gray-200'} `}>
                                <div className="p-2 space-y-1.5 pt-4">
                                    <div className="w-12 h-6 bg-gray-100 rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-white border border-gray-100 rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold">Aa</span>
                                    </div>
                                    <div className="w-full h-8 bg-white border border-gray-100 rounded-md"></div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Air</span>
                        </button>

                        {/* Theme Item: Moon */}
                        <button onClick={() => handleSettingChange('theme', 'moon')} className="group flex flex-col items-center gap-2">
                            <div className={`w-full aspect-[3/4] rounded-xl border bg-black relative overflow-hidden shadow-sm group-hover:shadow-md transition-all ${settings.theme === 'moon' ? 'border-black ring-2 ring-offset-2 ring-black' : 'border-gray-200'}`}>
                                <div className="p-2 space-y-1.5 pt-4">
                                    <div className="w-12 h-6 bg-gray-800 rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-gray-900 rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">Aa</span>
                                    </div>
                                    <div className="w-full h-8 bg-gray-900 rounded-md"></div>
                                </div>
                                <div className="absolute top-2 right-2 bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Zap size={8} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Moon</span>
                        </button>

                        {/* Theme Item: Agate */}
                        <button onClick={() => handleSettingChange('theme', 'agate')} className="group flex flex-col items-center gap-2">
                            <div className={`w-full aspect-[3/4] rounded-xl border bg-gradient-to-br from-green-400 to-blue-500 relative overflow-hidden shadow-sm group-hover:shadow-md transition-all ${settings.theme === 'agate' ? 'border-black ring-2 ring-offset-2 ring-black' : 'border-gray-200'}`}>
                                <div className="p-2 space-y-1.5 pt-4 opacity-90">
                                    <div className="w-12 h-6 bg-white/20 backdrop-blur-sm rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-green-900/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                                        <span className="text-[8px] font-bold text-white">Aa</span>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Zap size={8} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Agate</span>
                        </button>

                        {/* Theme Item: Lake */}
                        <button onClick={() => handleSettingChange('theme', 'lake')} className="group flex flex-col items-center gap-2">
                            <div className={`w-full aspect-[3/4] rounded-xl border bg-[#1e293b] relative overflow-hidden shadow-sm group-hover:shadow-md transition-all ${settings.theme === 'lake' ? 'border-black ring-2 ring-offset-2 ring-black' : 'border-gray-200'}`}>
                                <div className="p-2 space-y-1.5 pt-4">
                                    <div className="w-12 h-6 bg-white/10 rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-[#0f172a] border border-white/10 rounded-[4px] flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">Aa</span>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Zap size={8} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Lake</span>
                        </button>

                        {/* Theme Item: Maroon (Jeweler) */}
                        <button onClick={() => handleSettingChange('theme', 'maroon')} className="group flex flex-col items-center gap-2">
                            <div className={`w-full aspect-[3/4] rounded-xl border bg-white relative overflow-hidden shadow-sm group-hover:shadow-md transition-all ${settings.theme === 'maroon' ? 'border-[#800000] ring-2 ring-offset-2 ring-[#800000]' : 'border-gray-200'}`}>
                                <div className="p-2 space-y-1.5 pt-4">
                                    <div className="w-12 h-6 bg-gray-50 rounded-md mx-auto border border-gray-100"></div>
                                    <div className="w-full h-8 bg-white border border-[#800000]/20 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-[#800000]">Aa</span>
                                    </div>
                                    <div className="w-full h-8 bg-white border border-[#800000]/20 rounded-full flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-[#800000]">Aa</span>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-[#800000] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                    <Sparkles size={8} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Maroon</span>
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-xl flex items-center gap-4 border border-gray-200">
                        <div className="p-2 bg-green-100 text-green-700 rounded-full">
                            <LayoutTemplate size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Create your own</h4>
                            <p className="text-xs text-gray-500">Design a custom theme from scratch</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors">
                            Create
                        </button>
                    </div>
                </>
            )}

            {/* CURATED THEMES */}
            {activeThemeTab === 'curated' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Billie Eilish */}
                        <button onClick={() => handleSettingChange('theme', 'billie')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'billie' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-black relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                <div className="p-2 space-y-1.5 pt-4">
                                    <div className="w-12 h-6 bg-[#00ffcc] rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-black border border-[#00ffcc] rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-[#00ffcc]">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center">Billie Eilish</span>
                        </button>

                        {/* Daniel Triendl */}
                        <button onClick={() => handleSettingChange('theme', 'daniel')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'daniel' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-indigo-900 relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500 opacity-60"></div>
                                <div className="p-2 space-y-1.5 pt-4 relative z-10">
                                    <div className="w-12 h-6 bg-white/30 backdrop-blur rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-white/20 backdrop-blur rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center">Daniel Triendl</span>
                        </button>

                        {/* Luke John Matthew Arnold */}
                        <button onClick={() => handleSettingChange('theme', 'luke')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'luke' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-[#e0f2fe] relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                {/* Simple pattern simulation */}
                                <div className="absolute w-6 h-6 rounded-full bg-red-400 top-2 left-2 opacity-50"></div>
                                <div className="absolute w-8 h-8 rotate-45 bg-yellow-400 bottom-4 right-2 opacity-50"></div>
                                <div className="p-2 space-y-1.5 pt-4 relative z-10">
                                    <div className="w-12 h-6 bg-white rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-white rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-blue-500">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center leading-tight">Luke John Matthew Arnold</span>
                        </button>

                        {/* Olivia Rodrigo */}
                        <button onClick={() => handleSettingChange('theme', 'olivia')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'olivia' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-[#5b21b6] relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                <div className="p-2 space-y-1.5 pt-4 relative z-10">
                                    <div className="w-12 h-6 bg-purple-400 rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-white rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-[#5b21b6]">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center">Olivia Rodrigo</span>
                        </button>

                        {/* Selena + benny */}
                        <button onClick={() => handleSettingChange('theme', 'selena')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'selena' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-pink-100 relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                {/* Image placeholder */}
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fHBvcnRyYWl0JTIwcGlua3xlbnwwfHwwfHx8MA%3D%3D')] bg-cover bg-center opacity-80"></div>
                                <div className="p-2 space-y-1.5 pt-4 relative z-10">
                                    <div className="w-12 h-6 bg-white/60 backdrop-blur rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-pink-500/80 backdrop-blur text-white rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center">Selena + benny</span>
                        </button>

                        {/* Starry Night */}
                        <button onClick={() => handleSettingChange('theme', 'starry')} className={`group flex flex-col items-center gap-2 p-1 rounded-xl transition-all ${settings.theme === 'starry' ? 'ring-2 ring-black' : ''}`}>
                            <div className="w-full aspect-[3/4] rounded-xl border border-gray-200 bg-[#0f172a] relative overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                <div className="absolute top-4 left-4 w-1 h-1 bg-white rounded-full"></div>
                                <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full"></div>
                                <div className="absolute bottom-12 left-8 w-1 h-1 bg-white rounded-full"></div>
                                <div className="p-2 space-y-1.5 pt-4 relative z-10">
                                    <div className="w-12 h-6 bg-white/20 rounded-md mx-auto"></div>
                                    <div className="w-full h-8 bg-[#1e293b] border border-gray-700/50 rounded-md flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">Aa</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 text-center">Starry Night</span>
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="mt-8 p-4 bg-[#eff6ff] border border-[#dbeafe] rounded-lg flex gap-3 text-[#1e40af]">
                        <div className="shrink-0 pt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-sm">Curated themes are made in collaboration with creators and cannot be customized.</p>
                    </div>
                </>
            )}
        </div>
    );

    const renderWallpaperSection = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold mb-6 text-gray-900">Wallpaper style</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { id: 'fill', label: 'Fill', color: 'bg-black' },
                        { id: 'gradient', label: 'Gradient', color: 'bg-gradient-to-b from-gray-700 to-black' },
                        { id: 'jewelry-lux', label: 'Showroom', color: 'bg-[radial-gradient(circle_at_top,#1E120A_0%,#0D0805_100%)]' },
                        { id: 'obsidian-gold', label: 'Obsidian Gold', color: 'bg-[radial-gradient(circle_at_center,#1a1408_0%,#000000_100%)]' },
                        { id: 'blur', label: 'Blur', color: 'bg-gray-900 backdrop-blur-md' },
                        { id: 'pattern', label: 'Pattern', color: 'bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px] bg-black' }
                    ].map(style => (
                        <button
                            key={style.id}
                            onClick={() => handleSettingChange('wallpaperStyle', style.id)}
                            className={`flex flex-col items-center gap-2 group`}
                        >
                            <div className={`w-full aspect-square rounded-xl border-2 ${settings.wallpaperStyle === style.id ? 'border-black' : 'border-transparent group-hover:border-gray-200'} p-1 transition-all`}>
                                <div className={`w-full h-full rounded-lg ${style.color}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{style.label}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => wallpaperInputRef.current?.click()}
                        className={`h-32 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${settings.wallpaperStyle === 'image' ? 'border-black bg-gray-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                    >
                        {settings.wallpaperImage ? (
                            <img src={settings.wallpaperImage} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Wallpaper Preview" />
                        ) : (
                            <ImageIcon size={24} className="text-gray-400 relative z-10" />
                        )}
                        <span className="text-sm font-medium text-gray-600 relative z-10">{settings.wallpaperImage ? 'Change Image' : 'Image'}</span>
                        <Zap size={10} className="text-gray-400 absolute top-3 right-3 z-10" />
                    </button>
                    <button className="h-32 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors relative">
                        <Video size={24} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Video</span>
                        <div className="absolute top-3 right-3 bg-black/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter backdrop-blur-sm shadow-sm border border-white/10">Coming soon</div>
                    </button>
                </div>
                <input
                    type="file"
                    ref={wallpaperInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleWallpaperUpload}
                />
            </div>

            <ColorPicker
                label="Background color"
                value={settings.backgroundColor}
                onChange={(val) => handleSettingChange('backgroundColor', val)}
            />
        </div>
    );

    const renderTextSection = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Page font</h2>
                <div className="relative">
                    <select
                        value={settings.font}
                        onChange={(e) => handleSettingChange('font', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none outline-none focus:border-black transition-colors font-medium text-gray-900"
                    >
                        <option>Link Sans</option>
                        <option>DM Sans</option>
                        <option>Inter</option>
                        <option>Poppins</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            <ColorPicker
                label="Page text color"
                value={settings.pageTextColor}
                onChange={(val) => handleSettingChange('pageTextColor', val)}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-1">Alternative title font</h3>
                        <p className="text-xs text-gray-500">Matches page font by default</p>
                    </div>
                    <Toggle checked={settings.altFont} onChange={(val) => handleSettingChange('altFont', val)} />
                </div>

                <ColorPicker
                    label="Title color"
                    value={settings.titleColor}
                    onChange={(val) => handleSettingChange('titleColor', val)}
                />
            </div>

            <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Title size</h2>
                <div className="flex gap-4">
                    <button onClick={() => handleSettingChange('size', 'small')} className={`flex-1 h-12 border-2 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${settings.size === 'small' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>Small</button>
                    <button onClick={() => handleSettingChange('size', 'large')} className={`flex-1 h-12 border-2 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${settings.size === 'large' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>Large</button>
                </div>
            </div>
        </div>
    );

    const renderButtonsSection = () => (
        <div className="space-y-12 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg font-bold mb-6 text-gray-900">Button style</h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'solid', label: 'Solid', class: 'bg-gray-200 border-transparent' },
                        { id: 'glass', label: 'Glass', class: 'bg-gray-100/50 border-transparent backdrop-blur-sm' },
                        { id: 'outline', label: 'Outline', class: 'border-gray-300 bg-transparent' }
                    ].map(style => (
                        <button key={style.id} onClick={() => handleSettingChange('buttonStyle', style.id)} className="flex flex-col items-center gap-2 group">
                            <div className={`w-full h-20 rounded-xl border-2 flex items-center justify-center p-4 transition-all ${settings.buttonStyle === style.id ? 'border-black' : 'border-transparent group-hover:border-gray-200'}`}>
                                <div className={`w-full h-full rounded-lg ${style.class}`}></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-6 text-gray-900">Corner roundness</h2>
                <div className="grid grid-cols-4 gap-4">
                    {[{ id: 'square', label: 'Square', r: 'rounded-none' }, { id: 'round', label: 'Round', r: 'rounded-md' }, { id: 'rounder', label: 'Rounder', r: 'rounded-2xl' }, { id: 'full', label: 'Full', r: 'rounded-full' }]
                        .map(r => (
                            <button key={r.id} onClick={() => handleSettingChange('buttonRoundness', r.id)} className="flex flex-col items-center gap-2 group">
                                <div className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center p-3 transition-all ${settings.buttonRoundness === r.id ? 'border-black' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                    <div className={`w-full h-full border-2 border-gray-900 ${r.r}`}></div>
                                </div>
                                <span className="text-xs font-medium text-gray-500">{r.label}</span>
                            </button>
                        ))}
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-6 text-gray-900">Button shadow</h2>
                <div className="flex gap-4">
                    {['none', 'soft', 'strong', 'hard'].map(shadow => (
                        <button
                            key={shadow}
                            onClick={() => handleSettingChange('buttonShadow', shadow)}
                            className={`flex-1 py-3 border rounded-xl text-sm font-medium capitalize transition-all ${settings.buttonShadow === shadow ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {shadow}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <ColorPicker label="Button color" value={settings.buttonColor} onChange={(v) => handleSettingChange('buttonColor', v)} />
                <ColorPicker label="Button text color" value={settings.buttonTextColor} onChange={(v) => handleSettingChange('buttonTextColor', v)} />
            </div>
        </div>
    );

    const renderColorsSection = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Colors</h2>
            <ColorPicker label="Background" value={settings.backgroundColor} onChange={(v) => handleSettingChange('backgroundColor', v)} />
            <ColorPicker label="Buttons" value={settings.buttonColor} onChange={(v) => handleSettingChange('buttonColor', v)} />
            <ColorPicker label="Button text" value={settings.buttonTextColor} onChange={(v) => handleSettingChange('buttonTextColor', v)} />
            <ColorPicker label="Page text" value={settings.pageTextColor} onChange={(v) => handleSettingChange('pageTextColor', v)} />
            <ColorPicker label="Title text" value={settings.titleColor} onChange={(v) => handleSettingChange('titleColor', v)} />
        </div>
    );

    const renderWidgetsSection = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Gold Price Widget</h2>
                        <p className="text-sm text-gray-500">Show live or manual gold rates on your profile</p>
                    </div>
                    <Toggle
                        checked={settings.goldWidget?.enabled}
                        onChange={(val) => handleGoldWidgetChange('enabled', val)}
                    />
                </div>

                {settings.goldWidget?.enabled && (
                    <div className="space-y-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Zap size={18} className="text-yellow-500" fill="currentColor" />
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Auto-update prices</p>
                                    <p className="text-xs text-gray-500">Fetch real-time market rates automatically</p>
                                </div>
                            </div>
                            <Toggle
                                checked={settings.goldWidget.autoUpdate}
                                onChange={(val) => handleGoldWidgetChange('autoUpdate', val)}
                            />
                        </div>

                        {settings.goldWidget.autoUpdate && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                <span className="text-sm font-semibold text-blue-700">Currency</span>
                                <select
                                    value={settings.goldWidget.currency}
                                    onChange={(e) => handleGoldWidgetChange('currency', e.target.value)}
                                    className="bg-transparent border-none outline-none font-bold text-blue-800"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="AED">AED (Dh)</option>
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.goldWidget.titleColor || '#D4AF37'}
                                        onChange={(e) => handleGoldWidgetChange('titleColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.goldWidget.titleColor || '#D4AF37'}
                                        onChange={(e) => handleGoldWidgetChange('titleColor', e.target.value)}
                                        className="flex-1 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors font-mono uppercase"
                                        placeholder="#D4AF37"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.goldWidget.subtitleColor || '#6B7280'}
                                        onChange={(e) => handleGoldWidgetChange('subtitleColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.goldWidget.subtitleColor || '#6B7280'}
                                        onChange={(e) => handleGoldWidgetChange('subtitleColor', e.target.value)}
                                        className="flex-1 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors font-mono uppercase"
                                        placeholder="#6B7280"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Item Label Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.goldWidget.labelColor || '#9CA3AF'}
                                        onChange={(e) => handleGoldWidgetChange('labelColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.goldWidget.labelColor || '#9CA3AF'}
                                        onChange={(e) => handleGoldWidgetChange('labelColor', e.target.value)}
                                        className="flex-1 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors font-mono uppercase"
                                        placeholder="#9CA3AF"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Price Value Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.goldWidget.valueColor || '#D4AF37'}
                                        onChange={(e) => handleGoldWidgetChange('valueColor', e.target.value)}
                                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.goldWidget.valueColor || '#D4AF37'}
                                        onChange={(e) => handleGoldWidgetChange('valueColor', e.target.value)}
                                        className="flex-1 p-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors font-mono uppercase"
                                        placeholder="#D4AF37"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`${settings.goldWidget.autoUpdate ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Widget Title</label>
                            <input
                                type="text"
                                value={settings.goldWidget.title}
                                onChange={(e) => handleGoldWidgetChange('title', e.target.value)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Today's Date/Subtext</label>
                            <input
                                type="text"
                                value={settings.goldWidget.date}
                                onChange={(e) => handleGoldWidgetChange('date', e.target.value)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700">Rates</label>
                            {settings.goldWidget.rates.map((rate, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={rate.label}
                                        placeholder="Label (e.g. 22KT)"
                                        onChange={(e) => {
                                            const newRates = [...settings.goldWidget.rates];
                                            newRates[idx].label = e.target.value;
                                            handleGoldWidgetChange('rates', newRates);
                                        }}
                                        className="flex-1 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                    />
                                    <input
                                        type="text"
                                        value={rate.value}
                                        placeholder="Price (e.g. 14000/GM)"
                                        onChange={(e) => {
                                            const newRates = [...settings.goldWidget.rates];
                                            newRates[idx].value = e.target.value;
                                            handleGoldWidgetChange('rates', newRates);
                                        }}
                                        className="flex-1 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Footer Notice</label>
                            <textarea
                                value={settings.goldWidget.footer}
                                onChange={(e) => handleGoldWidgetChange('footer', e.target.value)}
                                rows={2}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors text-sm"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-12 border-t border-gray-100 pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Map Widget</h2>
                            <p className="text-sm text-gray-500">Show your business location on a map</p>
                        </div>
                        <Toggle
                            checked={settings.mapWidget?.enabled}
                            onChange={(val) => {
                                setSettings(prev => ({
                                    ...prev,
                                    mapWidget: { ...prev.mapWidget, enabled: val }
                                }));
                                setIsDirty(true);
                            }}
                        />
                    </div>

                    {settings.mapWidget?.enabled && (
                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
                                    <input
                                        type="text"
                                        value={settings.mapWidget.title}
                                        onChange={(e) => {
                                            const newMap = { ...settings.mapWidget, title: e.target.value };
                                            setSettings(prev => ({ ...prev, mapWidget: newMap }));
                                            setIsDirty(true);
                                        }}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                        placeholder="e.g. Patel Jewellers Mehsanawala"
                                    />
                                </div>




                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Search Query</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={settings.mapWidget.query}
                                            onChange={(e) => {
                                                const newMap = { ...settings.mapWidget, query: e.target.value };
                                                setSettings(prev => ({ ...prev, mapWidget: newMap }));
                                                setIsDirty(true);
                                            }}
                                            className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                            placeholder="Enter address or business name"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Add Second Location</h4>
                                            <p className="text-xs text-gray-500">Show a separate map for Palanpur</p>
                                        </div>
                                        <Toggle
                                            checked={settings.mapWidget.multiLocation}
                                            onChange={(val) => {
                                                const newMap = { ...settings.mapWidget, multiLocation: val };
                                                setSettings(prev => ({ ...prev, mapWidget: newMap }));
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>

                                    {settings.mapWidget.multiLocation && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Business Name 2</label>
                                                <input
                                                    type="text"
                                                    value={settings.mapWidget.title2}
                                                    onChange={(e) => {
                                                        const newMap = { ...settings.mapWidget, title2: e.target.value };
                                                        setSettings(prev => ({ ...prev, mapWidget: newMap }));
                                                        setIsDirty(true);
                                                    }}
                                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                                    placeholder="e.g. Patel Jewellers Palanpur"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Search Query 2</label>
                                                <div className="relative">
                                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={settings.mapWidget.query2}
                                                        onChange={(e) => {
                                                            const newMap = { ...settings.mapWidget, query2: e.target.value };
                                                            setSettings(prev => ({ ...prev, mapWidget: newMap }));
                                                            setIsDirty(true);
                                                        }}
                                                        className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"
                                                        placeholder="Enter Palanpur address"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderFooterSection = () => (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Hide Linktree footer</span>
                    <Zap size={14} className="text-gray-400" />
                </div>
                <Toggle checked={settings.hideFooter} onChange={(v) => handleSettingChange('hideFooter', v)} />
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
    );

    if (!profile.id) return (
        <div className="flex h-screen flex-col items-center justify-center bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
            <p className="text-gray-500 mb-6">We couldn't find the profile you're looking for.</p>
            <Link to="/dashboard" className="px-6 py-2 bg-purple-600 text-white rounded-full font-bold">Back to Hub</Link>
        </div>
    );

    return (
        <div className="flex h-screen bg-white font-sans">
            <MiniSidebar />
            <div className="w-20 flex-shrink-0" /> {/* Spacer */}

            <div className="w-64 flex-shrink-0 h-screen overflow-y-auto border-r border-gray-100 hidden md:block pt-8 px-4 fixed left-20 bg-white z-40">
                <nav className="space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="w-64 hidden md:block flex-shrink-0" />

            <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-white">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-30 border-b border-gray-100">
                    <div className="flex-1">
                        <div className="flex gap-8">
                            <Link to={`/dashboard/${profileId}/links`} className="text-sm font-medium text-gray-500 pb-1 hover:text-gray-900 transition-colors border-b-2 border-transparent hover:border-gray-200">Links</Link>
                            <button className="text-sm font-bold text-gray-900 border-b-2 border-black pb-1 hover:opacity-75 transition-opacity">Appearance</button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isDirty && (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 transition-colors"
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end gap-3">
                        <a
                            href={`/u/${profile.slug || user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-all hidden sm:flex border border-gray-200/50"
                        >
                            <span className="font-medium">{"linktr.ee/" + (profile.slug || user.username)}</span>
                            <ExternalLink size={14} className="text-gray-400" />
                        </a>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto w-full px-6 py-8">
                    {activeSection === 'header' && renderHeaderSection()}
                    {activeSection === 'theme' && renderThemeSection()}
                    {activeSection === 'wallpaper' && renderWallpaperSection()}
                    {activeSection === 'text' && renderTextSection()}
                    {activeSection === 'buttons' && renderButtonsSection()}
                    {activeSection === 'colors' && renderColorsSection()}
                    {activeSection === 'widgets' && renderWidgetsSection()}
                    {activeSection === 'footer' && renderFooterSection()}
                </div>
            </main>

            <aside className="w-[440px] border-l border-gray-200 bg-white h-screen hidden xl:flex flex-col items-center justify-center relative p-8 bg-gray-50">
                <div className="absolute top-4 right-4 z-40">
                    <a href={`/u/${profile.slug || user.username}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                        <ExternalLink size={20} />
                    </a>
                </div>

                {isDirty && (
                    <div className="mb-4 text-center flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest shrink-0">Unsaved changes</span>
                    </div>
                )}

                <div className="w-[340px] h-[700px] bg-black rounded-[45px] p-3 shadow-2xl border-[6px] border-gray-800 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-20"></div>
                    <div className="w-full h-full rounded-[35px] overflow-hidden relative">
                        <LivePreview
                            settings={settings}
                            profile={{
                                ...(profile || {}),
                                username: profile?.slug || 'user',
                                profile_image: profile?.profile_image,
                                bio: settings.bio,
                                links: profile?.links || []
                            }}
                        />
                    </div>
                </div>
            </aside>
        </div>
    );
}
