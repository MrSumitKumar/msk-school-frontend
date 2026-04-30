import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsApi } from '../../services/api';
import { Layers, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlansPage() {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState({
        name: 'basic',
        max_students: 200,
        max_teachers: 20,
        price: 0,
        duration_months: 1,
        unlocked_modules: []
    });

    const { data, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => schoolsApi.plans.list(),
    });

    const plans = data?.results || data || [];

    const createMutation = useMutation({
        mutationFn: schoolsApi.plans.create,
        onSuccess: () => {
            qc.invalidateQueries(['subscription-plans']);
            setShowModal(false);
            toast.success('Plan created successfully');
        },
        onError: () => toast.error('Failed to create plan')
    });

    const updateMutation = useMutation({
        mutationFn: (data) => schoolsApi.plans.update(editingPlan.id, data),
        onSuccess: () => {
            qc.invalidateQueries(['subscription-plans']);
            setShowModal(false);
            setEditingPlan(null);
            toast.success('Plan updated successfully');
        },
        onError: () => toast.error('Failed to update plan')
    });

    const deleteMutation = useMutation({
        mutationFn: schoolsApi.plans.delete,
        onSuccess: () => {
            qc.invalidateQueries(['subscription-plans']);
            toast.success('Plan deleted');
        },
        onError: () => toast.error('Failed to delete plan')
    });

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setForm({ ...plan });
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingPlan(null);
        setForm({ name: 'basic', max_students: 200, max_teachers: 20, price: 999, duration_months: 1, features: '{}', unlocked_modules: '[]' });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure JSON strings before submit
        const submitData = {
            ...form,
            unlocked_modules: Array.isArray(form.unlocked_modules) ? JSON.stringify(form.unlocked_modules) : form.unlocked_modules,
            features: typeof form.features === 'object' ? JSON.stringify(form.features) : form.features
        };
        if (editingPlan) updateMutation.mutate(submitData);
        else createMutation.mutate(submitData);
    };

    const toggleModule = (mod) => {
        setForm(prev => {
            let modules = [];
            if (typeof prev.unlocked_modules === 'string') {
                try {
                    modules = JSON.parse(prev.unlocked_modules);
                } catch {
                    modules = [];
                }
            } else {
                modules = [...(prev.unlocked_modules || [])];
            }
            if (modules.includes(mod)) {
                modules = modules.filter(m => m !== mod);
            } else {
                modules.push(mod);
            }
            return { ...prev, unlocked_modules: modules };
        });
    };

    const AVAILABLE_MODULES = [
        'fees', 'exams', 'attendance', 'academics',
        'trash', 'activity-logs', 'settings',
        'mobile_app', 'white_label'
    ];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Subscription Plans</h1>
                    <p className="page-subtitle">View and manage available pricing tiers and feature limits</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>
                    <Plus size={16} /> Create Plan
                </button>
            </div>

            {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading plans...</div>
            ) : (
                <div className="grid-3" style={{ gap: 24 }}>
                    {plans.map(plan => {
                        const isPremium = plan.name.toLowerCase() === 'premium';
                        const isPro = plan.name.toLowerCase() === 'pro';
                        const themeColor = isPremium ? '#F59E0B' : isPro ? '#3B82F6' : '#8B5CF6';

                        return (
                            <div key={plan.id} className="plan-card" style={{ '--plan-color': themeColor }}>
                                <div className="plan-actions">
                                    <button onClick={() => handleEdit(plan)} className="action-btn text-primary"><Edit size={14} /></button>
                                    <button onClick={() => { if (window.confirm('Delete this plan?')) deleteMutation.mutate(plan.id); }} className="action-btn text-danger"><Trash2 size={14} /></button>
                                </div>
                                <div className="plan-header">
                                    <div className="plan-icon">
                                        <Layers size={22} color="white" />
                                    </div>
                                    <div>
                                        <h3 className="plan-title">{plan.name}</h3>
                                        <p className="plan-price">₹{plan.price} <span style={{ fontSize: 12, opacity: 0.7 }}>/ month</span></p>
                                    </div>
                                </div>

                                <div className="plan-limits">
                                    <p style={{ fontSize: 13, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Max Students:</span>
                                        <strong>{plan.max_students === 0 ? 'Unlimited' : plan.max_students}</strong>
                                    </p>
                                    <p style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Max Teachers:</span>
                                        <strong>{plan.max_teachers === 0 ? 'Unlimited' : plan.max_teachers}</strong>
                                    </p>
                                </div>

                                <div className="plan-modules-section">
                                    <p className="modules-title">Unlocked Features</p>
                                    <div className="modules-grid">
                                        {Array.isArray(plan.unlocked_modules) && plan.unlocked_modules.length > 0 ? (
                                            plan.unlocked_modules.map((mod, i) => (
                                                <span key={i} className="module-pill">
                                                    {mod.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No modules configured</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Plan Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid-2" style={{ gap: 16 }}>
                                <div>
                                    <label className="form-label">Plan Internal Name</label>
                                    <select className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}>
                                        <option value="basic">Basic</option>
                                        <option value="pro">Pro</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Monthly Price (₹)</label>
                                    <input type="number" className="form-input" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Max Students (0 for ∞)</label>
                                    <input type="number" className="form-input" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Max Teachers (0 for ∞)</label>
                                    <input type="number" className="form-input" value={form.max_teachers} onChange={e => setForm({ ...form, max_teachers: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <label className="form-label">Unlocked Modules</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                                    {AVAILABLE_MODULES.map(mod => (
                                        <button
                                            key={mod}
                                            type="button"
                                            onClick={() => toggleModule(mod)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                background: form.unlocked_modules.includes(mod) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                color: form.unlocked_modules.includes(mod) ? 'white' : 'var(--text-secondary)',
                                                border: '1px solid ' + (form.unlocked_modules.includes(mod) ? 'var(--primary)' : 'var(--border)')
                                            }}
                                        >
                                            {form.unlocked_modules.includes(mod) ? <Check size={12} /> : <Plus size={12} />}
                                            {mod.replace(/_/g, ' ').charAt(0).toUpperCase() + mod.replace(/_/g, ' ').slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {editingPlan ? 'Save Changes' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .form-label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
                .text-danger { color: #EF4444 !important; }
                .action-btn { background: rgba(0,0,0,0.2); border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--text-secondary); }
                .action-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
                .plan-actions { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 10; }
                .plan-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }

                .plan-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--plan-color);
                    opacity: 0.8;
                }

                .plan-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                    border-color: var(--plan-color);
                }

                .plan-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                }

                .plan-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--plan-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .plan-title {
                    font-size: 20px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0 0 4px 0;
                    color: var(--text-primary);
                }

                .plan-price {
                    color: var(--plan-color);
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0;
                }

                .plan-limits {
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 1;
                    background: rgba(0,0,0,0.1);
                    padding: 12px 16px;
                    border-radius: 8px;
                }

                .plan-modules-section {
                    border-top: 1px solid var(--border);
                    padding-top: 20px;
                    position: relative;
                    z-index: 1;
                    flex: 1;
                }

                .modules-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin: 0 0 12px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .modules-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .module-pill {
                    font-size: 12px;
                    font-weight: 600;
                    padding: 6px 12px;
                    border-radius: 20px;
                    background: var(--dark);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                    text-transform: capitalize;
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
}
