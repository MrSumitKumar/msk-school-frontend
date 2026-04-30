import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '../../services/api';
import { Plus, Search, Trash2, Edit2, GraduationCap, UserPlus } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
    user: { email: '', password: 'Admin@123', first_name: '', last_name: '', phone: '' },
    profile: { employee_id: '', designation: '', department: '', qualification: '', experience_years: 0, joining_date: '' },
};

export default function TeachersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState({ isOpen: false, item: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
    const [deletingId, setDeletingId] = useState(null); // For row fade-out
    const [form, setForm] = useState(INITIAL_FORM);

    const { data, isLoading } = useQuery({
        queryKey: ['teachers', search],
        queryFn: () => teachersApi.list({ search }),
    });
    const teachers = data?.results || data || [];

    const createMutation = useMutation({
        mutationFn: teachersApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['teachers']);
            setShowModal({ isOpen: false });
            toast.success('Teacher added successfully! 🎉');
        },
        onError: (err) => {
            const msg = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to add teacher.';
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => teachersApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries(['teachers']);
            setShowModal({ isOpen: false });
            toast.success('Teacher updated successfully! ✨');
        },
        onError: (err) => {
            const msg = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to update teacher.';
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: teachersApi.delete,
        onSuccess: () => {
            setDeletingId(deleteModal.item.id);
            // Delay invalidation to let animation play
            setTimeout(() => {
                qc.invalidateQueries(['teachers']);
                setDeleteModal({ isOpen: false, item: null });
                setDeletingId(null);
                toast.success('Moved to Trash');
            }, 300);
        }
    });

    const openModal = (item = null) => {
        if (item) {
            setForm({
                user: {
                    email: item.user?.email || '',
                    first_name: item.user?.first_name || '',
                    last_name: item.user?.last_name || '',
                    phone: item.user?.phone || ''
                },
                profile: {
                    employee_id: item.employee_id || '',
                    designation: item.designation || '',
                    department: item.department || '',
                    qualification: item.qualification || '',
                    experience_years: item.experience_years || 0,
                    joining_date: item.joining_date || ''
                },
            });
            setShowModal({ isOpen: true, item });
        } else {
            setForm(INITIAL_FORM);
            setShowModal({ isOpen: true, item: null });
        }
    };

    const closeModal = () => {
        setShowModal({ isOpen: false, item: null });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            profile: {
                ...form.profile,
                joining_date: form.profile.joining_date || null,
            },
        };

        if (showModal.item) {
            updateMutation.mutate({ id: showModal.item.id, data: payload.profile });
        } else {
            createMutation.mutate(payload);
        }
    };

    const setUser = (k, v) => setForm(f => ({ ...f, user: { ...f.user, [k]: v } }));
    const setProfile = (k, v) => setForm(f => ({ ...f, profile: { ...f.profile, [k]: v } }));

    return (
        <div>
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Teachers</h1>
                    <p className="page-subtitle">Manage teaching staff and assignments</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={16} /> Add Teacher
                </button>
            </div>

            {/* ── Search ── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div className="search-bar">
                    <Search size={16} color="var(--text-secondary)" />
                    <input
                        placeholder="Search teachers..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass-card" style={{ overflow: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                        <div className="animate-pulse">Loading teachers...</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Designation</th>
                                <th>Department</th>
                                <th>Experience</th>
                                <th>Class Teacher</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map((t, i) => (
                                <tr key={t.id} className={deletingId === t.id ? 'row-fade-out' : ''}>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{i + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div
                                                className="bg-gradient-success"
                                                style={{
                                                    width: 32, height: 32, borderRadius: 10,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                                                }}
                                            >
                                                {t.user?.first_name?.[0]}{t.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{t.user?.first_name} {t.user?.last_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.employee_id || 'Generating...'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.user?.email}</td>
                                    <td>{t.designation || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.department || '—'}</td>
                                    <td>{t.experience_years} yrs</td>
                                    <td>
                                        {t.is_class_teacher
                                            ? <span className="badge badge-success" style={{ fontSize: 10 }}>Yes — {t.class_teacher_section}</span>
                                            : <span className="badge badge-info" style={{ fontSize: 10 }}>No</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`badge ${t.user?.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                                            {t.user?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => openModal(t)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                                                title="Edit teacher"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, item: t })}
                                                disabled={deleteMutation.isPending}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                                                title="Delete teacher"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teachers.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: 60 }}>
                                        <GraduationCap size={48} color="var(--text-secondary)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <p style={{ color: 'var(--text-secondary)' }}>No teachers found. Add your first teacher!</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={() => deleteMutation.mutate(deleteModal.item.id)}
                itemName={`${deleteModal.item?.user?.first_name} ${deleteModal.item?.user?.last_name}`}
                isLoading={deleteMutation.isPending}
                error={deleteMutation.error?.response?.data?.detail || deleteMutation.error?.message}
            />

            {/* ── Add/Edit Teacher Modal ── */}
            {showModal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: 10, borderRadius: 12, color: 'var(--success)' }}>
                                <UserPlus size={24} />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                                {showModal.item ? 'Edit Teacher Profile' : 'Add New Teacher'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Account Details */}
                            {!showModal.item && (
                                <>
                                    <p style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        1. Account Credentials
                                    </p>
                                    <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                                        <div>
                                            <label className="form-label">First Name *</label>
                                            <input className="form-input" required value={form.user.first_name} onChange={e => setUser('first_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label">Last Name *</label>
                                            <input className="form-input" required value={form.user.last_name} onChange={e => setUser('last_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label">Email Address *</label>
                                            <input className="form-input" type="email" required value={form.user.email} onChange={e => setUser('email', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label">Phone Number</label>
                                            <input className="form-input" value={form.user.phone} onChange={e => setUser('phone', e.target.value)} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label">Password</label>
                                            <input className="form-input" type="password" value={form.user.password} onChange={e => setUser('password', e.target.value)} placeholder="Leave blank for Admin@123" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Professional Info */}
                            <p style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {showModal.item ? 'Professional Information' : '2. Professional Details'}
                            </p>
                            <div className="grid-2" style={{ gap: 16 }}>
                                <div>
                                    <label className="form-label">Employee ID</label>
                                    <input
                                        className="form-input"
                                        readOnly={!showModal.item}
                                        placeholder={!showModal.item ? "Auto-generated" : "EMP ID"}
                                        value={form.profile.employee_id}
                                        onChange={e => setProfile('employee_id', e.target.value)}
                                        style={!showModal.item ? { background: 'var(--overlay-light)', cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Designation</label>
                                    <input className="form-input" placeholder="e.g. Senior Teacher" value={form.profile.designation} onChange={e => setProfile('designation', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Department</label>
                                    <input className="form-input" placeholder="e.g. Mathematics" value={form.profile.department} onChange={e => setProfile('department', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Qualification</label>
                                    <input className="form-input" placeholder="e.g. M.Sc, B.Ed" value={form.profile.qualification} onChange={e => setProfile('qualification', e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Experience (years)</label>
                                    <input className="form-input" type="number" min={0} value={form.profile.experience_years} onChange={e => setProfile('experience_years', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="form-label">Joining Date</label>
                                    <input className="form-input" type="date" value={form.profile.joining_date} onChange={e => setProfile('joining_date', e.target.value)} />
                                </div>
                            </div>

                            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" style={{ padding: '10px 20px' }} onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }} disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (showModal.item ? 'Update Profile' : 'Add Teacher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
