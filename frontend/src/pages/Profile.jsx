import React, { useEffect, useState, useRef } from 'react';
import api from '../api/client';
import { User, Mail, ArrowLeft, LogOut, Edit3, Check, X, AtSign, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import TopBar from '../components/admin/TopBar';

export default function Profile() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', username: '', profile_image: '' });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      setIsSaving(true);
      const res = await api.post('/auth/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, profile_image: res.data.imageUrl }));
        alert("Image uploaded! Click 'Save Changes' to apply it to your account.");
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        console.log("Profile Data Fetched:", res.data);
        if (res.data?.user) {
          setUser(res.data.user);
          setFormData({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            username: res.data.user.username || '',
            profile_image: res.data.user.profile_image || ''
          });
          // Sync localStorage just in case
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/auth/update', formData);
      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setIsEditing(false);
        // Trigger a sync if other components use local user
        window.dispatchEvent(new Event('auth-change'));
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-2 hover:bg-white rounded-full transition-colors">
                  <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Details</h1>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-full font-bold text-sm hover:bg-purple-700 transition-all shadow-md disabled:bg-purple-400"
                  >
                    {isSaving ? "Saving..." : <><Check size={18} /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Col: Avatar Card */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-fit sticky top-4">
                  <div
                    onClick={() => isEditing && fileInputRef.current.click()}
                    className={`w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-6 text-3xl font-black overflow-hidden relative group ${isEditing ? 'cursor-pointer' : ''}`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div className="w-full h-full items-center justify-center flex">
                      {(user?.name?.[0] || user?.username?.[0] || '?').toUpperCase()}
                    </div>

                    {(formData.profile_image || user?.profile_image) && (
                      <img
                        src={formData.profile_image || user?.profile_image}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.name || 'No Name Set'}</h2>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-[2rem] font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>

              {/* Right Col: Details Form */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-8">
                    {isEditing ? 'Update your Information' : 'Personal Information'}
                  </h3>

                  <div className="space-y-6">
                    {isEditing && (
                      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                          <ImageIcon size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-purple-900">Change Profile Photo</p>
                          <p className="text-xs text-purple-600">Click the circle on the left to select a new image from your device.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</p>
                      {isEditing ? (
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent">
                          <User size={20} className="text-gray-400" />
                          <p className="text-lg font-bold text-gray-900">{user?.name || '—'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</p>
                      {isEditing ? (
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent">
                          <Mail size={20} className="text-gray-400" />
                          <p className="text-lg font-bold text-gray-900">{user?.email || '—'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Username</p>
                      {isEditing ? (
                        <div className="relative">
                          <AtSign className="absolute left-4 top-3.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="username"
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent">
                          <AtSign size={20} className="text-gray-400" />
                          <p className="text-lg font-bold text-gray-900">{user?.username || '—'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
