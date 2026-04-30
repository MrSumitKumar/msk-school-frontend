import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, academicsApi } from '../../services/api';
import { ClipboardCheck, CheckCircle, XCircle, Clock, Trash2, Edit2, Filter, Calendar as CalIcon } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const STATUS_COLORS = { present: 'badge-success', absent: 'badge-danger', late: 'badge-warning', half_day: 'badge-info', holiday: 'badge-purple' };

export default function AttendancePage() {
    const qc = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

    const { data, isLoading } = useQuery({
        queryKey: ['attendance', date, selectedSection],
        queryFn: () => attendanceApi.list({ date, section: selectedSection }),
        enabled: !!selectedSection || (!selectedClass && !selectedSection)
    });

    const { data: gradesData } = useQuery({ queryKey: ['grades'], queryFn: () => academicsApi.getGrades() });
    const { data: sectionsData } = useQuery({
        queryKey: ['sections', selectedClass],
        queryFn: () => academicsApi.getSections(selectedClass),
        enabled: !!selectedClass
    });

    const records = data?.results || data || [];
    const classes = gradesData?.results || gradesData || [];
    const sections = sectionsData?.results || sectionsData || [];

    const deleteMutation = useMutation({
        mutationFn: attendanceApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['attendance']);
            setDeleteModal({ isOpen: false, item: null });
            toast.success('Attendance record deleted');
        },
        onError: () => toast.error('Failed to delete record')
    });

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Tracking</h1>
                    <p className="page-subtitle">Monitor and manage daily student presence and punctuality</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label"><CalIcon size={14} style={{ marginRight: 6 }} />Select Date</label>
                        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">Class</label>
                        <select className="form-input" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <label className="form-label">Section</label>
                        <select className="form-input" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClass}>
                            <option value="">{selectedClass ? 'All Sections' : 'Select Class First'}</option>
                            {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Scanned', value: records.length, icon: ClipboardCheck, cls: 'bg-gradient-primary' },
                    { label: 'Present', value: records.filter(r => r.status === 'present').length, icon: CheckCircle, cls: 'bg-gradient-success' },
                    { label: 'Absent', value: records.filter(r => r.status === 'absent').length, icon: XCircle, cls: 'bg-gradient-danger' },
                    { label: 'Late/Other', value: records.filter(r => !['present', 'absent'].includes(r.status)).length, icon: Clock, cls: 'bg-gradient-warning' },
                ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="stat-card" style={{ padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>{label}</p>
                                <p style={{ fontSize: 24, fontWeight: 800 }}>{value}</p>
                            </div>
                            <div className={cls} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={18} color="white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflowX: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading attendance details...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Processed By</th>
                                <th>Remarks</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.date}</td>
                                    <td><span className={`badge ${STATUS_COLORS[r.status] || 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>{r.status.replace('_', ' ')}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.marked_by_name || 'System'}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic' }}>{r.remarks || 'No remarks'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }} title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, item: r })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 60 }}>No attendance records found for the selected criteria.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={() => deleteMutation.mutate(deleteModal.item.id)}
                itemName={`Attendance record for ${deleteModal.item?.student_name}`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
