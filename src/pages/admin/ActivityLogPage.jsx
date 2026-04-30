import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi, schoolsApi } from '../../services/api';
import { Search, Filter, Calendar, User, School, FileText, ChevronLeft, ChevronRight, Activity, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuthStore } from '../../app/authStore';
import toast from 'react-hot-toast';

const ActionBadge = ({ type }) => {
    const styles = {
        CREATE: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' },
        UPDATE: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
        SOFT_DELETE: { bg: 'rgba(249, 115, 22, 0.15)', color: '#F97316' },
        RESTORE: { bg: 'rgba(20, 184, 166, 0.15)', color: '#14B8A6' },
        PERMANENT_DELETE: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
        LOGIN: { bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' },
        LOGOUT: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
    };
    const style = styles[type] || { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' };
    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: style.bg,
            color: style.color,
            textTransform: 'uppercase'
        }}>
            {type.replace('_', ' ')}
        </span>
    );
};

export default function ActivityLogPage() {
    const { user: currentUser } = useAuthStore();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const queryClient = useQueryClient();

    const [params, setParams] = useState({
        page: 1,
        action_type: '',
        date_from: '',
        date_to: '',
        school: '',
        model_name: '',
        search: ''
    });

    const [selectedIds, setSelectedIds] = useState([]);

    const { data: logsData, isLoading, refetch } = useQuery({
        queryKey: ['audit-logs', params],
        queryFn: () => auditApi.list(params)
    });

    const { data: schools } = useQuery({
        queryKey: ['schools'],
        queryFn: () => schoolsApi.list(),
        enabled: isSuperAdmin
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id) => auditApi.delete(id),
        onSuccess: () => {
            toast.success('Log deleted successfully');
            queryClient.invalidateQueries(['audit-logs']);
            setSelectedIds([]);
        },
        onError: () => toast.error('Failed to delete log')
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => auditApi.bulkDelete(ids),
        onSuccess: (data) => {
            toast.success(data.message || 'Logs deleted successfully');
            queryClient.invalidateQueries(['audit-logs']);
            setSelectedIds([]);
        },
        onError: () => toast.error('Failed to delete logs')
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(logs.map(log => log.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this activity log? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected activity logs? This action cannot be undone.`)) {
            bulkDeleteMutation.mutate(selectedIds);
        }
    };

    const logs = logsData?.results || [];
    const totalPages = Math.ceil((logsData?.count || 0) / 20);

    return (
        <div className="activity-log-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        <Activity size={24} style={{ marginRight: 10, color: 'var(--primary)' }} />
                        System Activity Logs
                    </h1>
                    <p className="page-subtitle">Monitor and audit all system operations and user actions</p>
                </div>
                {isSuperAdmin && selectedIds.length > 0 && (
                    <button
                        className="btn btn-danger"
                        onClick={handleBulkDelete}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        disabled={bulkDeleteMutation.isLoading}
                    >
                        <Trash2 size={16} />
                        Delete Selected ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ marginBottom: 24, padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div className="search-bar" style={{ marginBottom: 0 }}>
                        <Search size={16} color="var(--text-secondary)" />
                        <input
                            name="search"
                            placeholder="Search object (e.g. Aman Kumar)..."
                            value={params.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '0 12px', borderRadius: 10 }}>
                        <Filter size={14} color="var(--text-secondary)" />
                        <select
                            name="action_type"
                            value={params.action_type}
                            onChange={handleFilterChange}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px 0', fontSize: 13, width: '100%', outline: 'none' }}
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="SOFT_DELETE">Soft Delete</option>
                            <option value="RESTORE">Restore</option>
                            <option value="PERMANENT_DELETE">Purge</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '0 12px', borderRadius: 10 }}>
                        <FileText size={14} color="var(--text-secondary)" />
                        <select
                            name="model_name"
                            value={params.model_name}
                            onChange={handleFilterChange}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px 0', fontSize: 13, width: '100%', outline: 'none' }}
                        >
                            <option value="">All Models</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="User">User Account</option>
                        </select>
                    </div>

                    {isSuperAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '0 12px', borderRadius: 10 }}>
                            <School size={14} color="var(--text-secondary)" />
                            <select
                                name="school"
                                value={params.school}
                                onChange={handleFilterChange}
                                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px 0', fontSize: 13, width: '100%', outline: 'none' }}
                            >
                                <option value="">All Schools</option>
                                {schools?.results?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '0 12px', borderRadius: 10 }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        <input
                            type="date"
                            name="date_from"
                            value={params.date_from}
                            onChange={handleFilterChange}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '10px 0', fontSize: 13, width: '100%', outline: 'none' }}
                            title="From Date"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {isSuperAdmin && (
                                    <th style={{ width: 40 }}>
                                        <div
                                            onClick={toggleSelectAll}
                                            style={{ cursor: 'pointer', color: selectedIds.length === logs.length && logs.length > 0 ? 'var(--primary)' : 'inherit' }}
                                        >
                                            {selectedIds.length === logs.length && logs.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </div>
                                    </th>
                                )}
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Object</th>
                                <th>Description</th>
                                <th>Location (IP)</th>
                                {isSuperAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 8 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                                        Fetching system logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 8 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                                        No activity logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className={selectedIds.includes(log.id) ? 'selected-row' : ''}>
                                        {isSuperAdmin && (
                                            <td>
                                                <div
                                                    onClick={() => toggleSelect(log.id)}
                                                    style={{ cursor: 'pointer', color: selectedIds.includes(log.id) ? 'var(--primary)' : 'inherit' }}
                                                >
                                                    {selectedIds.includes(log.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </div>
                                            </td>
                                        )}
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ fontSize: 13 }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                                                    {log.user_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: 13 }}>{log.user_name || 'System'}</div>
                                                    {isSuperAdmin && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.school_name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td><ActionBadge type={log.action_type} /></td>
                                        <td>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{log.object_repr}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.model_name} (ID: {log.object_id})</div>
                                        </td>
                                        <td style={{ maxWidth: 300 }}>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.4' }}>{log.description}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.ip_address || 'Internal'}</div>
                                        </td>
                                        {isSuperAdmin && (
                                            <td>
                                                <button
                                                    className="btn btn-ghost text-danger"
                                                    onClick={() => handleDelete(log.id)}
                                                    title="Delete Entry"
                                                    style={{ padding: '4px' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Showing page {params.page} of {totalPages}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn btn-ghost"
                                style={{ padding: '6px 12px' }}
                                onClick={() => setParams(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={params.page === 1}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                className="btn btn-ghost"
                                style={{ padding: '6px 12px' }}
                                onClick={() => setParams(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                                disabled={params.page === totalPages}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .selected-row {
                    background-color: rgba(var(--primary-rgb), 0.05) !important;
                }
                .text-danger {
                    color: #EF4444 !important;
                }
                .btn-danger {
                    background-color: #EF4444;
                    color: white;
                }
                .btn-danger:hover {
                    background-color: #DC2626;
                }
            `}} />
        </div>
    );
}
