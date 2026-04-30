import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, teachersApi } from '../../services/api';
import { Trash2, RotateCcw, Search, UserCheck, Users, GraduationCap } from 'lucide-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/authStore';

export default function TrashPage() {
    const qc = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('students');
    const [search, setSearch] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isSchoolAdmin = currentUser?.role === 'school_admin';
    const canPurge = isSuperAdmin || isSchoolAdmin;

    const { data: trashData, isLoading } = useQuery({
        queryKey: ['trash', activeTab, search],
        queryFn: () => (activeTab === 'students' ? studentsApi.trash({ search }) : teachersApi.trash({ search }))
    });

    const trashItems = trashData?.results || trashData || [];

    const restoreMutation = useMutation({
        mutationFn: (id) => (activeTab === 'students' ? studentsApi.restore(id) : teachersApi.restore(id)),
        onSuccess: () => {
            qc.invalidateQueries(['trash']);
            qc.invalidateQueries([activeTab]);
            toast.success('Record restored successfully');
        },
        onError: () => toast.error('Failed to restore record')
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: (id) => (activeTab === 'students' ? studentsApi.permanentDelete(id) : teachersApi.permanentDelete(id)),
        onSuccess: () => {
            qc.invalidateQueries(['trash']);
            setDeleteModal({ isOpen: false, item: null });
            toast.success('Record permanently deleted');
        },
        onError: () => toast.error('Failed to delete record permanently')
    });

    const handleConfirmPermanentDelete = () => {
        if (deleteModal.item) {
            permanentDeleteMutation.mutate(deleteModal.item.id);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Trash Management</h1>
                    <p className="page-subtitle">View and restore deleted student and teacher records</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 12, gap: 4 }}>
                    <button
                        className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                        onClick={() => setActiveTab('students')}
                    >
                        <GraduationCap size={16} style={{ marginRight: 8 }} />
                        Students
                    </button>
                    <button
                        className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                        onClick={() => setActiveTab('teachers')}
                    >
                        <Users size={16} style={{ marginRight: 8 }} />
                        Teachers
                    </button>
                </div>

                <div className="search-bar" style={{ maxWidth: 300, marginBottom: 0 }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input placeholder={`Search deleted ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading trash...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>{activeTab === 'students' ? 'Admission No.' : 'Employee ID'}</th>
                                {activeTab === 'students' && <th>Class/Section</th>}
                                {activeTab === 'teachers' && <th>Designation</th>}
                                <th>Deleted From</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trashItems.map((item, i) => (
                                <tr key={item.id}>
                                    <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="bg-gradient-primary" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {item.user?.first_name?.[0]}{item.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{item.user?.first_name} {item.user?.last_name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-info">{activeTab === 'students' ? item.admission_number : item.employee_id}</span></td>
                                    {activeTab === 'students' && <td>{item.grade_name || 'N/A'} - {item.section_name || 'N/A'}</td>}
                                    {activeTab === 'teachers' && <td>{item.designation || 'Teacher'}</td>}
                                    <td>{item.user?.school_name || 'System'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                className="hover-text-primary"
                                                onClick={() => restoreMutation.mutate(item.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                                                title="Restore"
                                                disabled={restoreMutation.isPending}
                                            >
                                                <RotateCcw size={16} />
                                                <span style={{ fontSize: 13 }}>Restore</span>
                                            </button>

                                            {canPurge && (
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, item })}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}
                                                    title="Permanent Delete"
                                                >
                                                    <Trash2 size={16} />
                                                    <span style={{ fontSize: 13 }}>Purge</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {trashItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                                        Trash is empty. All good!
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
                onConfirm={handleConfirmPermanentDelete}
                itemName={`${deleteModal.item?.user?.first_name} ${deleteModal.item?.user?.last_name}`}
                isLoading={permanentDeleteMutation.isPending}
                isPermanent={true}
                title="Confirm Permanent Deletion"
                error={permanentDeleteMutation.error?.response?.data?.detail || permanentDeleteMutation.error?.message}
            />
        </div>
    );
}
