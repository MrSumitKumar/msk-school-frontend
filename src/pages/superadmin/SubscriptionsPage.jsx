import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi, schoolsApi } from '../../services/api';
import { CheckSquare, Search, Edit, CheckCircle, XCircle, RefreshCw, Users, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [form, setForm] = useState({ plan: '', status: 'active', start_date: '', end_date: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['subscriptions', statusFilter],
        queryFn: () => saasApi.subscriptions.list(statusFilter ? { status: statusFilter } : {}),
    });

    const { data: plansData } = useQuery({
        queryKey: ['plans'],
        queryFn: () => schoolsApi.plans.list(),
    });

    const subs = (data?.results || data || []).filter(s =>
        (s.school_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.plan_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const updateMutation = useMutation({
        mutationFn: (data) => saasApi.subscriptions.update(editingSub, data),
        onSuccess: () => {
            qc.invalidateQueries(['subscriptions']);
            qc.invalidateQueries(['schools']);
            setShowModal(false);
            toast.success('Subscription updated');
        },
        onError: () => toast.error('Failed to update subscription')
    });

    const handleEdit = (sub) => {
        setEditingSub(sub.id);
        setForm({
            school: sub.school,
            plan: sub.plan?.id || '',
            status: sub.status,
            start_date: sub.start_date,
            end_date: sub.end_date
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateMutation.mutate(form);
    };

    const statusCounts = {
        active: (data?.results || data || []).filter(s => s.status === 'active').length,
        trial: (data?.results || data || []).filter(s => s.status === 'trial').length,
        expired: (data?.results || data || []).filter(s => s.status === 'expired').length,
        cancelled: (data?.results || data || []).filter(s => s.status === 'cancelled').length,
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Active Subscriptions</h1>
                    <p className="page-subtitle">Manage school subscriptions and billing cycles</p>
                </div>
            </div>

            {/* Status Filter Badges */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { key: '', label: 'All', count: (data?.results || data || []).length, color: '#6B7280' },
                    { key: 'active', label: 'Active', count: statusCounts.active, color: '#10B981' },
                    { key: 'trial', label: 'Trial', count: statusCounts.trial, color: '#F59E0B' },
                    { key: 'expired', label: 'Expired', count: statusCounts.expired, color: '#EF4444' },
                    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, color: '#6B7280' },
                ].map(({ key, label, count, color }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: '1px solid ' + (statusFilter === key ? color : 'var(--border)'),
                            background: statusFilter === key ? color + '20' : 'transparent',
                            color: statusFilter === key ? color : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {label}
                        <span style={{
                            background: statusFilter === key ? color : 'var(--border)',
                            color: statusFilter === key ? 'white' : 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                        }}>{count}</span>
                    </button>
                ))}
            </div>

            <div className="search-bar" style={{ marginBottom: 24, display: 'inline-flex' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input placeholder="Search schools or plans..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="glass-card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>School</th><th>Owner</th><th>Plan</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr> : subs.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <strong>{s.school_name || `School #${s.school}`}</strong>
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ID: {s.school}</span>
                                    </div>
                                </td>
                                <td>
                                    {s.school_owner ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                            <Users size={12} color="var(--primary)" /> {s.school_owner}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                                    )}
                                </td>
                                <td><span className="badge badge-purple">{s.plan_name || `Plan #${s.plan}`}</span></td>
                                <td style={{ color: 'var(--text-secondary)' }}>{s.start_date}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{s.end_date}</td>
                                <td>
                                    {s.status === 'active' && <span className="badge badge-success"><CheckCircle size={12} /> Active</span>}
                                    {s.status === 'trial' && <span className="badge badge-warning"><RefreshCw size={12} /> Trial</span>}
                                    {s.status === 'expired' && <span className="badge badge-danger"><XCircle size={12} /> Expired</span>}
                                    {s.status === 'cancelled' && <span className="badge badge-outline">Cancelled</span>}
                                </td>
                                <td>
                                    <button onClick={() => handleEdit(s)} className="btn-icon text-primary"><Edit size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && subs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No subscriptions found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Edit Subscription</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-1" style={{ gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Plan</label>
                                    <select className="form-input" required value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                                        <option value="">Select Plan</option>
                                        {(plansData?.results || plansData || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid-2" style={{ gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
                                        <select className="form-input" required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="active">Active</option>
                                            <option value="trial">Trial</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Start Date</label>
                                        <input type="date" className="form-input" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>End Date</label>
                                    <input type="date" className="form-input" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

