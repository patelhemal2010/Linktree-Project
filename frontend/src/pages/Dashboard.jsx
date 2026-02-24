import React, { useState, useEffect } from 'react';
import Sidebar from '../components/admin/Sidebar';
import TopBar from '../components/admin/TopBar';
import { Share2, Edit2, LayoutGrid, Maximize2, BarChart2, Plus, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../api/client';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { username: 'user', name: 'User' };
    } catch (e) {
      return { username: 'user', name: 'User' };
    }
  })();

  const filteredProfiles = profiles.filter(p =>
    p.slug.toLowerCase().includes(searchQuery) ||
    (p.title && p.title.toLowerCase().includes(searchQuery))
  );

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/profile/all/me');
        setProfiles(res.data.profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/profile/create', { slug: newSlug });
      setProfiles([res.data.profile, ...profiles]);
      setIsModalOpen(false);
      setNewSlug('');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create profile");
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Linktree? All links and data will be permanently removed.")) return;
    try {
      await api.delete(`/profile/${id}`);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete profile");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar />

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {/* Header Area */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Linktrees</h1>
              <p className="text-gray-500 mt-1">Manage all your Linktree pages from one place.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-purple-700 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                Create New Linktree
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map(profile => (
                  <div key={profile.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    {/* Linktree Mockup Preview */}
                    <div className="aspect-[4/3] bg-gray-50 rounded-2xl relative flex flex-col items-center justify-center overflow-hidden border border-gray-100 mb-4 transition-colors group-hover:bg-purple-50/30">
                      <div className="text-center relative z-10 scale-75">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-white mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-400 overflow-hidden shadow-sm border border-gray-100 relative">
                          <div className="w-full h-full items-center justify-center flex bg-gray-50 uppercase">
                            {(profile.slug?.[0] || 'L')}
                          </div>
                          {profile.profile_image && (
                            <img
                              src={profile.profile_image}
                              className="absolute inset-0 w-full h-full object-cover"
                              alt="Profile"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <p className="font-bold text-gray-800 text-sm mb-4">@{profile.slug}</p>

                        {/* Mock Buttons */}
                        <div className="w-40 h-8 bg-white rounded-full mx-auto shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-800 mb-2 border border-gray-50">
                          Visit Linktree
                        </div>
                        <div className="w-40 h-8 bg-white rounded-full mx-auto shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-800 border border-gray-50">
                          View Links
                        </div>
                      </div>

                      {/* Faint Phone Outline */}
                      <div className="absolute inset-x-8 top-8 bottom-0 bg-white rounded-t-[30px] opacity-40 translate-y-4 pointer-events-none border border-gray-200 shadow-xl"></div>
                    </div>

                    {/* Info & Actions */}
                    <div className="px-2">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">@{profile.slug}</h3>
                          <a href={`/u/${profile.slug}`} target='_blank' className="text-xs text-gray-500 hover:underline truncate block max-w-[150px]">linktr.ee/{profile.slug}</a>
                        </div>
                        <a href={`/u/${profile.slug}`} target='_blank' className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
                          <Share2 size={18} />
                        </a>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link to={`/dashboard/${profile.id}/links`} className="flex-1 bg-gray-900 text-white text-center py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-sm">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center shrink-0"
                          title="Delete Linktree"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-purple-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No matching Linktrees</h3>
                  <p className="text-gray-500">We couldn't find anything matching "{searchQuery}". Try a different term!</p>
                  <button
                    onClick={() => setSearchParams({})}
                    className="mt-6 text-purple-600 font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Create New Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Create a new Linktree</h2>
            <p className="text-gray-500 text-sm mb-6">Give your new page a unique handle (URL).</p>

            <form onSubmit={handleCreateProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Unique URL</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">linktr.ee/</span>
                  <input
                    type="text"
                    className="w-full pl-24 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-medium text-gray-900"
                    placeholder="your-handle"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all transform hover:translate-y-[-1px]"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
