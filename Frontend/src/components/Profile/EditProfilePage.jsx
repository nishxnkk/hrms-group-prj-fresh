
import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Camera, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = ({ onCancel, onSave }) => {
    const navigate = useNavigate();
    const [storedUser, setStoredUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    });

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [designation, setDesignation] = useState('');
    const [gender, setGender] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fullname = storedUser?.fullname || '';
        const parts = fullname.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        setEmail(storedUser?.email || '');
        setDesignation(storedUser?.designation || '');
        setGender(storedUser?.gender || '');
        // Use profile_picture if available, otherwise null
        setPreviewUrl(storedUser?.profile_picture || null);
    }, [storedUser]);

    // ensure inputs are focusable
    const firstNameRef = useRef(null);
    useEffect(() => {
        if (firstNameRef.current) {
            firstNameRef.current.focus();
        }
        const onStorage = (e) => {
            if (e.key === 'user') {
                try { setStoredUser(JSON.parse(e.newValue)); } catch { setStoredUser(null); }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setIsRemovingPhoto(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null); // Clear preview to show default icon
        setIsRemovingPhoto(true);
        // Clear file input so same file can be selected again if user changes mind immediately
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to update your profile.');
            setSaving(false);
            return;
        }
        const id = storedUser?.id;
        const fullname = `${firstName} ${lastName} `.trim();

        const formData = new FormData();
        formData.append('fullname', fullname);
        formData.append('email', email);
        formData.append('designation', designation);
        formData.append('gender', gender || 'Not Specified');

        if (isRemovingPhoto) {
            formData.append('profile_picture', ""); // Send empty string to remove it
        } else if (selectedFile) {
            formData.append('profile_picture', selectedFile);
        }

        try {
            // Note: When using FormData, do NOT set Content-Type header manually, let browser set it with boundary
            const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
            const res = await fetch(`${base}/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Update failed');
                return;
            }

            // update localStorage and navigate back to profile
            // Ensure we merge existing user data with updates to keep other fields valid
            const newUser = { ...storedUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(newUser));

            // Dispatch event so Sidebar updates immediately
            window.dispatchEvent(new Event("user-updated"));

            if (onSave) onSave(newUser);
            setSuccess('Profile updated successfully');

            // reflect change immediately
            setTimeout(() => window.location.href = '/profile', 800);
        } catch (err) {
            console.error('Update error:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 border-b-2 border-gray-900 dark:border-slate-700 inline-block mb-12 pb-1">Edit Profile</h1>

            <div className="flex flex-col items-center mb-12">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-lg relative flex items-center justify-center">
                        {previewUrl ? (
                            <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-gray-400 dark:text-slate-400" />
                        )}
                    </div>

                    {/* Overlay for hover effect */}
                    <div className="absolute inset-0 bg-black dark:bg-slate-600 bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white w-8 h-8" />
                    </div>

                    <div className="absolute bottom-0 right-0 bg-[#266ECD] dark:bg-slate-600 p-2 rounded-full border-2 border-white text-white z-10">
                        <Pencil size={16} />
                    </div>

                    {/* Delete Button */}
                    <button type="button" onClick={handleRemovePhoto} className="absolute top-0 right-0 bg-red-500 dark:bg-slate-600 p-2 rounded-full border-2 border-white text-white hover:bg-red-600 transition z-20" title="Remove photo">
                        <Trash2 size={16} />
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-4">{firstName} {lastName}</h2>
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Details</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">First Name</label>
                        <input ref={firstNameRef} value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#266ECD] focus:border-transparent" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Last Name</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#266ECD] focus:border-transparent" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#266ECD] focus:border-transparent" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Designation</label>
                        <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:hover-slate-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#266ECD] focus:border-transparent">
                            <option value="">Select designation</option>
                            <option value="HR">HR</option>
                            <option value="Developer">Developer</option>
                            <option value="Manager">Manager</option>
                            <option value="Designer">Designer</option>
                            <option value="Intern">Intern</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:hover-slate-700 rounded-lg px-4 py-2.5 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#266ECD] focus:border-transparent">
                            <option value="">Prefer not to say</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    {success && <p className="text-green-600 text-sm mb-2">{success}</p>}
                </div>
                <div className="flex justify-center gap-4 mt-6 pt-4">
                    <button onClick={onCancel} className="px-8 py-2.5 rounded-full bg-gray-400 dark:bg-slate-600 text-white font-bold hover:bg-gray-500 dark:hover-slate-700 transition">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 rounded-full bg-[#0066FF] text-white font-bold hover:bg-blue-600 transition">{saving ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;
