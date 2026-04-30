import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import {
    LayoutDashboard, User, ClipboardCheck,
    Wallet, FileText, LogOut, Bell, ChevronDown, Menu, X
} from 'lucide-react';

const navItems = [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/attendance', icon: ClipboardCheck, label: 'My Attendance' },
    { to: '/student/fees', icon: Wallet, label: 'My Fees' },
    { to: '/student/results', icon: FileText, label: 'My Results' },
];

export default function StudentLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const titles = {
            '/student': 'Dashboard',
            '/student/attendance': 'My Attendance',
            '/student/fees': 'My Fees',
            '/student/results': 'My Results',
        };
        const title = titles[location.pathname] || 'Student Portal';
        document.title = `${title} — SchoolSaaS`;
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />

            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                            <User size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>SchoolSaaS</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Student Portal</div>
                        </div>
                    </div>
                    <button className="mobile-only" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>

                <nav style={{ padding: '12px 0', flex: 1 }}>
                    <div style={{ padding: '8px 16px 4px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Student Menu</div>
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={18} />{label}</NavLink>
                    ))}
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px', borderRadius: 10 }} onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
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
                            <h2 style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700 }}>Hello, {user?.first_name}! 🎓</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="desktop-only">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <button style={{ background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-secondary)' }}><Bell size={18} /> </button>
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
