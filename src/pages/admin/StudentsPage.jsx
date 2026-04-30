import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, academicsApi } from '../../services/api';
import { Plus, Search, Trash2, Edit2, Filter, UserPlus } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

export default function StudentsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [showModal, setShowModal] = useState({ isOpen: false, item: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
    const [deletingId, setDeletingId] = useState(null);

    const initialForm = {
        user: { email: '', password: 'Student@123', first_name: '', last_name: '', phone: '' },
        profile: { admission_number: '', grade: '', section: '', roll_number: '', date_of_birth: '', parent_name: '', parent_contact: '' }
    };
    const [form, setForm] = useState(initialForm);

    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['students', search, filterClass],
        queryFn: () => studentsApi.list({ search, grade: filterClass })
    });
    const { data: gradesData } = useQuery({ queryKey: ['grades'], queryFn: () => academicsApi.getGrades() });

    // Fetch sections for the selected class in form
    const { data: sectionsData } = useQuery({
        queryKey: ['sections', form.profile.grade],
        queryFn: () => academicsApi.getSections(form.profile.grade),
        enabled: !!form.profile.grade
    });

    const students = studentsData?.results || studentsData || [];
    const grades = gradesData?.results || gradesData || [];
    const sections = sectionsData?.results || sectionsData || [];

    const createMutation = useMutation({
        mutationFn: studentsApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['students']);
            setShowModal({ isOpen: false });
            toast.success('Student added successfully');
        },
        onError: (err) => {
            const data = err.response?.data;
            let msg = 'Failed to add student';
            if (data && typeof data === 'object') {
                msg = data.error || Object.values(data).flat().join(', ') || msg;
            }
            toast.error(msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => studentsApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries(['students']);
            setShowModal({ isOpen: false });
            toast.success('Student updated successfully');
        },
        onError: (err) => {
            const data = err.response?.data;
            let msg = 'Failed to update student';
            if (data && typeof data === 'object') {
                msg = data.error || Object.values(data).flat().join(', ') || msg;
            }
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: studentsApi.delete,
        onSuccess: () => {
            setDeletingId(deleteModal.item.id);
            setTimeout(() => {
                qc.invalidateQueries(['students']);
                setDeleteModal({ isOpen: false, item: null });
                setDeletingId(null);
                toast.success('Moved to Trash');
            }, 300);
        }
    });

    const openModal = (item = null) => {
        if (item) {
            setForm({
                user: { email: item.user.email, first_name: item.user.first_name, last_name: item.user.last_name, phone: item.user.phone || '' },
                profile: {
                    admission_number: item.admission_number,
                    grade: item.grade,
                    section: item.section,
                    roll_number: item.roll_number,
                    date_of_birth: item.date_of_birth || '',
                    parent_name: item.parent_name || '',
                    parent_contact: item.parent_contact || ''
                }
            });
            setShowModal({ isOpen: true, item });
        } else {
            setForm(initialForm);
            setShowModal({ isOpen: true, item: null });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert empty strings to null for backend Date/Number validation
        const cleanProfile = { ...form.profile };
        Object.keys(cleanProfile).forEach(key => {
            if (cleanProfile[key] === '') cleanProfile[key] = null;
        });

        if (showModal.item) {
            updateMutation.mutate({ id: showModal.item.id, data: cleanProfile });
        } else {
            createMutation.mutate({ user: form.user, profile: cleanProfile });
        }
    };

    const setUser = (k, v) => setForm(f => ({ ...f, user: { ...f.user, [k]: v } }));
    const setProfile = (k, v) => setForm(f => {
        const newProfile = { ...f.profile, [k]: v };
        if (k === 'grade') newProfile.section = ''; // Reset section when class changes
        return { ...f, profile: newProfile };
    });

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage student enrollment, profiles, and class assignments</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> Add Student</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
                <div className="search-bar" style={{ minWidth: 280 }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input placeholder="Search name or admission no..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--overlay)', padding: '4px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <Filter size={14} color="var(--text-secondary)" />
                    <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', padding: '4px 0' }}
                    >
                        <option value="">All Classes</option>
                        {grades.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="glass-card" style={{ overflowX: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                        <div className="animate-pulse">Loading students...</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student Details</th>
                                <th>Adm. No.</th>
                                <th>Class & Section</th>
                                <th>Parent Info</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => (
                                <tr key={s.id} className={deletingId === s.id ? 'row-fade-out' : ''}>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{i + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="bg-gradient-primary" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {s.user?.first_name?.[0]}{s.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{s.user?.first_name} {s.user?.last_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'rgba(79,70,229,0.1)', padding: '4px 8px', borderRadius: 6 }}>{s.admission_number || 'PENDING'}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>Class {s.grade_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Section {s.section_name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13 }}>{s.parent_name || '—'}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.parent_contact || ''}</div>
                                    </td>
                                    <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button onClick={() => openModal(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }} title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, item: s })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>No students records found matching your criteria.</td></tr>}
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
            />

            {showModal.isOpen && (
                <div className="modal-overlay" onClick={() => setShowModal({ isOpen: false })}>
                    <div className="modal scale-in" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ background: 'rgba(79,70,229,0.1)', padding: 10, borderRadius: 12, color: 'var(--primary)' }}><UserPlus size={24} /></div>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{showModal.item ? 'Edit Student Profile' : 'Register New Student'}</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!showModal.item && (
                                <>
                                    <p style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>1. Account Credentials</p>
                                    <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                                        <div><label className="form-label">First Name *</label><input className="form-input" required value={form.user.first_name} onChange={e => setUser('first_name', e.target.value)} /></div>
                                        <div><label className="form-label">Last Name *</label><input className="form-input" required value={form.user.last_name} onChange={e => setUser('last_name', e.target.value)} /></div>
                                        <div><label className="form-label">Email Address *</label><input className="form-input" type="email" required value={form.user.email} onChange={e => setUser('email', e.target.value)} /></div>
                                        <div><label className="form-label">Phone Number</label><input className="form-input" value={form.user.phone} onChange={e => setUser('phone', e.target.value)} /></div>
                                    </div>
                                </>
                            )}

                            <p style={{ color: 'var(--primary)', fontSize: 12, marginBottom: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{showModal.item ? 'Profile Information' : '2. Academic & Personal Details'}</p>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                                <div><label className="form-label">Admission Number</label><input className="form-input" readOnly placeholder="Auto-generated" value={form.profile.admission_number} style={{ background: 'var(--overlay-light)', cursor: 'not-allowed' }} /></div>
                                <div><label className="form-label">Roll Number</label><input className="form-input" readOnly placeholder="Auto-generated per section" value={form.profile.roll_number || ''} style={{ background: 'var(--overlay-light)', cursor: 'not-allowed' }} /></div>

                                <div><label className="form-label">Preferred Class *</label>
                                    <select className="form-input" required value={form.profile.grade || ''} onChange={e => setProfile('grade', e.target.value)}>
                                        <option value="">Select Class</option>
                                        {grades.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                                    </select>
                                </div>
                                <div><label className="form-label">Assigned Section *</label>
                                    <select className="form-input" required value={form.profile.section || ''} onChange={e => setProfile('section', e.target.value)} disabled={!form.profile.grade}>
                                        <option value="">{form.profile.grade ? 'Select Section' : 'Select Class First'}</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                    </select>
                                </div>

                                <div><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.profile.date_of_birth} onChange={e => setProfile('date_of_birth', e.target.value)} /></div>
                                <div><label className="form-label">Parent/Guardian Name</label><input className="form-input" value={form.profile.parent_name} onChange={e => setProfile('parent_name', e.target.value)} /></div>
                                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Parent Contact Number</label><input className="form-input" value={form.profile.parent_contact} onChange={e => setProfile('parent_contact', e.target.value)} /></div>
                            </div>

                            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" style={{ padding: '12px 24px' }} onClick={() => setShowModal({ isOpen: false })}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? 'Processing...' : (showModal.item ? 'Update Profile' : 'Register Student')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
