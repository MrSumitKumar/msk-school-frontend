import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { academicsApi } from '../../services/api';
import { User, Book, Calendar, Clock, Award, Bell, TrendingUp, ChevronRight, UserCircle } from 'lucide-react';

export default function Dashboard() {
    const { data: user } = useQuery({ queryKey: ['profile'], queryFn: () => academicsApi.getProfile() });
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hello, {user?.first_name}!</h1>
                    <p className="page-subtitle">{today}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {user?.grade_name && (
                        <div className="glass-card" style={{ padding: '8px 16px', background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: 'var(--primary)', fontWeight: 600, fontSize: 14, borderRadius: 12 }}>
                            Class {user.grade_name} - {user.section_name}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Class Teacher', value: user?.class_teacher_name || 'Not Assigned', icon: UserCircle, color: 'bg-gradient-primary' },
                    { label: 'Attendance', value: '98%', icon: TrendingUp, color: 'bg-gradient-success' },
                    { label: 'Active Subjects', value: '8', icon: Book, color: 'bg-gradient-warning' },
                ].map((s, i) => (
                    <div key={i} className="stat-card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{s.label}</p>
                                <h3 style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</h3>
                            </div>
                            <div className={s.color} style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={20} color="white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>My Profile</h2>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div className="bg-gradient-primary" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'white' }}>
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 18 }}>{user?.first_name} {user?.last_name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Adm No: {user?.admission_number}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Class', value: user?.grade_name ? `Class ${user.grade_name}` : '—' },
                            { label: 'Section', value: user?.section_name || '—' },
                            { label: 'Roll No', value: user?.roll_number || '—' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--overlay)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.label}</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upcoming Classes</h2>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }}>View Timetable</button>
                    </div>
                    {/* Placeholder classes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { time: '09:00 AM', subject: 'Mathematics', teacher: 'Dr. Sharma' },
                            { time: '10:00 AM', subject: 'Physics', teacher: 'Mr. Gupta' },
                            { time: '11:15 AM', subject: 'English', teacher: 'Ms. Verma' },
                        ].map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, background: 'var(--overlay-light)', border: '1px solid var(--overlay)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', width: 70 }}>{c.time}</div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 600, fontSize: 15 }}>{c.subject}</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.teacher}</p>
                                </div>
                                <ChevronRight size={16} color="var(--text-secondary)" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
