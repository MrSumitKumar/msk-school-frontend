import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, schoolsApi } from '../../services/api';
import { Users, GraduationCap, Wallet, ClipboardCheck, TrendingUp, BookOpen, ArrowUpRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSubscription } from '../../hooks/useSubscription';

const fakeChartData = [
    { month: 'Aug', fees: 42000 }, { month: 'Sep', fees: 58000 },
    { month: 'Oct', fees: 53000 }, { month: 'Nov', fees: 67000 },
    { month: 'Dec', fees: 45000 }, { month: 'Jan', fees: 71000 },
    { month: 'Feb', fees: 64000 },
];

export default function AdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => dashboardApi.stats(),
    });

    const { isModuleUnlocked, isLoading: subLoading } = useSubscription();

    const { data: subData } = useQuery({
        queryKey: ['current-subscription'],
        queryFn: () => schoolsApi.billing.currentPlan(),
    });

    const stats = data || {};
    const activeSub = subData?.active_plan;
    const isExpired = activeSub && new Date(activeSub.end_date) < new Date();
    const isExpiringSoon = activeSub && !isExpired && (new Date(activeSub.end_date) - new Date()) < (7 * 24 * 60 * 60 * 1000);

    const cards = [
        { label: 'Total Students', value: stats.total_students ?? 0, icon: Users, gradient: 'bg-gradient-primary', change: '+12 this month', module: 'students' },
        { label: 'Total Teachers', value: stats.total_teachers ?? 0, icon: GraduationCap, gradient: 'bg-gradient-success', change: '+2 this month', module: 'teachers' },
        { label: 'Fee Collected', value: `₹ ${stats.fees_collected?.toLocaleString() || '0'}`, icon: Wallet, gradient: 'bg-gradient-warning', change: '+8% vs last month', module: 'fees' },
        { label: 'Avg Attendance', value: stats.attendance_today ? `${stats.attendance_today} Present` : '0 Present', icon: ClipboardCheck, gradient: 'bg-gradient-cyan', change: 'Today', module: 'attendance' },
    ].filter(card => isModuleUnlocked(card.module));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">{stats.school_name || 'School'} — Current Academic Session</p>
                </div>
            </div>

            {/* Subscription Alerts */}
            {isExpired && (
                <div className="glass-card border-danger" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(239, 68, 68, 0.05)' }}>
                    <AlertTriangle color="var(--danger)" size={20} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>Your subscription has expired!</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Please renew your plan to continue accessing all modules without interruption.</p>
                    </div>
                    <a href="/admin/billing" className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', background: 'var(--danger)', borderColor: 'var(--danger)' }}>Renew Now</a>
                </div>
            )}

            {isExpiringSoon && !isExpired && (
                <div className="glass-card border-warning" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(245, 158, 11, 0.05)' }}>
                    <AlertTriangle color="var(--warning)" size={20} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>Subscription Expiring Soon</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Your {activeSub.plan_name} plan will expire on {new Date(activeSub.end_date).toLocaleDateString()}.</p>
                    </div>
                    <a href="/admin/billing" style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Manage Plan <ExternalLink size={14} /></a>
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading dashboard...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid-4" style={{ marginBottom: 32 }}>
                        {cards.map(({ label, value, icon: Icon, gradient, change }) => (
                            <div key={label} className="stat-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div className={gradient} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={20} color="white" />
                                    </div>
                                    <span style={{ color: '#10B981', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <ArrowUpRight size={12} />{change}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>{label}</p>
                                <p style={{ fontSize: 30, fontWeight: 800 }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid-2" style={{ marginBottom: 32 }}>
                        {isModuleUnlocked('fees') ? <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Fee Collection Trend</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Monthly revenue overview</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={fakeChartData}>
                                    <defs>
                                        <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--overlay)" />
                                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)' }} formatter={v => [`₹${v.toLocaleString()}`, 'Fees']} />
                                    <Area type="monotone" dataKey="fees" stroke="#4F46E5" strokeWidth={2} fill="url(#feeGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div> : null}

                        {/* Quick Actions */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Quick Actions</h3>
                            <div style={{ display: 'grid', gap: 12 }}>
                                {[
                                    { label: 'Add New Student', icon: Users, to: '/admin/students', color: '#4F46E5', module: 'students' },
                                    { label: 'Mark Attendance', icon: ClipboardCheck, to: '/admin/attendance', color: '#10B981', module: 'attendance' },
                                    { label: 'Collect Fee', icon: Wallet, to: '/admin/fees', color: '#F59E0B', module: 'fees' },
                                    { label: 'Schedule Exam', icon: BookOpen, to: '/admin/exams', color: '#06B6D4', module: 'exams' },
                                ].filter(action => isModuleUnlocked(action.module)).map(({ label, icon: Icon, to, color }) => (
                                    <a key={to} href={to} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', color: 'var(--text-primary)', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={18} color={color} />
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                                        <ArrowUpRight size={14} color="var(--text-secondary)" style={{ marginLeft: 'auto' }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
