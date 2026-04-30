import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saasApi } from '../../services/api';
import { School, TrendingUp, CheckCircle, AlertCircle, DollarSign, Clock } from 'lucide-react';

export default function SuperAdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['super-admin-saas-stats'],
        queryFn: () => saasApi.dashboardStats(),
    });

    const stats = data || {};

    const cards = [
        { label: 'Total Schools', value: stats.total_schools ?? 0, icon: School, gradient: 'bg-gradient-primary' },
        { label: 'Active Subscriptions', value: stats.active_subscriptions ?? 0, icon: CheckCircle, gradient: 'bg-gradient-success' },
        { label: 'Monthly Revenue', value: `₹${stats.monthly_revenue?.toLocaleString('en-IN') ?? 0}`, icon: DollarSign, gradient: 'bg-gradient-cyan' },
        { label: 'Expiring Soon', value: stats.expiring_subscriptions ?? 0, icon: Clock, gradient: 'bg-gradient-warning' },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Platform Overview</h1>
                    <p className="page-subtitle">Monitor all schools and subscriptions across SchoolSaaS</p>
                </div>
            </div>

            {isLoading ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>Loading stats...</div>
            ) : (
                <div className="grid-4" style={{ marginBottom: 32 }}>
                    {cards.map(({ label, value, icon: Icon, gradient }) => (
                        <div key={label} className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{label}</p>
                                    <p style={{ fontSize: 32, fontWeight: 800 }}>{value}</p>
                                </div>
                                <div className={gradient} style={{ width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} color="white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Platform note */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <AlertCircle size={22} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>Getting Started</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        To onboard a school: Go to <strong>Schools</strong>, click <strong>Add School</strong>, fill in the details and assign a subscription plan. The school admin can then log in and manage their institution.
                    </p>
                </div>
            </div>
        </div>
    );
}
