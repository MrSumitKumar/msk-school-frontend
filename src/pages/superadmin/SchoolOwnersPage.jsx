import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi, schoolsApi } from '../../services/api';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Users, Mail, Phone, School } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SchoolOwnersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingOwner, setEditingOwner] = useState(null);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        school: '',
        is_active: true
    });

    const { data, isLoading } = useQuery({
        queryKey: ['school-owners'],
        queryFn: () => accountsApi.list({ role: 'school_admin' }),
        refetchInterval: 5000,
    });

    const { data: schoolsData } = useQuery({
        queryKey: ['schools'],
        queryFn: () => schoolsApi.list(),
    });

    const schools = schoolsData?.results || schoolsData || [];
    const owners = (data?.results || data || []).filter(o =>
        (o.first_name + ' ' + o.last_name).toLowerCase().includes(search.toLowerCase()) ||
        (o.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.school_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: accountsApi.create,
        onSuccess: () => {
            qc.invalidateQueries(['school-owners']);
            setShowModal(false);
            resetForm();
            toast.success('School owner created successfully');
        },
        onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create owner')
    });

    const updateMutation = useMutation({
        mutationFn: (data) => accountsApi.update(editingOwner.id, data),
        onSuccess: () => {
            qc.invalidateQueries(['school-owners']);
            qc.invalidateQueries(['schools']);
            setShowModal(false);
            setEditingOwner(null);
            toast.success('School owner updated');
        },
        onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update owner')
    });

    const deleteMutation = useMutation({
        mutationFn: accountsApi.delete,
        onSuccess: () => {
            qc.invalidateQueries(['school-owners']);
            toast.success('School owner deleted');
        },
        onError: () => toast.error('Failed to delete owner')
    });

    const resetForm = () => {
        setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', school: '', is_active: true });
    };

    const handleAdd = () => {
        setEditingOwner(null);
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (owner) => {
        setEditingOwner(owner);
        setForm({
            first_name: owner.first_name,
            last_name: owner.last_name,
            email: owner.email,
            phone: owner.phone || '',
            password: '',
            school: owner.school || '',
            is_active: owner.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = { ...form, role: 'school_admin' };
        if (!submitData.password && editingOwner) {
            delete submitData.password;
        }
        if (editingOwner) {
            updateMutation.mutate(submitData);
        } else {
            createMutation.mutate(submitData);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">School Owners</h1>
                    <p className="page-subtitle">Manage school administrators and their assigned institutions</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> Add Owner</button>
            </div>

            <div className="search-bar" style={{ marginBottom: 24, display: 'inline-flex' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input placeholder="Search owners by name, email or school..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="glass-card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>Owner</th><th>Contact</th><th>School</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {isLoading ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr> : owners.map(o => (
                            <tr key={o.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                                            {o.first_name?.[0]}{o.last_name?.[0]}
                                        </div>
                                        <div>
                                            <strong>{o.first_name} {o.last_name}</strong>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {o.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                            <Mail size={12} color="var(--text-secondary)" /> {o.email}
                                        </span>
                                        {o.phone && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                <Phone size={12} color="var(--text-secondary)" /> {o.phone}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {o.school_name ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                            <School size={14} color="var(--primary)" /> {o.school_name}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>— Not assigned —</span>
                                    )}
                                </td>
                                <td>
                                    {o.is_active ? (
                                        <span className="badge badge-success"><CheckCircle size={12} /> Active</span>
                                    ) : (
                                        <span className="badge badge-danger"><XCircle size={12} /> Inactive</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => handleEdit(o)} className="btn-icon text-primary" title="Edit"><Edit size={16} /></button>
                                        <button onClick={() => { if (window.confirm('Delete this owner?')) deleteMutation.mutate(o.id); }} className="btn-icon" title="Delete" style={{ color: '#EF4444' }}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && owners.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No school owners found.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editingOwner ? 'Edit School Owner' : 'Add School Owner'}</h3>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    {editingOwner ? 'Update owner details and school assignment' : 'Create a new school administrator account'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid-2" style={{ gap: 16 }}>
                                <div>
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9XX XXXX XXX" />
                            </div>

                            {!editingOwner && (
                                <div style={{ marginTop: 16 }}>
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" required={!editingOwner} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                                </div>
                            )}

                            <div style={{ marginTop: 16 }}>
                                <label className="form-label">Assign School</label>
                                <select className="form-input" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })}>
                                    <option value="">— Select School —</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <label htmlFor="is_active" style={{ cursor: 'pointer', fontSize: 14 }}>Account Active</label>
                            </div>

                            <div className="modal-actions" style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingOwner ? 'Save Changes' : 'Create Owner')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .form-label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
                .modal-actions { margin-top: 24px; display: flex; gap: 12; justify-content: flex-end; }
                .btn-icon { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
                .btn-icon:hover { transform: scale(1.1); }
                .text-primary { color: var(--primary) !important; }
            `}</style>
        </div>
    );
}

