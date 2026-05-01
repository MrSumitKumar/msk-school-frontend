import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsApi, saasApi, accountsApi } from '../../services/api';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, School, CreditCard, Calendar, UserPlus, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SchoolsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [managePlanSchool, setManagePlanSchool] = useState(null);
    const [assignOwnerSchool, setAssignOwnerSchool] = useState(null);
    const [form, setForm] = useState({ name: '', board_type: 'cbse', contact_email: '', contact_phone: '', city: '', address: '' });

    // Manage Plan Form State
    const [planForm, setPlanForm] = useState({ plan: '', status: 'active', duration: '1_year' });
    const [ownerForm, setOwnerForm] = useState({ owner: '' });

    // View Billing State
    const [viewBillingSchool, setViewBillingSchool] = useState(null);

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

    const { data: schoolBillingHistory, isLoading: billingLoading } = useQuery({
        queryKey: ['school-billing', viewBillingSchool?.id],
        queryFn: async () => {
            const [hist, pay] = await Promise.all([
                saasApi.subscriptionHistory.list({ school: viewBillingSchool.id }),
                saasApi.payments.list({ school: viewBillingSchool.id })
            ]);
            return { history: hist.results || hist, payments: pay.results || pay };
        },
        enabled: !!viewBillingSchool?.id,
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
        onError: (err) => {
            const msg = err.response?.data?.error || err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to assign plan';
            toast.error(msg);
        }
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
                duration: '1_year'
            });
        } else {
            setPlanForm({
                plan: school.subscription_plan || '',
                status: school.is_active ? 'active' : 'expired',
                duration: '1_year'
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
                                <td>
                                    {(() => {
                                        if (!s.is_active) return <span className="badge badge-danger"><XCircle size={12} /> Inactive</span>;
                                        
                                        // Check for near expiry (within 15 days)
                                        if (s.subscription_end) {
                                            const diff = new Date(s.subscription_end) - new Date();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            if (days <= 0) return <span className="badge badge-danger"><XCircle size={12} /> Expired</span>;
                                            if (days <= 15) return (
                                                <span className="badge badge-warning" title={`${days} days remaining`}>
                                                    <AlertTriangle size={12} /> Expiring Soon
                                                </span>
                                            );
                                        }
                                        
                                        return <span className="badge badge-success"><CheckCircle size={12} /> Active</span>;
                                    })()}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => setViewBillingSchool(s)}
                                            className="btn-icon"
                                            title="View Billing"
                                            style={{ color: '#F59E0B' }}
                                        >
                                            <Calendar size={18} />
                                        </button>
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

                        <form onSubmit={(e) => { 
                            e.preventDefault(); 
                            
                            const today = new Date();
                            const formatDt = (d) => {
                                const y = d.getFullYear();
                                const m = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                return `${y}-${m}-${day}`;
                            };
                            let startDateStr = formatDt(today);
                            let endDateStr = '';

                            const endDate = new Date(today);
                            let priceMultiplier = 1;
                            
                            if (planForm.status === 'active' || planForm.status === 'trial') {
                                if (planForm.duration === '1_month') { endDate.setMonth(endDate.getMonth() + 1); priceMultiplier = 1; }
                                else if (planForm.duration === '1_year') { endDate.setFullYear(endDate.getFullYear() + 1); priceMultiplier = 12; }
                                else if (planForm.duration === '2_years') { endDate.setFullYear(endDate.getFullYear() + 2); priceMultiplier = 24; }
                                else if (planForm.duration === '3_years') { endDate.setFullYear(endDate.getFullYear() + 3); priceMultiplier = 36; }
                                
                                endDateStr = formatDt(endDate);
                            } else {
                                endDateStr = formatDt(today);
                            }

                            const selectedPlanObj = (plansData?.results || plansData || []).find(p => p.id === parseInt(planForm.plan));
                            const amount = selectedPlanObj ? selectedPlanObj.price * priceMultiplier : 0;

                            const payload = {
                                plan: planForm.plan,
                                status: planForm.status,
                                start_date: startDateStr,
                                end_date: endDateStr,
                                amount: amount, // Added amount for billing history
                            };

                            assignPlanMutation.mutate(payload); 
                        }}>
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
                                        <label className="form-label">Plan Duration</label>
                                        <select
                                            className="form-input"
                                            value={planForm.duration}
                                            onChange={e => setPlanForm({ ...planForm, duration: e.target.value })}
                                            disabled={planForm.status === 'expired' || planForm.status === 'cancelled'}
                                        >
                                            <option value="1_month">1 Month</option>
                                            <option value="1_year">1 Year</option>
                                            <option value="2_years">2 Years</option>
                                            <option value="3_years">3 Years</option>
                                        </select>
                                    </div>
                                </div>

                                {planForm.plan && (
                                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8, fontSize: 14, color: '#3B82F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong>Total Amount:</strong>
                                        <span style={{ fontSize: 18, fontWeight: 800 }}>
                                            ₹{(
                                                ((plansData?.results || plansData || []).find(p => p.id === parseInt(planForm.plan))?.price || 0) * 
                                                (planForm.duration === '1_month' ? 1 : planForm.duration === '1_year' ? 12 : planForm.duration === '2_years' ? 24 : 36)
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {planForm.status === 'active' || planForm.status === 'trial' ? (
                                    <div style={{ padding: 12, background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'block', marginBottom: 4 }}><strong>Activation:</strong> {new Date().toLocaleDateString()}</span>
                                        <span style={{ display: 'block' }}><strong>Expires:</strong> {
                                            (() => {
                                                const d = new Date();
                                                if (planForm.duration === '1_month') d.setMonth(d.getMonth() + 1);
                                                else if (planForm.duration === '1_year') d.setFullYear(d.getFullYear() + 1);
                                                else if (planForm.duration === '2_years') d.setFullYear(d.getFullYear() + 2);
                                                else if (planForm.duration === '3_years') d.setFullYear(d.getFullYear() + 3);
                                                return d.toLocaleDateString();
                                            })()
                                        }</span>
                                    </div>
                                ) : (
                                    <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
                                        Plan will be marked as {planForm.status} immediately.
                                    </div>
                                )}
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

            {/* View Billing Modal */}
            {viewBillingSchool && (
                <div className="modal-overlay" onClick={() => setViewBillingSchool(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Billing & Payment History</h3>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{viewBillingSchool.name}</p>
                            </div>
                            <button className="btn-icon" onClick={() => setViewBillingSchool(null)} style={{ marginLeft: 'auto' }}><XCircle size={20} /></button>
                        </div>

                        <div style={{ overflowY: 'auto', paddingRight: 8 }}>
                            {billingLoading ? <p>Loading billing data...</p> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Plan Activations</h4>
                                        {schoolBillingHistory?.history?.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No plan history found.</p> : (
                                            <table className="data-table" style={{ fontSize: 13 }}>
                                                <thead><tr><th>Date</th><th>Action</th><th>Plan</th><th>Amount</th><th>Period</th></tr></thead>
                                                <tbody>
                                                    {schoolBillingHistory?.history?.map(h => (
                                                        <tr key={h.id}>
                                                            <td>{new Date(h.created_at).toLocaleDateString()}</td>
                                                            <td><span className="badge badge-info">{h.action}</span></td>
                                                            <td>{h.plan_name}</td>
                                                            <td>₹{Number(h.amount).toLocaleString('en-IN')}</td>
                                                            <td style={{ color: 'var(--text-secondary)' }}>{h.start_date} to {h.end_date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Payment Records</h4>
                                        {schoolBillingHistory?.payments?.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No payments found.</p> : (
                                            <table className="data-table" style={{ fontSize: 13 }}>
                                                <thead><tr><th>Date</th><th>Transaction ID</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {schoolBillingHistory?.payments?.map(p => (
                                                        <tr key={p.id}>
                                                            <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                                            <td style={{ fontFamily: 'monospace' }}>{p.transaction_id || '—'}</td>
                                                            <td>{p.payment_method}</td>
                                                            <td>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                                                            <td><span className={`badge badge-${p.payment_status === 'completed' ? 'success' : 'warning'}`}>{p.payment_status}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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

