 import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import { LayoutDashboard, School, LogOut, Bell, ShieldCheck, ChevronDown, Trash2, Activity, Menu, X, CreditCard, Layers, FileText, CheckSquare, Users } from 'lucide-react';
import ParticleCursor from '../components/ParticleCursor';

const navItems = [
    { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/super-admin/schools', icon: School, label: 'Schools' },
    { to: '/super-admin/owners', icon: Users, label: 'School Owners' },
    { to: '/super-admin/plans', icon: Layers, label: 'Subscription Plans' },
    { to: '/super-admin/subscriptions', icon: CheckSquare, label: 'Active Subscriptions' },
    { to: '/super-admin/payments', icon: CreditCard, label: 'Payments & Billing' },
    { to: '/super-admin/trash', icon: Trash2, label: 'Trash' },
    { to: '/super-admin/activity-logs', icon: Activity, label: 'Activity Logs' },
];

export default function SuperAdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const titles = {
            '/super-admin': 'Control Center',
            '/super-admin/schools': 'Schools Management',
            '/super-admin/trash': 'Trash Bin',
            '/super-admin/activity-logs': 'Activity Logs',
        };
        const title = titles[location.pathname] || 'Super Admin';
        document.title = `${title} — SchoolSaaS`;
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <ParticleCursor />
            <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />

            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>SchoolSaaS</div>
                            <div style={{ color: '#7C3AED', fontSize: 11, fontWeight: 600 }}>Super Admin</div>
                        </div>
                    </div>
                    <button className="mobile-only" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>

                <nav style={{ padding: '12px 0', flex: 1 }}>
                    <div style={{ padding: '8px 16px 4px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Control Center</div>
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>
                    ))}
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 8, borderRadius: 10 }} onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
                        </div>
                        <ChevronDown size={14} color="var(--text-secondary)" />
                    </div>
                    {showUserMenu && (
                        <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}><LogOut size={16} /> Sign Out</button>
                        </div>
                    )}
                </div>
            </aside>

            <main className="main-content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setIsMobileMenuOpen(true)} className="mobile-only-flex" style={{ background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 10, width: 40, height: 40, cursor: 'pointer', color: 'var(--text-primary)' }}><Menu size={20} /></button>
                        <div>
                            <h2 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700 }}>Control Center 🌐</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="desktop-only">Managing all schools across the platform</p>
                        </div>
                    </div>
                    <button style={{ background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-secondary)' }}><Bell size={18} /></button>
                </div>
                <div className="fade-in"><Outlet /></div>
            </main>
            <style>{`
                @media (min-width: 769px) { .mobile-only, .mobile-only-flex { display: none !important; } }
                @media (max-width: 768px) { .desktop-only { display: none !important; } .mobile-only-flex { display: flex !important; } }
            `}</style>
        </div>
    );
}
