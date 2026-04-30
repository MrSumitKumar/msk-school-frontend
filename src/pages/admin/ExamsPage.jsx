import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi } from '../../services/api';
import { Plus, FileText, Calendar, Trash2, Edit2, ShieldCheck, ClipboardList } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const TYPE_BADGE = { unit_test: 'badge-info', mid_term: 'badge-warning', final: 'badge-danger', pre_board: 'badge-purple', practical: 'badge-success' };

export default function ExamsPage() {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
    const [form, setForm] = useState({ name: '', exam_type: 'unit_test', start_date: '', end_date: '' });

    const { data, isLoading } = useQuery({ queryKey: ['exams'], queryFn: () => examsApi.list() });
    const exams = data?.results || data || [];

    const createMutation = useMutation({
        mutationFn: examsApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['exams']);
            setShowModal(false);
            setForm({ name: '', exam_type: 'unit_test', start_date: '', end_date: '' });
            toast.success('Exam scheduled successfully');
        },
        onError: () => toast.error('Failed to schedule exam')
    });

    const deleteMutation = useMutation({
        mutationFn: examsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['exams']);
            setDeleteModal({ isOpen: false, item: null });
            toast.success('Exam deleted');
        }
    });

    const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Examination Management</h1>
                    <p className="page-subtitle">Schedule exams, manage results, and monitor student academic performance</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Schedule Exam</button>
            </div>

            <div className="glass-card" style={{ overflowX: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
                        <div className="animate-pulse">Loading examination records...</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Exam Name</th>
                                <th>Type</th>
                                <th>Timeline</th>
                                <th>Status</th>
                                <th>Subjects</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(e => (
                                <tr key={e.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ background: 'rgba(79,70,229,0.1)', padding: 6, borderRadius: 8, color: 'var(--primary)' }}><ClipboardList size={16} /></div>
                                            {e.name}
                                        </div>
                                    </td>
                                    <td><span className={`badge ${TYPE_BADGE[e.exam_type]}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>{e.exam_type.replace('_', ' ')}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <Calendar size={12} />
                                            {e.start_date} <span style={{ opacity: 0.5 }}>→</span> {e.end_date}
                                        </div>
                                    </td>
                                    <td><span className={`badge ${e.is_published ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>{e.is_published ? 'Published' : 'Draft Mode'}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{e.schedules?.length || 0} subjects configured</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }} title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, item: e })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {exams.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 80 }}>
                                        <div style={{ opacity: 0.5, marginBottom: 16 }}><FileText size={48} style={{ margin: '0 auto' }} /></div>
                                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No examinations scheduled for this session.</p>
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
                itemName={deleteModal.item?.name}
                isLoading={deleteMutation.isPending}
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal scale-in" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ background: 'rgba(79,70,229,0.1)', padding: 10, borderRadius: 12, color: 'var(--primary)' }}><ShieldCheck size={24} /></div>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Schedule Examination</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Exam Title *</label>
                                <input className="form-input" placeholder="e.g. Unit Test 1 - Session 2025" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Examination Category</label>
                                <select className="form-input" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                                    {['unit_test', 'mid_term', 'final', 'pre_board', 'practical'].map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>
                            <div className="grid-2" style={{ gap: 16 }}>
                                <div><label className="form-label">Start Date *</label><input className="form-input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                <div><label className="form-label">End Date *</label><input className="form-input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                            </div>
                            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" style={{ padding: '12px 24px' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={createMutation.isPending}>{createMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
