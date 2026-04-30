import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { academicsApi, teachersApi, attendanceApi } from '../../services/api';
import { Calendar, Clock, BookOpen, UserCheck, MessageSquare, Bell, TrendingUp, Award } from 'lucide-react';

export default function Dashboard() {
    const { data: user } = useQuery({ queryKey: ['profile'], queryFn: () => academicsApi.getProfile() });
    const { data: stats } = useQuery({ queryKey: ['teacher-stats'], queryFn: () => teachersApi.stats() });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const schedule = [
        { time: '08:00 - 08:45', subject: 'Mathematics', class: 'Class 10 - A', room: 'Room 201' },
        { time: '09:00 - 09:45', subject: 'Mathematics', class: 'Class 9 - B', room: 'Room 105' },
        { time: '11:00 - 11:45', subject: 'Mathematics', class: 'Class 8 - A', room: 'Room 304' },
        { time: '13:00 - 13:45', subject: 'Mathematics', class: 'Class 10 - C', room: 'Room 201' },
    ];

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="grid-4" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Students', value: stats?.total_students || 120, icon: UserCheck, color: 'bg-gradient-primary' },
                    { label: 'Attendance Rate', value: '94%', icon: TrendingUp, color: 'bg-gradient-success' },
                    { label: 'Exams Active', value: 2, icon: Award, color: 'bg-gradient-warning' },
                    { label: 'Pending Leaves', value: 3, icon: Bell, color: 'bg-gradient-danger' },
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

            <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Today's Schedule</h2>
                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View Weekly</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {schedule.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 16, padding: 16, borderRadius: 12, background: 'var(--overlay-light)', border: '1px solid var(--overlay)' }}>
                                <div style={{ width: 60, flexShrink: 0, textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, fontSize: 14 }}>{item.time.split(' ')[0]}</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>AM</p>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.subject}</h4>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={12} /> {item.class}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {item.room}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
                        <div className="grid-2" style={{ gap: 12 }}>
                            <button className="btn btn-outline" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <ClipboardCheck size={20} />
                                <span style={{ fontSize: 13 }}>Mark Attendance</span>
                            </button>
                            <button className="btn btn-outline" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <Award size={20} />
                                <span style={{ fontSize: 13 }}>Enter Marks</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import { Layers } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { ClipboardCheck } from 'lucide-react';
