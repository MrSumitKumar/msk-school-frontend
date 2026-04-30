import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsApi, authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/authStore';
import {
    School, Globe, Calendar, Award,
    Settings as SettingsIcon, Shield, Camera, Save,
    Loader2, DollarSign, Clock, Layout, X, Smartphone
} from 'lucide-react';

const tabs = [
    { id: 'profile', label: 'School Profile', icon: School },
    { id: 'academic', label: 'Academic Settings', icon: Award },
    { id: 'preferences', label: 'Preferences', icon: Layout },
    { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({});
    const [logoPreview, setLogoPreview] = useState(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });

    const { data: settings, isLoading } = useQuery({
        queryKey: ['school-settings'],
        queryFn: schoolsApi.getSettings
    });

    useEffect(() => {
        if (settings) {
            console.log('Settings Loaded:', settings);
            setFormData(settings);
            if (settings.logo) setLogoPreview(settings.logo);
        }
    }, [settings]);

    // Live preview theme exactly when user clicks (before saving)
    useEffect(() => {
        if (formData.theme_preference === 'light') {
            document.body.classList.add('light-theme');
        } else if (formData.theme_preference === 'dark') {
            document.body.classList.remove('light-theme');
        }

        return () => {
            const { user } = useAuthStore.getState();
            if (user?.theme_preference === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        };
    }, [formData.theme_preference]);

    const mutation = useMutation({
        mutationFn: (data) => schoolsApi.updateSettings(data),
        onSuccess: (updatedSchool) => {
            console.log('Update Success Data:', updatedSchool);
            queryClient.invalidateQueries(['school-settings']);

            // Update auth store correctly by merging
            const { user: currentUser, updateUser } = useAuthStore.getState();
            updateUser({
                ...currentUser,
                theme_preference: updatedSchool.theme_preference,
                school_name: updatedSchool.name,
                school_logo: updatedSchool.logo,
                android_app_url: updatedSchool.android_app_url,
                ios_app_url: updatedSchool.ios_app_url
            });

            toast.success('Settings updated successfully');
        },
        onError: (err) => {
            console.error('API Update Error:', err.response?.data || err.message);
            const errorMsg = err.response?.data
                ? (typeof err.response.data === 'object' ? Object.values(err.response.data).flat()[0] : err.response.data)
                : 'Failed to update settings';
            toast.error(errorMsg);
        }
    });

    const passwordMutation = useMutation({
        mutationFn: (data) => authApi.changePassword({ old_password: data.old_password, new_password: data.new_password }),
        onSuccess: () => {
            toast.success('Password changed successfully');
            setIsPasswordModalOpen(false);
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        },
        onError: (err) => {
            const errorMsg = err.response?.data
                ? (typeof err.response.data === 'object' ? Object.values(err.response.data).flat()[0] : err.response.data)
                : 'Failed to change password';
            toast.error(errorMsg);
        }
    });

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            return toast.error('New passwords do not match');
        }
        if (passwordForm.new_password.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        passwordMutation.mutate(passwordForm);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, logo: file }));
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const data = new FormData();

        // Allowed fields based on SchoolSettingsSerializer
        const allowedFields = [
            'name', 'board_type', 'address', 'city', 'state', 'pincode',
            'contact_email', 'contact_phone', 'logo', 'website',
            'principal_name', 'school_code', 'academic_year',
            'grading_system', 'timezone', 'currency', 'theme_preference',
            'android_app_url', 'ios_app_url'
        ];

        allowedFields.forEach(key => {
            const value = formData[key];
            if (key === 'logo') {
                if (value instanceof File) {
                    data.append('logo', value);
                }
            } else {
                // Append value, even if empty string (to allow clearing fields)
                data.append(key, value === null || value === undefined ? '' : value);
            }
        });

        console.log('Submitting Settings Update...');
        mutation.mutate(data);
    };

    if (isLoading) return (
        <div className="flex-center" style={{ height: '60vh' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
        </div>
    );

    return (
        <div className="settings-container">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-secondary text-sm">Manage your school profile and system preferences</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={mutation.isLoading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        color: 'white', border: 'none', borderRadius: 14,
                        fontSize: 14, fontWeight: 700, cursor: mutation.isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)',
                        transition: 'all 0.25s ease',
                        opacity: mutation.isLoading ? 0.75 : 1
                    }}
                    onMouseEnter={e => { if (!mutation.isLoading) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(79,70,229,0.55)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0px)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(79,70,229,0.3)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(79,70,229,0.55)'; }}
                >
                    {mutation.isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {mutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="settings-layout">
                {/* Tabs Sidebar */}
                <div className="settings-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="settings-content card">
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="section-title">General Information</div>

                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="logo-upload">
                                        <div className="logo-preview">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="School Logo" />
                                            ) : (
                                                <School size={48} color="var(--text-secondary)" />
                                            )}
                                            <label className="logo-edit-btn">
                                                <Camera size={16} />
                                                <input type="file" hidden onChange={handleLogoChange} accept="image/*" />
                                            </label>
                                        </div>
                                        <div className="text-xs text-secondary mt-2 text-center">School Logo</div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                                        <div className="input-group">
                                            <label>School Name (Locked)</label>
                                            <input
                                                name="name"
                                                value={formData.name || ''}
                                                onChange={handleChange}
                                                required
                                                readOnly
                                                title="School name is locked for data integrity"
                                                style={{ opacity: 0.7, cursor: 'not-allowed', borderStyle: 'dashed' }}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Principal Name</label>
                                            <input name="principal_name" value={formData.principal_name || ''} onChange={handleChange} />
                                        </div>
                                        <div className="input-group">
                                            <label>School Code</label>
                                            <input name="school_code" value={formData.school_code || ''} onChange={handleChange} />
                                        </div>
                                        <div className="input-group">
                                            <label>Board Type</label>
                                            <select name="board_type" value={formData.board_type || ''} onChange={handleChange}>
                                                <option value="cbse">CBSE</option>
                                                <option value="icse">ICSE</option>
                                                <option value="up_board">UP Board</option>
                                                <option value="state">State Board</option>
                                                <option value="ib">IB</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="section-title pt-4">Contact Details</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="input-group">
                                        <label>Email Address</label>
                                        <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Phone Number</label>
                                        <input name="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label>Website</label>
                                        <input type="url" name="website" value={formData.website || ''} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="section-title pt-4">Location</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="input-group col-span-2">
                                        <label>Address</label>
                                        <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2} />
                                    </div>
                                    <div className="input-group">
                                        <label>City</label>
                                        <input name="city" value={formData.city || ''} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label>State</label>
                                        <input name="state" value={formData.state || ''} onChange={handleChange} />
                                    </div>
                                    <div className="input-group">
                                        <label>Pincode / ZIP</label>
                                        <input name="pincode" value={formData.pincode || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'academic' && (
                            <div className="space-y-6">
                                <div className="section-title">Academic Configuration</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Calendar size={16} /> Current Academic Year
                                        </label>
                                        <input name="academic_year" value={formData.academic_year || ''} onChange={handleChange} placeholder="e.g. 2024-25" />
                                    </div>
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Award size={16} /> Grading System
                                        </label>
                                        <select name="grading_system" value={formData.grading_system || 'Percentage'} onChange={handleChange}>
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="CGPA">CGPA (10 Point Scale)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="section-title pt-4">Mobile App Access</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Smartphone size={16} /> Android App URL (APK Link)
                                        </label>
                                        <input
                                            name="android_app_url"
                                            type="url"
                                            value={formData.android_app_url || ''}
                                            onChange={handleChange}
                                            placeholder="https://drive.google.com/file/d/..."
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Smartphone size={16} /> iOS App URL (Link)
                                        </label>
                                        <input
                                            name="ios_app_url"
                                            type="url"
                                            value={formData.ios_app_url || ''}
                                            onChange={handleChange}
                                            placeholder="https://apps.apple.com/..."
                                        />
                                    </div>
                                </div>

                                <div className="info-box mt-4">
                                    <h4 className="font-semibold text-sm mb-1">About Grading Systems</h4>
                                    <p className="text-xs text-secondary">
                                        Changing the grading system will affect how new exam results are calculated and displayed on student reports.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <div className="section-title">System Preferences</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Clock size={16} /> Timezone
                                        </label>
                                        <select name="timezone" value={formData.timezone || 'Asia/Kolkata'} onChange={handleChange}>
                                            <option value="Asia/Kolkata">IST (GMT+5:30) - India</option>
                                            <option value="UTC">UTC (GMT+0:00)</option>
                                            <option value="America/New_York">EST (GMT-5:00) - New York</option>
                                            <option value="Europe/London">GMT (GMT+0:00) - London</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <DollarSign size={16} /> Currency
                                        </label>
                                        <select name="currency" value={formData.currency || 'INR'} onChange={handleChange}>
                                            <option value="INR">INR (₹) - Indian Rupee</option>
                                            <option value="USD">USD ($) - US Dollar</option>
                                            <option value="GBP">GBP (£) - British Pound</option>
                                            <option value="EUR">EUR (€) - Euro</option>
                                            <option value="EUR">EUR (€) - Crypto currency</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="flex items-center gap-2">
                                            <Layout size={16} /> Theme Preference
                                        </label>
                                        <div className="flex gap-4 mt-2">
                                            <label
                                                className={`theme-option cursor-pointer p-4 rounded-xl border flex items-center gap-3 flex-1 transition-all ${formData.theme_preference === 'dark' ? 'active-theme' : ''}`}
                                                style={{
                                                    borderColor: formData.theme_preference === 'dark' ? 'var(--primary)' : 'var(--border)',
                                                    background: formData.theme_preference === 'dark' ? 'rgba(79, 70, 229, 0.1)' : 'transparent'
                                                }}
                                            >
                                                <input type="radio" name="theme_preference" value="dark" checked={formData.theme_preference === 'dark'} onChange={handleChange} className="hidden" />
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--primary)', background: formData.theme_preference === 'dark' ? 'var(--primary)' : 'transparent' }} />
                                                <span className="text-sm font-medium">Dark Mode</span>
                                            </label>
                                            <label
                                                className={`theme-option cursor-pointer p-4 rounded-xl border flex items-center gap-3 flex-1 transition-all ${formData.theme_preference === 'light' ? 'active-theme' : ''}`}
                                                style={{
                                                    borderColor: formData.theme_preference === 'light' ? 'var(--primary)' : 'var(--border)',
                                                    background: formData.theme_preference === 'light' ? 'rgba(79, 70, 229, 0.1)' : 'transparent'
                                                }}
                                            >
                                                <input type="radio" name="theme_preference" value="light" checked={formData.theme_preference === 'light'} onChange={handleChange} className="hidden" />
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--primary)', background: formData.theme_preference === 'light' ? 'var(--primary)' : 'transparent' }} />
                                                <span className="text-sm font-medium">Light Mode</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="section-title">Security & Access</div>

                                {/* Change Password Card */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Shield size={22} color="var(--primary)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Change Admin Password</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Keep your account secure by using a strong, unique password.</p>
                                    </div>
                                    <button type="button" className="security-btn" onClick={() => setIsPasswordModalOpen(true)}>
                                        <Shield size={15} /> Change Password
                                    </button>
                                </div>

                                {/* 2FA Card */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--overlay)', border: '1px dashed var(--border)', borderRadius: 16, opacity: 0.7 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Shield size={22} color="#F59E0B" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Two-Factor Authentication</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Add an extra layer of security to your school admin account.</p>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>Coming Soon</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }}>
                        {/* Modal Header */}
                        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #3730A3) 100%)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Change Password</h2>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Update your admin credentials</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(false)}
                                style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.5)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handlePasswordSubmit}>
                            <div style={{ padding: '28px 28px 20px' }}>
                                <div className="input-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter your current password"
                                        value={passwordForm.old_password}
                                        onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="At least 8 characters"
                                        value={passwordForm.new_password}
                                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Re-enter new password"
                                        value={passwordForm.confirm_password}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => { setIsPasswordModalOpen(false); setPasswordForm({ old_password: '', new_password: '', confirm_password: '' }); }}
                                    style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)' }}
                                    onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; }}
                                    onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(239,68,68,0.35)'; }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={passwordMutation.isPending}
                                    style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)'; }}
                                >
                                    <Shield size={15} />
                                    {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .settings-container {
                    --setting-overlay: var(--overlay-light);
                    --setting-overlay-hover: var(--overlay-heavy);
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .security-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 11px 22px;
                    background: linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
                    transition: all 0.2s ease;
                }
                .security-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.5);
                    background: linear-gradient(135deg, #5A52F0 0%, #8B46F5 100%);
                }
                .security-btn:active {
                    transform: translateY(0px);
                    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
                }
                body.light-theme .settings-container {
                    --setting-overlay: rgba(0, 0, 0, 0.03);
                    --setting-overlay-hover: rgba(0, 0, 0, 0.06);
                }
                .settings-layout {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 32px;
                    margin-top: 24px;
                    align-items: start;
                }
                @media (max-width: 992px) {
                    .settings-layout { grid-template-columns: 1fr; }
                    .settings-tabs { 
                        display: flex; 
                        overflow-x: auto; 
                        gap: 8px; 
                        padding-bottom: 12px;
                        margin-bottom: 16px; 
                    }
                    .settings-tab-btn { white-space: nowrap; flex: 0 0 auto; }
                }
                .settings-tabs {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    position: sticky;
                    top: 24px;
                }
                .settings-tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    color: var(--text-secondary);
                    font-size: 14px;
                    font-weight: 600;
                    background: transparent;
                    border: 1px solid transparent;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                }
                .settings-tab-btn:hover { 
                    background: var(--setting-overlay-hover); 
                    color: var(--text-primary);
                    transform: translateX(4px);
                }
                .settings-tab-btn.active { 
                    background: var(--primary); 
                    color: white;
                    box-shadow: 0 8px 16px -4px rgba(var(--primary-rgb, 99, 102, 241), 0.4);
                }
                
                .settings-content {
                    padding: 32px;
                    border-radius: 20px;
                    background: var(--card);
                    border: 1px solid var(--border);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
                }

                .section-title {
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding-bottom: 10px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid var(--border);
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .input-group label {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-left: 2px;
                }
                .input-group input, .input-group select, .input-group textarea {
                    background: var(--dark);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: var(--text-primary);
                    font-size: 14px;
                    transition: all 0.2s ease;
                    outline: none;
                }
                .input-group input:focus, .input-group select:focus, .input-group textarea:focus {
                    border-color: var(--primary);
                    background: var(--dark-card);
                    box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 99, 102, 241), 0.15);
                }
                
                .logo-upload {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 20px;
                    background: var(--setting-overlay);
                    border-radius: 20px;
                    border: 2px dashed var(--border);
                }
                .logo-preview {
                    width: 120px;
                    height: 120px;
                    border-radius: 24px;
                    background: var(--dark-card);
                    border: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .logo-preview img { width: 100%; height: 100%; object-fit: contain; padding: 12px; }
                
                .logo-edit-btn {
                    position: absolute;
                    bottom: -8px;
                    right: -8px;
                    width: 36px;
                    height: 36px;
                    background: var(--primary);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    border: 3px solid var(--card);
                    transition: transform 0.2s;
                }
                .logo-edit-btn:hover { transform: scale(1.1) rotate(5deg); }
                
                .theme-option {
                    position: relative;
                    background: var(--setting-overlay);
                    border: 2px solid var(--border);
                    border-radius: 15px;
                    padding: 16px;
                    transition: all 0.2s;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .theme-option:has(input:checked) {
                    border-color: var(--primary);
                    background: rgba(var(--primary-rgb, 99, 102, 241), 0.05);
                }
                .theme-option input { width: 18px; height: 18px; accent-color: var(--primary); }

                .card-inner {
                    background: var(--setting-overlay);
                    border: 1px solid var(--border);
                    transition: all 0.2s;
                }
                .card-inner:hover {
                    background: var(--setting-overlay-hover);
                    border-color: var(--border);
                }
                
                .info-box {
                    background: rgba(59, 130, 246, 0.08);
                    border-left: 4px solid #3b82f6;
                    padding: 16px;
                    border-radius: 0 12px 12px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                /* Grid Helpers */
                .grid { display: grid; }
                .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                @media (min-width: 768px) {
                    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                }
                .gap-4 { gap: 1rem; }
                .gap-6 { gap: 1.5rem; }
                .gap-8 { gap: 2rem; }
                .w-full { width: 100%; }
                .flex-1 { flex: 1 1 0%; }
                .items-center { align-items: center; }
                .items-start { align-items: flex-start; }
                .justify-between { justify-content: space-between; }
                .space-y-6 > * + * { margin-top: 1.5rem; }
            `}</style>
        </div>
    );
}
