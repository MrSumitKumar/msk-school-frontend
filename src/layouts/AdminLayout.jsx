import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import {
    LayoutDashboard, School, Users, BookOpen, ClipboardCheck,
    Wallet, FileText, Settings, LogOut, Bell, ChevronDown, GraduationCap,
    Trash2, Activity, Menu, X, CreditCard, Lock, Smartphone, Calendar
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true, roles: ['school_admin', 'accountant'], module: 'dashboard' },
    { to: '/admin/students', icon: Users, label: 'Students', roles: ['school_admin', 'accountant'], module: 'students' },
    { to: '/admin/teachers', icon: GraduationCap, label: 'Teachers', roles: ['school_admin'], module: 'teachers' },
    { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance', roles: ['school_admin'], module: 'attendance' },
    { to: '/admin/fees', icon: Wallet, label: 'Fee Management', roles: ['school_admin', 'accountant'], module: 'fees' },
    { to: '/admin/exams', icon: FileText, label: 'Exams & Results', roles: ['school_admin'], module: 'exams' },
    { to: '/admin/academics', icon: BookOpen, label: 'Academics', roles: ['school_admin'], module: 'academics' },
    { to: '/admin/timetable', icon: Calendar, label: 'Timetable', roles: ['school_admin'], module: 'timetable' },
    { to: '/admin/trash', icon: Trash2, label: 'Trash', roles: ['school_admin'], module: 'trash' },
    { to: '/admin/activity-logs', icon: Activity, label: 'Activity Logs', roles: ['school_admin'], module: 'activity-logs' },
    { to: '/admin/billing', icon: CreditCard, label: 'Billing & Plan', roles: ['school_admin'], module: 'billing' },
    { to: '/admin/mobile-app', icon: Smartphone, label: 'Mobile App', roles: ['school_admin'], module: 'mobile_app' },
    { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['school_admin'], module: 'settings' },
];

export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const titles = {
            '/admin': 'Dashboard',
            '/admin/students': 'Students',
            '/admin/teachers': 'Teachers',
            '/admin/attendance': 'Attendance',
            '/admin/fees': 'Fee Management',
            '/admin/exams': 'Exams & Results',
            '/admin/academics': 'Academics',
            '/admin/timetable': 'Timetable',
            '/admin/trash': 'Trash Bin',
            '/admin/activity-logs': 'Activity Logs',
            '/admin/billing': 'Billing & Plan',
        };
        const title = titles[location.pathname] || 'Admin Panel';
        document.title = `${title} — SchoolSaaS`;

        // Close mobile menu on route change
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                {/* Logo */}
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: 'var(--overlay)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                        flexShrink: 0
                    }}>
                        {user?.school_logo ? (
                            <img
                                src={user.school_logo}
                                alt="logo"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<div class="school-fallback"><svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--primary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>';
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                            />
                        ) : (
                            <School size={24} color="var(--primary)" />
                        )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{
                            fontWeight: 800,
                            fontSize: 18,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            letterSpacing: '-0.5px'
                        }}>
                            {user?.school_name || 'SchoolSaaS'}
                        </div>
                        <div style={{
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Admin Portal
                        </div>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button
                    className="mobile-only"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: isMobileMenuOpen ? 'block' : 'none' }}
                >
                    <X size={20} />
                </button>

                {/* Nav */}
                <nav style={{ padding: '12px 0', flex: 1 }}>
                    <div style={{ padding: '8px 16px 4px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Main Menu
                    </div>
                    {navItems
                        .filter(item => item.roles.includes(user?.role))
                        .map(({ to, icon: Icon, label, end, module }) => {
                            const { isModuleUnlocked } = useSubscription();
                            const isLocked = !isModuleUnlocked(module);

                            return (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isLocked ? 'nav-locked' : ''}`}
                                >
                                    <Icon size={18} />
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {isLocked && <Lock size={12} className="lock-badge" />}
                                </NavLink>
                            );
                        })}
                </nav>

                {/* User */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px', borderRadius: 10, transition: 'background 0.2s' }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="bg-gradient-primary" style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.full_name}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 11, textTransform: 'capitalize' }}>
                                {user?.role?.replace('_', ' ')}
                            </div>
                        </div>
                        <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </div>

                    {showUserMenu && (
                        <div style={{ marginTop: 8, padding: '4px', background: 'var(--overlay-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <button
                                onClick={handleLogout}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', borderRadius: 8 }}
                                className="hover-bg-red"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </aside >

            {/* Main */}
            < main className="main-content" style={{ flex: 1 }
            }>
                {/* Top bar */}
                < div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--overlay)', border: '1px solid var(--border)',
                                borderRadius: 10, width: 40, height: 40, cursor: 'pointer', color: 'var(--text-primary)'
                            }}
                            className="mobile-only-flex"
                        >
                            <Menu size={20} />
                        </button>

                        <div>
                            <h2 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700 }}>Welcome back, {user?.first_name}! 👋</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="desktop-only">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button style={{ background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Bell size={18} />
                        </button>
                    </div>
                </div >

                <div className="fade-in">
                    <Outlet />
                </div>
            </main >

            <style>{`
                @media (min-width: 769px) {
                    .mobile-only, .mobile-only-flex { display: none !important; }
                }
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-only-flex { display: flex !important; }
                }

                /* Locked styles */
                .nav-item.nav-locked {
                    opacity: 0.7;
                }
                .nav-item.nav-locked:hover {
                    opacity: 1;
                }
                .lock-badge {
                    color: #F59E0B;
                    opacity: 0.8;
                }
                .nav-item.active .lock-badge {
                    color: white;
                }
            `}</style>
        </div >
    );
}
