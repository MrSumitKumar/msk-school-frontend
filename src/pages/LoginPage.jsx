import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import { authApi } from '../services/api';
import { School, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Normalize email and trim password to handle mobile keyboard quirks
            const normalizedEmail = email.trim().toLowerCase();
            const trimmedPassword = password.trim();
            const loginData = await authApi.login({ email: normalizedEmail, password: trimmedPassword });
            login(loginData.user, loginData.access, loginData.refresh);
            const role = loginData.user.role;
            if (role === 'super_admin') navigate('/super-admin');
            else if (role === 'teacher') navigate('/teacher');
            else if (role === 'student' || role === 'parent') navigate('/student');
            else navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
            padding: 24,
        }}>
            <div style={{ position: 'fixed', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(79,70,229,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 0 40px rgba(79,70,229,0.4)',
                    }}>
                        <School size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                        SchoolSaaS
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        School Management Platform
                    </p>
                </div>

                <div style={{ padding: 36, background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid var(--overlay-heavy)', borderRadius: 16 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Welcome back</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>
                        Sign in to your account to continue
                    </p>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                style={{ width: '100%', background: 'var(--overlay)', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none' }}
                                placeholder="admin@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    style={{ width: '100%', background: 'var(--overlay)', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', paddingRight: 44 }}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(!showPwd)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#4F46E5', color: 'white' }} disabled={loading}>
                            {loading ? (
                                <span>Signing in...</span>
                            ) : (
                                <><LogIn size={18} /> Sign In</>
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
