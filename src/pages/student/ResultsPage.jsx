import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { academicsApi } from '../../services/api';
import { Award, Book, FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function ResultsPage() {
    const { data: results, isLoading } = useQuery({ queryKey: ['my-results'], queryFn: () => academicsApi.results() });
    const records = results?.results || results || [];

    const average = records.length ? (records.reduce((s, r) => s + parseFloat(r.marks_obtained || 0), 0) / records.length).toFixed(1) : '—';

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Report</h1>
                    <p className="page-subtitle">Detailed breakdown of your examination results and academic progress</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Download Transcript</button>
            </div>

            <div className="grid-3" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Overall Average', value: `${average}%`, icon: Award, color: 'bg-gradient-primary' },
                    { label: 'Subjects Cleared', value: records.length, icon: Book, color: 'bg-gradient-success' },
                    { label: 'Exam Rank', value: '#12', icon: TrendingUp, color: 'bg-gradient-warning' },
                ].map((s, i) => (
                    <div key={i} className="stat-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>{s.label}</p>
                                <h3 style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</h3>
                            </div>
                            <div className={s.color} style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={22} color="white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ overflowX: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading results...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Examination</th>
                                <th>Subject</th>
                                <th>Marks Obtained</th>
                                <th>Max Marks</th>
                                <th>Grade</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.exam_name}</td>
                                    <td>{r.subject_name}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.marks_obtained}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>100</td>
                                    <td style={{ fontWeight: 600 }}>{r.grade || 'A'}</td>
                                    <td><span className="badge badge-success">Passed</span></td>
                                </tr>
                            ))}
                            {records.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>No exam results available for your profile.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
