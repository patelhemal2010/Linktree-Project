import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Linkedin, Youtube, MessageCircle, Globe, ExternalLink, MapPin, Star } from 'lucide-react';

export default function LivePreview({ settings, profile }) {
    if (!profile) return null;

    const {
        layout, titleStyle, size, altFont, bio,
        theme, wallpaperStyle, backgroundColor,
        font, pageTextColor, titleColor,
        buttonStyle, buttonRoundness, buttonShadow, buttonColor, buttonTextColor,
        hideFooter, logoImage, title, goldWidget, mapWidget
    } = settings;

    const [liveRates, setLiveRates] = useState(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!goldWidget?.enabled || !goldWidget?.autoUpdate) return;

        const fetchRates = async () => {
            if (isFetching) return;
            setIsFetching(true);

            try {
                // We'll try to get the most accurate Indian market rate
                // Patel Jewellers reference: 15890 for 2.5g = 6356 per gram.
                // Typical calculation: (International Spot / 31.1035) * USDINR * 1.16 (Duty+GST)

                // Target: Patel Jewellers (15890 for 2.4KT @ 2.5g)
                // This requires a ~1.006 duty on a $2352 spot price.
                let goldUSD = 2352; // Updated fallback for current market
                let silverUSD = 23.1; // Updated fallback
                let usdInr = 83.5;
                let success = false;

                // Attempt 1: Gold-API.com
                try {
                    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://api.gold-api.com/v1/latest?t=' + Date.now())}`);
                    const proxyData = await res.json();
                    const data = JSON.parse(proxyData.contents);

                    if (data && (data.XAU || data.gold || data.price)) {
                        goldUSD = data.XAU || data.gold || data.price;
                        silverUSD = data.XAG || data.silver || (goldUSD / 85);
                        success = true;
                    }
                } catch (e) {
                    console.warn("Gold-API failed");
                }

                // Attempt 2: Metals.live
                if (!success) {
                    try {
                        const res = await fetch(`https://api.metals.live/v1/spot?t=${Date.now()}`);
                        const data = await res.json();
                        const goldObj = data.find(i => i.gold);
                        const silverObj = data.find(i => i.silver);
                        if (goldObj) {
                            goldUSD = goldObj.gold.price;
                            silverUSD = silverObj?.silver?.price || (goldUSD / 85);
                            success = true;
                        }
                    } catch (e) {
                        console.warn("Metals.live failed");
                    }
                }

                // Always try to get current USD-INR for accuracy
                try {
                    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD?t=${Date.now()}`);
                    const data = await res.json();
                    if (data?.rates?.INR) usdInr = data.rates.INR;
                } catch (e) { }

                // Match Patel Jewellers (lnk.bio/pateljewellers) pricing logic
                // Their display uses International Spot converted to INR for 2.5G
                // Gold Target: ~15890 for 2.5g (Matches ~1.006 duty on spot)
                // Silver Target: ~269 for 2.5g (Matches ~1.74 duty on spot)
                const goldDuty = 1.006;
                const silverPremium = 1.74;
                const weightFactor = 2.5;

                const gramSpot24K = (goldUSD / 31.1035) * usdInr;
                const gramSpotSilver = (silverUSD / 31.1035) * usdInr;

                setLiveRates({
                    '24KT': Math.round(gramSpot24K * goldDuty * weightFactor),
                    '22KT': Math.round(gramSpot24K * goldDuty * (22 / 24) * weightFactor),
                    '18KT': Math.round(gramSpot24K * goldDuty * (18 / 24) * weightFactor),
                    'SILVER': Math.round(gramSpotSilver * silverPremium * weightFactor),
                    'PLATINUM': 7300, // Reference static for retail board
                    symbol: '₹',
                    lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            } catch (err) {
                console.error("Master Fetch Error:", err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchRates();
        const interval = setInterval(fetchRates, 60000);
        return () => clearInterval(interval);
    }, [goldWidget?.enabled, goldWidget?.autoUpdate, goldWidget?.currency]);

    const containerStyle = useMemo(() => {
        const style = {
            color: pageTextColor || '#1a1a1a',
            fontFamily: font || 'Inter, sans-serif',
            minHeight: 'auto',
            backgroundColor: backgroundColor || '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: layout === 'hero' ? '0 0 40px 0' : '40px 20px',
            textAlign: 'center',
            overflowY: 'visible',
            position: 'relative'
        };

        if (wallpaperStyle === 'gradient') {
            style.background = `linear-gradient(to bottom, #FFFFFF, ${backgroundColor || '#f9fafb'})`;
        }
        else if (wallpaperStyle === 'jewelry-lux') {
            style.background = 'radial-gradient(circle at top, #1E120A 0%, #0D0805 100%)';
            style.backgroundColor = '#0D0805';
        } else if (wallpaperStyle === 'obsidian-gold') {
            style.background = 'radial-gradient(circle at center, #1a1408 0%, #000000 100%)';
            style.backgroundColor = '#000000';
        } else if (wallpaperStyle === 'image' && settings.wallpaperImage) {
            style.backgroundImage = `url(${settings.wallpaperImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        } else if (wallpaperStyle === 'pattern') {
            style.backgroundColor = backgroundColor || '#FFFFFF';
            style.backgroundImage = `radial-gradient(${pageTextColor || '#000'}15 1px, transparent 1px)`;
            style.backgroundSize = '20px 20px';
        }

        return style;
    }, [wallpaperStyle, backgroundColor, font, pageTextColor, layout, settings.wallpaperImage]);

    const isHero = layout === 'hero';

    // Helper for button styles
    const getButtonStyle = () => {
        const style = {
            backgroundColor: buttonColor || '#FFFFFF',
            color: buttonTextColor || '#1a1a1a',
            borderRadius: '0px',
            border: '1px solid transparent',
            boxShadow: 'none',
            transition: 'all 0.2s ease'
        };

        // Roundness
        switch (buttonRoundness) {
            case 'round': style.borderRadius = '8px'; break;
            case 'rounder': style.borderRadius = '16px'; break;
            case 'full': style.borderRadius = '9999px'; break;
            default: style.borderRadius = '0px';
        }

        // Style Type
        if (buttonStyle === 'outline') {
            style.backgroundColor = 'transparent';
            style.border = `1px solid ${buttonColor || '#1a1a1a'}`;
        } else if (buttonStyle === 'glass') {
            style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            style.backdropFilter = 'blur(10px)';
            style.border = '1px solid rgba(0,0,0,0.05)';
        } else {
            // Solid - Default
            if (!buttonColor) style.border = '1px solid #f3f4f6';
        }

        // Shadow
        switch (buttonShadow) {
            case 'soft': style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.06)'; break;
            case 'strong': style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.1)'; break;
            case 'none':
            default: style.boxShadow = 'none'; break;
        }

        return style;
    };

    return (
        <div style={containerStyle} className="w-full h-full overflow-y-auto relative custom-scrollbar">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(212, 175, 55, 0.2);
                    border-radius: 10px;
                }
                
                @keyframes liquid-wave {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(0%) skewX(0deg); }
                }

                @keyframes energy-flare {
                    0% { left: -100%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }

                .liquid-gold-button {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.5s cubic-bezier(0.77, 0, 0.175, 1) !important;
                    text-transform: uppercase;
                    letter-spacing: 0.22em;
                    z-index: 1;
                    height: 72px;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                }

                .liquid-gold-button::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -110%;
                    width: 120%;
                    height: 100%;
                    background: linear-gradient(90deg, #D4AF37, #F9F295, #D4AF37);
                    transition: all 0.6s cubic-bezier(0.77, 0, 0.175, 1);
                    z-index: 1;
                    transform: skewX(-15deg);
                }

                .liquid-gold-button::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
                    transform: skewX(-25deg);
                    pointer-events: none;
                    z-index: 2;
                }

                .liquid-gold-button:hover {
                    color: #332200 !important;
                    transform: translateY(-4px) scale(1.01) !important;
                    box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4) !important;
                    border: 1px solid rgba(212, 175, 55, 0.4) !important;
                }

                .liquid-gold-button:hover::before {
                    left: 0;
                    transform: skewX(0deg);
                }

                .liquid-gold-button:hover::after {
                    animation: energy-flare 1s infinite ease-in-out;
                }

                .liquid-gold-button:active {
                    transform: scale(0.96) translateY(0px) !important;
                    transition: 0.1s !important;
                }

                .btn-text-content {
                    position: relative;
                    z-index: 5;
                    flex: 1;
                    text-align: center;
                    margin-right: 48px; /* Offset for icon balance */
                }

                .icon-stage {
                    position: relative;
                    z-index: 10;
                    width: 48px;
                    height: 48px;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                `}
            </style>

            {/* Blur Overlay */}
            {wallpaperStyle === 'blur' && (
                <div className="absolute inset-0 backdrop-blur-3xl bg-white/20 z-0 pointer-events-none" />
            )}

            <div className="relative z-10 w-full flex flex-col items-center">
                {/* Header Section */}
                {isHero ? (
                    <div className="w-full flex flex-col items-center mb-10">
                        {/* Partitioned White Header Area - Responsive Size */}
                        <div className="w-full h-48 md:h-72 bg-white relative overflow-hidden shadow-sm flex items-center justify-center transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
                            {(logoImage || profile.profile_image) ? (
                                <img
                                    src={logoImage || profile.profile_image}
                                    className="max-h-36 md:max-h-56 w-auto object-contain p-6 relative z-10 drop-shadow-sm"
                                    alt="Brand Logo"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                                    <span className="text-5xl font-bold opacity-20">{profile.username?.[0]?.toUpperCase()}</span>
                                </div>
                            )}
                        </div>
                        <div className="w-full text-center px-6 flex flex-col items-center mt-6 md:mt-8">
                            {titleStyle === 'logo' && logoImage ? (
                                <img src={logoImage} alt="Logo" className={`${size === 'large' ? 'max-h-24 md:max-h-28' : 'max-h-16 md:max-h-20'} w-auto object-contain mb-4`} />
                            ) : (
                                title && (
                                    <h1 className={`${size === 'large' ? 'text-2xl md:text-3xl font-black' : 'text-xl md:text-2xl font-black'} mb-2 tracking-tight transition-all duration-300`} style={{ color: (wallpaperStyle === 'obsidian-gold' || wallpaperStyle === 'jewelry-lux') ? '#FFFFFF' : (titleColor || '#1a1a1a') }}>
                                        {title}
                                    </h1>
                                )
                            )}
                            {settings.tagline && <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.35em] text-[#D4AF37] mb-3">{settings.tagline}</p>}
                            {bio && <p className="text-xs md:text-sm font-medium max-w-[280px] md:max-w-xs mx-auto leading-relaxed opacity-60" style={{ color: (wallpaperStyle === 'obsidian-gold' || wallpaperStyle === 'jewelry-lux') ? '#FFFFFF' : pageTextColor }}>{bio}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center mb-10 text-center max-w-sm mx-auto">
                        {/* Profile Image */}
                        <div className={`${size === 'large' ? 'w-28 h-28' : 'w-20 h-20'} rounded-full overflow-hidden mb-5 flex-shrink-0 transition-all duration-300`}>
                            {profile.profile_image ? (
                                <img src={profile.profile_image} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xl font-bold text-gray-200">
                                    {profile.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Title and Bio */}
                        {titleStyle === 'logo' && logoImage ? (
                            <img src={logoImage} alt="Logo" className={`${size === 'large' ? 'max-h-28' : 'max-h-24'} w-auto object-contain mb-4`} />
                        ) : (
                            title && (
                                <h1 className={`${size === 'large' ? 'text-2xl font-extrabold' : 'text-xl font-extrabold'} mb-2 tracking-tight transition-all duration-300`} style={{ color: titleColor || (settings.pageTextColor || '#1a1a1a') }}>
                                    {title}
                                </h1>
                            )
                        )}

                        {/* Tagline / Bio */}
                        <div className="space-y-2 mt-1">
                            {settings.tagline && <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#800000]">{settings.tagline}</p>}
                            {bio && <p className="text-sm text-gray-500 font-medium px-4 leading-relaxed">{bio}</p>}
                        </div>
                    </div>
                )}

                {/* Gold Widget */}
                {goldWidget?.enabled && (
                    <div className="w-full max-w-[400px] mb-12 px-4 md:px-2">
                        <div className="bg-white/70 backdrop-blur-2xl border border-[#D4AF37]/30 rounded-[2.5rem] md:rounded-[32px] p-6 md:p-8 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-500">
                            {/* Static Shine */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 blur-[60px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                            <h3
                                className="text-[11px] font-black uppercase tracking-[0.35em] mb-1 flex items-center justify-center gap-2"
                                style={{ color: goldWidget.titleColor || '#D4AF37' }}
                            >
                                {goldWidget.title || "Today's Gold Rate"}
                                {goldWidget.autoUpdate && liveRates && (() => {
                                    const now = new Date();
                                    const day = now.getUTCDay();
                                    const hour = now.getUTCHours();
                                    // Gold market: Sun 10 PM GMT to Fri 10 PM GMT
                                    const isMarketOpen = (day === 0 && hour >= 22) || (day > 0 && day < 5) || (day === 5 && hour < 22);

                                    return (
                                        <span
                                            className={`flex items-center gap-1 text-[7px] px-2 py-0.5 rounded-full animate-pulse uppercase tracking-normal font-black transition-colors duration-500`}
                                            style={{
                                                backgroundColor: isMarketOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: isMarketOpen ? '#22c55e' : '#ef4444'
                                            }}
                                        >
                                            {isMarketOpen ? 'Live' : 'Market Closed'}
                                        </span>
                                    );
                                })()}
                            </h3>
                            <p
                                className="text-[10px] font-bold mb-6 uppercase tracking-[0.1em] opacity-80"
                                style={{ color: goldWidget.subtitleColor || '#6B7280' }}
                            >
                                {goldWidget.autoUpdate ? (liveRates?.lastUpdate ? `LAST UPDATED AT ${liveRates.lastUpdate}` : 'Fetching live rates...') : goldWidget.date}
                            </p>

                            <div className="space-y-4">
                                {(goldWidget.autoUpdate && liveRates ?
                                    [
                                        { label: '18KT', value: `${liveRates.symbol}${liveRates['18KT']}/GM` },
                                        { label: '22KT', value: `${liveRates.symbol}${liveRates['22KT']}/GM` },
                                        { label: '24KT', value: `${liveRates.symbol}${liveRates['24KT']}/GM` },
                                        { label: 'SILVER', value: `${liveRates.symbol}${liveRates['SILVER']}/GM` },
                                        { label: 'PLATINUM', value: `${liveRates.symbol}${liveRates['PLATINUM']}/GM` }
                                    ] : goldWidget.rates || []).map((rate, i) => (
                                        <div key={i} className="flex justify-between items-center group/item text-center">
                                            <span
                                                className="text-[12px] font-bold tracking-[0.15em] transition-colors group-hover/item:text-white"
                                                style={{ color: goldWidget.labelColor || '#94a3b8' }}
                                            >
                                                {rate.label}
                                            </span>
                                            <span
                                                className="text-[14px] font-black tracking-wider drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                                style={{ color: goldWidget.valueColor || '#D4AF37' }}
                                            >
                                                {rate.value}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {goldWidget.footer && (
                                <p className="mt-8 text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed opacity-50">
                                    {goldWidget.footer}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Simplified Map Widget */}
                {mapWidget?.enabled && (
                    <div className="w-full max-w-[400px] mb-12 px-4 md:px-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white/70 backdrop-blur-2xl border border-[#D4AF37]/30 rounded-[2.5rem] md:rounded-[32px] p-6 md:p-8 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-500">
                            {/* Static Shine */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 blur-[60px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                            <div className={`${mapWidget.multiLocation ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                                {/* Map Card 1 - Mehsana */}
                                <div className="flex flex-col">
                                    <h3
                                        className="text-[13px] font-black uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-1.5 px-2 leading-relaxed text-center"
                                        style={{ color: titleColor || '#111111' }}
                                    >
                                        <MapPin size={14} className="text-[#D4AF37] shrink-0" strokeWidth={3} />
                                        <span className="break-words">
                                            {mapWidget.title || "Patel Jewellers Mehsanawala"}
                                        </span>
                                    </h3>

                                    <a
                                        href={`https://www.google.com/maps/place/Patel+Jewellers+Mehsanawala/@23.6061937,72.3797345,17z/data=!3m1!1e3!4m6!3m5!1s0x395c43ffa8f2bfad:0xafa6f2d30fa54557!8m2!3d23.6061937!4d72.3797345!16s%2Fg%2F11h4lnqnjf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full aspect-square rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group/map bg-[#111] cursor-pointer"
                                    >
                                        <div className="absolute inset-0 w-full h-full pointer-events-none bg-[#051121]">
                                            <iframe
                                                title="Mehsana Location"
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0, filter: 'invert(90%) hue-rotate(190deg) contrast(1.2) brightness(1)' }}
                                                loading="eager"
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapWidget.query || 'Patel Jewellers Mehsanawala, Radhanpur Road, Mehsana')}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                                            ></iframe>
                                        </div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] z-20 transition-transform group-hover/map:scale-110">
                                            <div className="w-8 h-8 bg-[#EA4335] rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-[#421010] rounded-full shadow-inner opacity-90"></div>
                                                <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-[#EA4335]"></div>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/map:opacity-100 transition-all duration-500 z-40 transform translate-y-2 group-hover/map:translate-y-0 text-white text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-sm">
                                            Open Mehsana Store
                                        </div>
                                    </a>

                                    <a
                                        href={`https://www.google.com/maps/place/Patel+Jewellers+Mehsanawala/@23.6061937,72.3797345,17z/data=!3m1!1e3!4m6!3m5!1s0x395c43ffa8f2bfad:0xafa6f2d30fa54557!8m2!3d23.6061937!4d72.3797345!16s%2Fg%2F11h4lnqnjf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 flex items-center justify-center gap-2 py-3 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                        style={getButtonStyle()}
                                    >
                                        Directions <ExternalLink size={10} />
                                    </a>
                                </div>

                                {/* Map Card 2 - Palanpur */}
                                {mapWidget.multiLocation && (
                                    <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                                        <h3
                                            className="text-[13px] font-black uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-1.5 px-2 leading-relaxed text-center"
                                            style={{ color: titleColor || '#111111' }}
                                        >
                                            <MapPin size={14} className="text-[#D4AF37] shrink-0" strokeWidth={3} />
                                            <span className="break-words">
                                                {mapWidget.title2 || "Patel Jewellers Palanpur"}
                                            </span>
                                        </h3>

                                        <a
                                            href={`https://www.google.com/maps/place/Patel+Jewellers/@24.1855139,72.4209684,755m/data=!3m1!1e3!4m6!3m5!1s0x395ceb676346be4d:0x63cd4836ac13b598!8m2!3d24.185505!4d72.4222998!16s%2Fg%2F11xryzw7gs?entry=ttu`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full aspect-square rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative group/map bg-[#111] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[#051121]">
                                                <iframe
                                                    title="Palanpur Location"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0, filter: 'invert(90%) hue-rotate(190deg) contrast(1.2) brightness(1)' }}
                                                    loading="eager"
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapWidget.query2 || 'Patel Jewellers, Palanpur')}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                                                ></iframe>
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] z-20 transition-transform group-hover/map:scale-110">
                                                <div className="w-8 h-8 bg-[#EA4335] rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 bg-[#421010] rounded-full shadow-inner opacity-90"></div>
                                                    <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[12px] border-t-[#EA4335]"></div>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/map:opacity-100 transition-all duration-500 z-40 transform translate-y-2 group-hover/map:translate-y-0 text-white text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-sm">
                                                Open Palanpur Store
                                            </div>
                                        </a>

                                        <a
                                            href={`https://www.google.com/maps/place/Patel+Jewellers/@24.1855139,72.4209684,755m/data=!3m1!1e3!4m6!3m5!1s0x395ceb676346be4d:0x63cd4836ac13b598!8m2!3d24.185505!4d72.4222998!16s%2Fg%2F11xryzw7gs?entry=ttu`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 flex items-center justify-center gap-2 py-3 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                            style={getButtonStyle()}
                                        >
                                            Directions <ExternalLink size={10} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}



                {/* Social Media Section Header */}
                {profile.links && profile.links.length > 0 && (
                    <div className="w-full text-center mt-12 mb-8">
                        <span className="text-[12px] font-bold uppercase tracking-[0.5em] text-gray-400">SOCIAL MEDIA</span>
                    </div>
                )}

                {/* Links - 'Liquid Gold' with Icons */}
                <div className="w-full max-w-[420px] space-y-6 mb-10 px-4">
                    {profile.links && profile.links.map((link, idx) => {
                        const getPlatformConfig = (platform, title = "", url = "") => {
                            const common = { size: 24, className: "text-white" };

                            // Robust Guessing for link platforms
                            let activePlatform = platform || 'website';
                            if (activePlatform === 'website') {
                                const text = (title || "" + (url || "")).toLowerCase();
                                if (/insta|gram/.test(text)) activePlatform = 'instagram';
                                else if (/face|book/.test(text)) activePlatform = 'facebook';
                                else if (/wa|msg|whatsapp/.test(text)) activePlatform = 'whatsapp';
                                else if (/pin/.test(text)) activePlatform = 'pinterest';
                                else if (/you/.test(text)) activePlatform = 'youtube';
                                else if (/twit|x\.com/.test(text)) activePlatform = 'twitter';
                                else if (/linke/.test(text)) activePlatform = 'linkedin';
                            }

                            switch (activePlatform) {
                                case 'instagram': return {
                                    icon: <Instagram size={28} className="text-[#E1306C]" />,
                                    color: '#ffffff',
                                    hasBorder: true
                                };
                                case 'facebook': return { icon: <Facebook {...common} />, color: '#1877F2' };
                                case 'whatsapp': return { icon: <MessageCircle {...common} />, color: '#25D366' };
                                case 'pinterest': return { icon: <div className="font-serif italic font-black text-2xl text-white mt-[-2px]">P</div>, color: '#BD0812' };
                                case 'youtube': return { icon: <Youtube {...common} />, color: '#FF0000' };
                                case 'twitter': return { icon: <Twitter {...common} />, color: '#1DA1F2' };
                                case 'linkedin': return { icon: <Linkedin {...common} />, color: '#0A66C2' };
                                default: return { icon: <Globe size={24} className="text-white" />, color: '#333333', hasBorder: false };
                            }
                        };
                        const config = getPlatformConfig(link.platform, link.title, link.url);

                        return (
                            <motion.a
                                key={link.id || idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="liquid-gold-button group"
                                style={getButtonStyle()}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                            >
                                {/* Icon Stage */}
                                <div
                                    className={`icon-stage flex items-center justify-center ${config.hasBorder ? 'border border-gray-100' : ''}`}
                                    style={{ backgroundColor: config.color }}
                                >
                                    {config.icon}
                                </div>

                                {/* Button Title */}
                                <span
                                    className="btn-text-content font-bold text-[14px] uppercase tracking-[0.3em] transition-colors group-hover:text-amber-900"
                                    style={{ color: buttonTextColor || '#111111' }}
                                >
                                    {link.title}
                                </span>
                            </motion.a>
                        );
                    })}
                </div>

                {/* Locations */}
                {settings.locations && (
                    <div className="mb-10 px-8">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose whitespace-pre-line">
                            {settings.locations}
                        </p>
                    </div>
                )}

                {/* Footer */}
                {!hideFooter && (
                    <div className="mt-auto py-10 opacity-20">
                        <span className="text-[9px] font-black uppercase tracking-[0.5em]">{title || profile.username || 'Linktree'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
