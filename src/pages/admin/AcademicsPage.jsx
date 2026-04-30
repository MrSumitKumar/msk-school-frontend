import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsApi, teachersApi } from '../../services/api';
import { Plus, BookOpen, Layers, Edit2, Trash2, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

export default function AcademicsPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState('grades');
    const [showModal, setShowModal] = useState({ isOpen: false, type: 'grade', item: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: 'grade', item: null });

    const [formData, setFormData] = useState({
        name: '', level: 'primary', grade: '', class_teacher: '',
        code: '', start_date: '', end_date: '', is_active: false
    });

    const { data: gradesData } = useQuery({ queryKey: ['grades'], queryFn: () => academicsApi.getGrades() });
    const { data: subjectsData } = useQuery({ queryKey: ['subjects'], queryFn: () => academicsApi.getSubjects() });
    const { data: sessionsData } = useQuery({ queryKey: ['sessions'], queryFn: () => academicsApi.getSessions() });
    const { data: teachersData } = useQuery({ queryKey: ['teachers'], queryFn: () => teachersApi.list({ page_size: 200 }) });

    const grades = gradesData?.results || gradesData || [];
    const subjects = subjectsData?.results || subjectsData || [];
    const sessions = sessionsData?.results || sessionsData || [];
    const teachers = teachersData?.results || teachersData || [];

    const createGrade = useMutation({ mutationFn: academicsApi.createGrade, onSuccess: () => { qc.invalidateQueries(['grades']); setShowModal({ isOpen: false }); toast.success('Class created'); } });
    const updateGrade = useMutation({ mutationFn: ({ id, data }) => academicsApi.updateGrade(id, data), onSuccess: () => { qc.invalidateQueries(['grades']); setShowModal({ isOpen: false }); toast.success('Class updated'); } });
    const deleteGrade = useMutation({ mutationFn: academicsApi.deleteGrade, onSuccess: () => { qc.invalidateQueries(['grades']); setDeleteModal({ isOpen: false }); toast.success('Class deleted'); } });

    const createSection = useMutation({ mutationFn: academicsApi.createSection, onSuccess: () => { qc.invalidateQueries(['grades']); setShowModal({ isOpen: false }); toast.success('Section created'); } });
    const updateSection = useMutation({ mutationFn: ({ id, data }) => academicsApi.updateSection(id, data), onSuccess: () => { qc.invalidateQueries(['grades']); setShowModal({ isOpen: false }); toast.success('Section updated'); } });
    const deleteSection = useMutation({ mutationFn: academicsApi.deleteSection, onSuccess: () => { qc.invalidateQueries(['grades']); setDeleteModal({ isOpen: false }); toast.success('Section deleted'); } });

    const createSubject = useMutation({ mutationFn: academicsApi.createSubject, onSuccess: () => { qc.invalidateQueries(['subjects']); setShowModal({ isOpen: false }); toast.success('Subject created'); } });
    const updateSubject = useMutation({ mutationFn: ({ id, data }) => academicsApi.updateSubject(id, data), onSuccess: () => { qc.invalidateQueries(['subjects']); setShowModal({ isOpen: false }); toast.success('Subject updated'); } });
    const deleteSubject = useMutation({ mutationFn: academicsApi.deleteSubject, onSuccess: () => { qc.invalidateQueries(['subjects']); setDeleteModal({ isOpen: false }); toast.success('Subject deleted'); } });

    const createSession = useMutation({ mutationFn: academicsApi.createSession, onSuccess: () => { qc.invalidateQueries(['sessions']); setShowModal({ isOpen: false }); toast.success('Session created'); } });
    const updateSession = useMutation({ mutationFn: ({ id, data }) => academicsApi.updateSession(id, data), onSuccess: () => { qc.invalidateQueries(['sessions']); setShowModal({ isOpen: false }); toast.success('Session updated'); } });
    const deleteSession = useMutation({ mutationFn: academicsApi.deleteSession, onSuccess: () => { qc.invalidateQueries(['sessions']); setDeleteModal({ isOpen: false }); toast.success('Session deleted'); } });

    const bulkCreateGrades = useMutation({
        mutationFn: academicsApi.bulkCreateGrades,
        onSuccess: (res) => {
            qc.invalidateQueries(['grades']);
            toast.success(res.message || 'Standard classes added');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to setup classes')
    });

    const tabs = [
        { id: 'grades', label: 'Classes & Sections', icon: Layers },
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'sessions', label: 'Academic Sessions', icon: BookOpen },
    ];

    const openModal = (type, item = null) => {
        setShowModal({ isOpen: true, type, item });
        if (item) {
            if (type === 'grade') {
                setFormData({ name: item.name, level: item.level || 'primary' });
            } else if (type === 'section') {
                setFormData({ name: item.name, grade: item.grade, class_teacher: item.class_teacher || '' });
            } else if (type === 'subject') {
                setFormData({ name: item.name, code: item.code || '' });
            } else if (type === 'session') {
                setFormData({ name: item.name, start_date: item.start_date, end_date: item.end_date, is_active: item.is_active });
            }
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                level: 'primary',
                class_teacher: '',
                code: '',
                start_date: '',
                end_date: '',
                is_active: false,
                // Preserve grade if we're adding a section to a specific class
                grade: type === 'section' ? prev.grade : ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const type = showModal.type;
        const item = showModal.item;

        if (type === 'grade') {
            if (item) updateGrade.mutate({ id: item.id, data: { name: formData.name, level: formData.level } });
            else createGrade.mutate({ name: formData.name, level: formData.level });
        } else if (type === 'section') {
            const data = {
                name: formData.name,
                grade: formData.grade,
                class_teacher: formData.class_teacher || null
            };
            if (item) updateSection.mutate({ id: item.id, data });
            else createSection.mutate(data);
        } else if (type === 'subject') {
            const data = { name: formData.name, code: formData.code };
            if (item) updateSubject.mutate({ id: item.id, data });
            else createSubject.mutate(data);
        } else if (type === 'session') {
            const data = { name: formData.name, start_date: formData.start_date, end_date: formData.end_date, is_active: formData.is_active };
            if (item) updateSession.mutate({ id: item.id, data });
            else createSession.mutate(data);
        }
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Academics</h1>
                    <p className="page-subtitle">Manage classes, sections, subjects, and academic sessions</p>
                </div>
                {(activeTab === 'grades' || activeTab === 'subjects' || activeTab === 'sessions') && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        {activeTab === 'grades' && (
                            <button
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                onClick={() => bulkCreateGrades.mutate()}
                                disabled={bulkCreateGrades.isPending}
                            >
                                <Layers size={16} /> {bulkCreateGrades.isPending ? 'Setting up...' : 'Setup Standard Classes'}
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => openModal(activeTab === 'grades' ? 'grade' : activeTab === 'subjects' ? 'subject' : 'session')}>
                            <Plus size={16} /> Add {activeTab === 'grades' ? 'Class' : activeTab === 'subjects' ? 'Subject' : 'Session'}
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                            background: activeTab === id ? 'var(--primary)' : 'var(--overlay)',
                            color: activeTab === id ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Icon size={15} />{label}
                    </button>
                ))}
            </div>

            {/* Grades */}
            {activeTab === 'grades' && (
                <div className="grid-3" style={{ gridGap: 24 }}>
                    {grades.map(c => (
                        <div key={c.id} className="glass-card" style={{ padding: 24, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Class {c.name}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'capitalize' }}>{c.level?.replace('_', ' ')} Level</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => openModal('grade', c)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><Edit2 size={16} /></button>
                                    <button onClick={() => setDeleteModal({ isOpen: true, type: 'grade', item: c })} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Sections & Teachers</p>
                                    <button onClick={() => { setFormData({ ...formData, grade: c.id }); openModal('section'); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> Add Section</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(c.sections || []).map(s => (
                                        <div key={s.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'default' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, marginRight: 8 }}>Section {s.name}</span>
                                                {s.class_teacher_name ? (
                                                    <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}><UserCheck size={10} /> {s.class_teacher_name}</span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No Class Teacher</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => { setFormData({ ...formData, grade: c.id }); openModal('section', s); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}><Edit2 size={14} /></button>
                                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'section', item: s })} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!c.sections || c.sections.length === 0) && <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: 10 }}>No sections defined</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {grades.length === 0 && <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>No classes added yet. Start by adding your first class!</div>}
                </div>
            )}

            {/* Subjects Table */}
            {activeTab === 'subjects' && (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Subject Name</th><th>Code</th><th>Actions</th></tr></thead>
                        <tbody>
                            {subjects.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.code || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => openModal('subject', s)} className="text-btn"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'subject', item: s })} className="text-btn-danger"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>No subjects configured yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sessions Table */}
            {activeTab === 'sessions' && (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Session Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.start_date}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.end_date}</td>
                                    <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-info'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => openModal('session', s)} className="text-btn"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'session', item: s })} className="text-btn-danger"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>No sessions configured yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Grade/Section Modal */}
            {showModal.isOpen && (
                <div className="modal-overlay" onClick={() => setShowModal({ isOpen: false })}>
                    <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{showModal.item ? 'Edit' : 'Add'} {showModal.type === 'grade' ? 'Class' : 'Section'}</h3>
                        <form onSubmit={handleSubmit}>
                            {showModal.type === 'grade' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Class Name *</label>
                                        <input className="form-input" placeholder="e.g. 1, 10, XII, Nursery" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Level</label>
                                        <select className="form-input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                            {['pre_primary', 'primary', 'middle', 'secondary', 'senior_secondary'].map(l => <option key={l} value={l}>{l.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {showModal.type === 'section' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Section Name *</label>
                                        <input className="form-input" placeholder="e.g. A, B, Blue, Red" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Class Teacher (Optional)</label>
                                        <select className="form-input" value={formData.class_teacher} onChange={e => setFormData({ ...formData, class_teacher: e.target.value })}>
                                            <option value="">Select Teacher</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.full_name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {showModal.type === 'subject' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Subject Name *</label>
                                        <input className="form-input" placeholder="e.g. Mathematics, Physics" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Code (Optional)</label>
                                        <input className="form-input" placeholder="e.g. MATH101" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                                    </div>
                                </>
                            )}
                            {showModal.type === 'session' && (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Session Name *</label>
                                        <input className="form-input" placeholder="e.g. 2025-2026" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                        <div>
                                            <label className="form-label">Start Date *</label>
                                            <input type="date" className="form-input" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">End Date *</label>
                                            <input type="date" className="form-input" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                        <span style={{ fontSize: 14 }}>Mark as Active Session</span>
                                    </label>
                                </>
                            )}
                            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal({ isOpen: false })}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={createGrade.isPending || updateGrade.isPending || createSection.isPending || updateSection.isPending}>
                                    {showModal.item ? 'Save Changes' : (showModal.type === 'grade' ? 'Add Class' : 'Add Section')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false })}
                onConfirm={() => {
                    if (deleteModal.type === 'grade') deleteGrade.mutate(deleteModal.item.id);
                    else if (deleteModal.type === 'section') deleteSection.mutate(deleteModal.item.id);
                    else if (deleteModal.type === 'subject') deleteSubject.mutate(deleteModal.item.id);
                    else if (deleteModal.type === 'session') deleteSession.mutate(deleteModal.item.id);
                }}
                itemName={deleteModal.item?.name ? `${deleteModal.type === 'grade' ? 'Class' : deleteModal.type === 'section' ? 'Section' : deleteModal.type === 'subject' ? 'Subject' : 'Session'} ${deleteModal.item.name}` : ''}
                isLoading={deleteGrade.isPending || deleteSection.isPending || deleteSubject.isPending || deleteSession.isPending}
            />
        </div>
    );
}
