import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../app/authStore';
import { attendanceApi } from '../../services/api';
import { ClipboardCheck } from 'lucide-react';

const STATUS_COLORS = {
    present: { bg: '#10B98122', color: '#10B981', label: 'Present' },
    absent: { bg: '#EF444422', color: '#EF4444', label: 'Absent' },
    late: { bg: '#F59E0B22', color: '#F59E0B', label: 'Late' },
    half_day: { bg: '#3B82F622', color: '#3B82F6', label: 'Half Day' },
    holiday: { bg: '#8B5CF622', color: '#8B5CF6', label: 'Holiday' },
};

export default function StudentAttendancePage() {
    const { user } = useAuthStore();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const { data, isLoading } = useQuery({
        queryKey: ['my-attendance-list', month],
        queryFn: () => attendanceApi.list({ student: user?.student_id || user?.id, month }),
    });

    const records = data?.results || data || [];
    const summary = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    const total = records.length;
    const pct = total > 0 ? Math.round(((summary.present || 0) / total) * 100) : 0;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Attendance</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your daily attendance records</p>
            </div>

            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total Days', value: total, color: '#3B82F6' },
                    { label: 'Present', value: summary.present || 0, color: '#10B981' },
                    { label: 'Absent', value: summary.absent || 0, color: '#EF4444' },
                    { label: 'Late', value: summary.late || 0, color: '#F59E0B' },
                    { label: 'Attendance %', value: `${pct}%`, color: pct >= 75 ? '#10B981' : '#EF4444' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</div>
                    </div>
                ))}
            </div>

            {pct < 75 && total > 0 && (
                <div style={{ background: '#EF444415', border: '1px solid #EF444433', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#EF4444', fontSize: 14 }}>
                    ⚠️ Your attendance is below 75%. Please attend regularly to avoid issues.
                </div>
            )}

            {/* Filter */}
            <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Month:</label>
                <input type="month" className="form-input" style={{ width: 170 }} value={month} onChange={e => setMonth(e.target.value)} />
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No attendance records found</td></tr>
                        ) : records.map((r, i) => {
                            const s = STATUS_COLORS[r.status] || STATUS_COLORS.present;
                            const d = new Date(r.date);
                            return (
                                <tr key={r.id}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{r.date}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{d.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                                    <td>
                                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                            {s.label}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.remarks || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
