import React, { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Plus, ExternalLink, Instagram, Facebook, Twitter, Linkedin, Youtube, MessageCircle, Globe } from 'lucide-react';
import api from '../../api/client';

// ==========================
// Sortable Link Item
// ==========================
function SortableLinkItem({ link, onDelete, onEdit, platforms = [] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const platform = platforms.find(p => p.id === (link.platform || 'website')) || platforms[0];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white border border-gray-100 rounded-2xl p-4 mb-4 flex items-center justify-between transition-all duration-300 ${isDragging ? 'shadow-2xl ring-2 ring-purple-500/20 z-50 scale-[1.02]' : 'shadow-sm hover:shadow-md hover:border-purple-100 hover:bg-purple-50/10'}`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 px-1.5 cursor-grab text-gray-300 hover:text-purple-400 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                >
                    <GripVertical size={20} />
                </div>

                {/* Platform Icon Container */}
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-900/5 overflow-hidden border border-gray-50 relative group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundColor: platform.brandColor }}
                >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/10 pointer-events-none"></div>
                    <div className="relative z-10 filter drop-shadow-md">
                        {platform.plainIcon}
                    </div>
                </div>

                {/* Link Info */}
                <div className="flex-1 min-w-0 px-1">
                    <h3 className="font-bold text-gray-800 text-lg truncate group-hover:text-purple-700 transition-colors uppercase tracking-tight">{link.title}</h3>
                    <div className="flex items-center gap-1.5">
                        <Globe size={12} className="text-gray-400" />
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-purple-600 truncate block transition-colors font-medium underline-offset-4 hover:underline"
                        >
                            {link.url.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pl-4">
                <button
                    onClick={() => onEdit(link)}
                    className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-purple-100"
                    title="Edit Link"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={() => onDelete(link.id)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-red-100"
                    title="Delete Link"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

// ==========================
// Main Link Manager Component
// ==========================
export default function LinkManager({ onUpdate, profileId }) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [formData, setFormData] = useState({ title: '', url: '', platform: 'website' });

    const platforms = [
        { id: 'website', label: 'Website', icon: <ExternalLink size={20} className="text-gray-400" />, brandColor: '#ffffff', plainIcon: <ExternalLink size={20} className="text-gray-400" /> },
        { id: 'instagram', label: 'Instagram', icon: <Instagram size={20} className="text-[#E1306C]" />, brandColor: '#ffffff', plainIcon: <Instagram size={20} className="text-[#E1306C]" /> },
        { id: 'facebook', label: 'Facebook', icon: <Facebook size={20} className="text-white" />, brandColor: '#1877F2', plainIcon: <Facebook size={20} className="text-white" /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={20} className="text-white" />, brandColor: '#25D366', plainIcon: <MessageCircle size={20} className="text-white" /> },
        { id: 'pinterest', label: 'Pinterest', icon: <div className="font-bold text-lg text-white">P</div>, brandColor: '#BD0812', plainIcon: <div className="font-bold text-lg text-white">P</div> },
        { id: 'youtube', label: 'YouTube', icon: <Youtube size={20} className="text-white" />, brandColor: '#FF0000', plainIcon: <Youtube size={20} className="text-white" /> },
        { id: 'twitter', label: 'Twitter', icon: <Twitter size={20} className="text-white" />, brandColor: '#1DA1F2', plainIcon: <Twitter size={20} className="text-white" /> },
        { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={20} className="text-white" />, brandColor: '#0A66C2', plainIcon: <Linkedin size={20} className="text-white" /> }
    ];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (profileId) fetchLinks();
    }, [profileId]);

    const fetchLinks = async () => {
        try {
            const res = await api.get(`/links?profile_id=${profileId}`);
            setLinks(res.data.links);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setLinks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Sync with backend
                const orderedIds = newOrder.map(link => link.id);
                api.put('/links/reorder', { orderedIds, profile_id: profileId }).then(() => {
                    if (onUpdate) onUpdate();
                }).catch(err => console.error("Reorder failed", err));

                return newOrder;
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/links/${id}`);
            setLinks(links.filter(l => l.id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleEdit = (link) => {
        setEditingLink(link);
        setFormData({ title: link.title, url: link.url, platform: link.platform || 'website' });
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingLink(null);
        setFormData({ title: '', url: '', platform: 'website' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check for protocol if URL is provided
            let url = formData.url.trim();
            if (url && !/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const payload = { ...formData, url, profile_id: profileId };

            if (editingLink) {
                const res = await api.put(`/links/${editingLink.id}`, payload);
                setLinks(links.map(l => l.id === editingLink.id ? res.data.link : l));
            } else {
                const res = await api.post('/links', payload);
                setLinks([...links, res.data.link]);
            }
            if (onUpdate) onUpdate();
            setIsModalOpen(false);
        } catch (err) {
            alert("Error saving link");
        }
    };

    const username = JSON.parse(localStorage.getItem('user'))?.username || 'me';

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Links</h2>
                    <p className="text-sm text-gray-400 font-medium">Manage and organize your profile links</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold text-sm shadow-lg shadow-purple-200 active:scale-95 group"
                >
                    <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                        <Plus size={18} />
                    </div>
                    Add New Link
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-100 border-t-purple-600"></div>
                    <p className="text-sm font-bold text-gray-400 animate-pulse">Synchronizing Links...</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={links.map(l => l.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {links.map((link) => (
                                <SortableLinkItem
                                    key={link.id}
                                    link={link}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    platforms={platforms}
                                />
                            ))}
                            {links.length === 0 && (
                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
                                        <Plus className="text-purple-600" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">No links found</h3>
                                    <p className="text-gray-400 font-medium max-w-[250px] mx-auto text-sm">Start building your profile by adding your first important link.</p>
                                    <button
                                        onClick={handleAdd}
                                        className="mt-8 px-8 py-3 bg-white text-purple-600 border border-purple-100 rounded-2xl font-bold text-sm hover:bg-purple-50 transition-all shadow-sm"
                                    >
                                        Create First Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Simplified Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingLink ? 'Edit Link' : 'Add New Link'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Platform</label>
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, platform: p.id })}
                                            className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${formData.platform === p.id
                                                ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                                                : 'border-gray-100 bg-gray-50/50 hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${formData.platform === p.id ? 'shadow-purple-200' : ''
                                                    }`}
                                                style={{ backgroundColor: p.brandColor }}
                                            >
                                                {p.plainIcon}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.platform === p.id ? 'text-purple-600' : 'text-gray-400'
                                                }`}>
                                                {p.label}
                                            </span>
                                            {formData.platform === p.id && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. My Instagram"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="instagram.com/user"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
                                >
                                    {editingLink ? 'Save' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
