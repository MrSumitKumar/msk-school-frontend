import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const handleGoHome = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const roleRoutes = {
            super_admin: '/super-admin',
            school_admin: '/admin',
            accountant: '/admin',
            teacher: '/teacher',
            student: '/student',
            parent: '/student',
        };
        navigate(roleRoutes[user?.role] || '/login');
    };

    React.useEffect(() => {
        document.title = '404 — Page Not Found | SchoolSaaS';
    }, []);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--dark)',
            padding: 24,
        }}>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                {/* Glowing 404 */}
                <div style={{
                    fontSize: 120,
                    fontWeight: 900,
                    lineHeight: 1,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 8,
                    filter: 'drop-shadow(0 0 40px rgba(79, 70, 229, 0.4))',
                }}>
                    404
                </div>

                <div style={{
                    width: 60, height: 4,
                    background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                    borderRadius: 2,
                    margin: '0 auto 24px',
                }} />

                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Page Not Found
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back to where you belong.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleGoHome}
                        style={{
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                            border: 'none',
                            borderRadius: 12,
                            color: 'white',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseOver={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 24px rgba(79,70,229,0.4)'; }}
                        onMouseOut={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none'; }}
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '12px 28px',
                            background: 'var(--overlay)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text-primary)',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.target.style.background = 'var(--overlay-solid)'}
                        onMouseOut={e => e.target.style.background = 'var(--overlay)'}
                    >
                        Go Back
                    </button>
                </div>

                {/* Decorative dots */}
                <div style={{ marginTop: 48, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{
                            width: 6, height: 6,
                            borderRadius: '50%',
                            background: i === 2 ? '#4F46E5' : 'var(--border)',
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
