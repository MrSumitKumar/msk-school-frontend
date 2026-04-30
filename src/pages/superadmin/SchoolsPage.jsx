import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsApi, saasApi, accountsApi } from '../../services/api';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, School, CreditCard, Calendar, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SchoolsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [managePlanSchool, setManagePlanSchool] = useState(null);
    const [assignOwnerSchool, setAssignOwnerSchool] = useState(null);
    const [form, setForm] = useState({ name: '', board_type: 'cbse', contact_email: '', contact_phone: '', city: '', address: '' });

    // Manage Plan Form State
    const [planForm, setPlanForm] = useState({ plan: '', status: 'active', start_date: '', end_date: '' });
    const [ownerForm, setOwnerForm] = useState({ owner: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['schools'],
        queryFn: () => schoolsApi.list(),
        refetchInterval: 5000,
    });

    const { data: plansData } = useQuery({
        queryKey: ['plans'],
        queryFn: () => schoolsApi.plans.list(),
    });

    const { data: ownersData } = useQuery({
        queryKey: ['school-owners'],
        queryFn: () => accountsApi.list({ role: 'school_admin' }),
    });

    const { data: subscriptionData } = useQuery({
        queryKey: ['subscription', managePlanSchool?.id],
        queryFn: () => saasApi.subscriptions.getBySchool(managePlanSchool.id),
        enabled: !!managePlanSchool?.id,
    });

    const schools = (data?.results || data || []).filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const owners = ownersData?.results || ownersData || [];
    const existingSub = subscriptionData?.results?.[0] || subscriptionData?.[0] || null;

    const createMutation = useMutation({
        mutationFn: schoolsApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['schools']);
            setShowModal(false);
            setForm({ name: '', board_type: 'cbse', contact_email: '', contact_phone: '', city: '', address: '' });
            toast.success('School created successfully');
        },
        onError: () => toast.error('Failed to create school')
    });

    const deleteMutation = useMutation({
        mutationFn: schoolsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['schools']);
            toast.success('School deleted');
        },
        onError: () => toast.error('Failed to delete school')
    });

    const assignPlanMutation = useMutation({
        mutationFn: (data) => {
            return saasApi.subscriptions.create({
                ...data,
                school: managePlanSchool.id,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries(['schools']);
            qc.invalidateQueries(['subscriptions']);
            qc.invalidateQueries(['subscription', managePlanSchool?.id]);
            setManagePlanSchool(null);
            toast.success('Plan assigned successfully');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to assign plan')
    });

    const assignOwnerMutation = useMutation({
        mutationFn: (data) => accountsApi.update(data.owner, { school: assignOwnerSchool.id }),
        onSuccess: () => {
            qc.invalidateQueries(['schools']);
            qc.invalidateQueries(['school-owners']);
            setAssignOwnerSchool(null);
            toast.success('Owner assigned successfully');
        },
        onError: (err) => toast.error(err.response?.data?.detail || 'Failed to assign owner')
    });

    const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };

    const handleManagePlan = (school) => {
        setManagePlanSchool(school);
        // Pre-fill from existing subscription if available
        if (school.subscription_details) {
            setPlanForm({
                plan: school.subscription_details.plan_id || '',
                status: school.subscription_details.status || 'active',
                start_date: school.subscription_details.start_date || new Date().toISOString().split('T')[0],
                end_date: school.subscription_details.end_date || ''
            });
        } else {
            setPlanForm({
                plan: school.subscription_plan || '',
                status: school.is_active ? 'active' : 'expired',
                start_date: new Date().toISOString().split('T')[0],
                end_date: school.subscription_end || ''
            });
        }
    };

    const handleAssignOwner = (school) => {
        setAssignOwnerSchool(school);
        setOwnerForm({ owner: '' });
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Schools</h1>
                    <p className="page-subtitle">Manage all subscribed schools on the platform</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add School</button>
            </div>

            {/* Search */}
            <div className="search-bar" style={{ marginBottom: 24, display: 'inline-flex' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>School Name</th><th>Board</th><th>City</th><th>Owner</th><th>Plan</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading...</td></tr> : schools.map(s => (
                            <tr key={s.id}>
                                <td><strong>{s.name}</strong></td>
                                <td><span className="badge badge-info">{s.board_type?.toUpperCase()}</span></td>
                                <td style={{ color: 'var(--text-secondary)' }}>{s.city || '—'}</td>
                                <td>
                                    {s.owner ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                            <Users size={12} color="var(--primary)" /> {s.owner}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>— Unassigned —</span>
                                    )}
                                </td>
                                <td>
                                    {s.subscription_plan_name ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span className="badge badge-purple">{s.subscription_plan_name}</span>
                                            {s.subscription_end && <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Ends: {s.subscription_end}</span>}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                    )}
                                </td>
                                <td>{s.is_active ? <span className="badge badge-success"><CheckCircle size={12} /> Active</span> : <span className="badge badge-danger"><XCircle size={12} /> Inactive</span>}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => handleAssignOwner(s)}
                                            className="btn-icon"
                                            title="Assign Owner"
                                            style={{ color: '#3B82F6' }}
                                        >
                                            <UserPlus size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleManagePlan(s)}
                                            className="btn-icon"
                                            title="Manage Plan"
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            <CreditCard size={18} />
                                        </button>
                                        <button
                                            onClick={() => { if (window.confirm('Delete this school?')) deleteMutation.mutate(s.id); }}
                                            className="btn-icon"
                                            title="Delete"
                                            style={{ color: '#EF4444' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && schools.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>No schools yet. Click "Add School" to get started.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Add School Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">Add New School</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2" style={{ gap: 16 }}>
                                {[
                                    { key: 'name', label: 'School Name', placeholder: 'ABC Public School', req: true },
                                    { key: 'city', label: 'City', placeholder: 'Lucknow' },
                                    { key: 'contact_email', label: 'Email', placeholder: 'school@email.com', req: true },
                                    { key: 'contact_phone', label: 'Phone', placeholder: '+91 9XX XXXX XXX', req: true },
                                ].map(({ key, label, placeholder, req }) => (
                                    <div key={key}>
                                        <label className="form-label">{label}</label>
                                        <input className="form-input" placeholder={placeholder} required={req} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                                    </div>
                                ))}
                                <div>
                                    <label className="form-label">Board Type</label>
                                    <select className="form-input" value={form.board_type} onChange={e => setForm({ ...form, board_type: e.target.value })}>
                                        {['cbse', 'icse', 'up_board', 'state', 'ib', 'custom'].map(b => <option key={b} value={b}>{b.toUpperCase().replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label className="form-label">Address</label>
                                <textarea className="form-input" rows={2} placeholder="Full address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Adding...' : 'Add School'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Plan Modal */}
            {managePlanSchool && (
                <div className="modal-overlay" onClick={() => setManagePlanSchool(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Manage School Plan</h3>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{managePlanSchool.name}</p>
                                {existingSub && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
                                        Current: {existingSub.plan_name || 'No Plan'} ({existingSub.status})
                                    </p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); assignPlanMutation.mutate(planForm); }}>
                            <div className="grid-1" style={{ gap: 16 }}>
                                <div>
                                    <label className="form-label">Select Subscription Plan</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={planForm.plan}
                                        onChange={e => setPlanForm({ ...planForm, plan: e.target.value })}
                                    >
                                        <option value="">Select a plan</option>
                                        {(plansData?.results || plansData || []).map(p => (
                                            <option key={p.id} value={p.id}>{p.name.toUpperCase()} (₹{p.price}/mo)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid-2" style={{ gap: 16 }}>
                                    <div>
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input"
                                            value={planForm.status}
                                            onChange={e => setPlanForm({ ...planForm, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="trial">Trial</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Start Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={planForm.start_date}
                                            onChange={e => setPlanForm({ ...planForm, start_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={planForm.end_date}
                                        onChange={e => setPlanForm({ ...planForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: 32 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setManagePlanSchool(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={assignPlanMutation.isPending}>
                                    {assignPlanMutation.isPending ? 'Saving...' : 'Update Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Owner Modal */}
            {assignOwnerSchool && (
                <div className="modal-overlay" onClick={() => setAssignOwnerSchool(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Assign Owner</h3>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{assignOwnerSchool.name}</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); assignOwnerMutation.mutate(ownerForm); }}>
                            <div>
                                <label className="form-label">Select School Owner</label>
                                <select
                                    className="form-input"
                                    required
                                    value={ownerForm.owner}
                                    onChange={e => setOwnerForm({ ...ownerForm, owner: e.target.value })}
                                >
                                    <option value="">Select an owner</option>
                                    {owners.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.first_name} {o.last_name} ({o.email}){o.school_name ? ` — ${o.school_name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions" style={{ marginTop: 24 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setAssignOwnerSchool(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={assignOwnerMutation.isPending}>
                                    {assignOwnerMutation.isPending ? 'Assigning...' : 'Assign Owner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
                .form-label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
                .modal-actions { margin-top: 24px; display: flex; gap: 12; justify-content: flex-end; }
                .btn-icon { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
                .btn-icon:hover { transform: scale(1.1); }
            `}</style>
        </div>
    );
}

