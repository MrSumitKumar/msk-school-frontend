import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../app/authStore';
import { feesApi } from '../../services/api';
import { Wallet, Download, Clock, CheckCircle, AlertCircle, FileText, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_BADGE = { paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger', partial: 'badge-info' };

const styles = `
.student-fees-header {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 40px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
}
.student-fees-header::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 60%);
    animation: rotate 30s linear infinite;
    z-index: 0;
}
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.stat-card-student {
    background: var(--glass-bg);
    border: 1px solid var(--overlay);
    border-radius: 24px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 20px;
}
.stat-card-student:hover {
    transform: translateY(-6px);
    border-color: rgba(79, 70, 229, 0.4);
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.3);
}
.record-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
}
.record-card:hover {
    border-color: var(--primary);
    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.2);
}
.empty-state {
    padding: 80px 20px;
    text-align: center;
    background: var(--glass-bg);
    border-radius: 24px;
    border: 1px dashed var(--border);
}
`;

export default function StudentFeesPage() {
    const { user } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ['my-fees'],
        queryFn: () => feesApi.payments({ student: user?.student_id || user?.id }),
    });

    const payments = data?.results || data || [];
    
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, p) => a + parseFloat(p.amount_paid || 0), 0);
    const totalPending = payments.filter(p => p.status !== 'paid').reduce((a, p) => a + parseFloat(p.amount_due || p.amount_paid || 0), 0);
    const totalAmount = totalPaid + totalPending;

    const pieData = [
        { name: 'Paid', value: totalPaid, color: '#10B981' },
        { name: 'Pending', value: totalPending, color: '#F59E0B' }
    ].filter(d => d.value > 0);

    const downloadReceipt = async (paymentId) => {
        try {
            const response = await feesApi.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', `fee_receipt_${paymentId}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            toast.success('Receipt downloaded successfully');
        } catch (error) { toast.error('Failed to download receipt'); }
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }} className="fade-in">
            <style>{styles}</style>

            <div className="student-fees-header">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>My Fees</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600 }}>
                        Track your fee payments, due amounts, and download receipts directly from your portal.
                    </p>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 32 }}>
                <div className="stat-card-student">
                    <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
                        <CheckCircle size={32} color="white" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</p>
                        <p style={{ fontSize: 28, fontWeight: 800, color: '#10B981', letterSpacing: '-1px' }}>₹{totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="stat-card-student">
                    <div style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)' }}>
                        <Clock size={32} color="white" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pending</p>
                        <p style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', letterSpacing: '-1px' }}>₹{totalPending.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="stat-card-student" style={{ padding: 16 }}>
                    {pieData.length > 0 ? (
                        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 100, height: 100 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700 }}>Payment Status</p>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{((totalPaid/totalAmount)*100).toFixed(0)}% Paid</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>No data available</div>
                    )}
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={24} color="var(--primary)" /> Payment History
                </h3>
                
                {isLoading ? (
                    <div className="empty-state">
                        <div className="animate-pulse" style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 600 }}>Loading records...</div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="empty-state">
                        <Wallet size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <h4 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>No Records Found</h4>
                        <p style={{ color: 'var(--text-secondary)' }}>You don't have any fee records yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {payments.map(p => (
                            <div key={p.id} className="record-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: '1 1 300px' }}>
                                    <div style={{ background: 'var(--overlay)', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={24} color="var(--text-secondary)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{p.fee_structure?.category?.name || 'Fee Payment'}</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span>{p.payment_date || 'Date N/A'}</span> •
                                            <span style={{ textTransform: 'capitalize' }}>{p.payment_mode}</span> • 
                                            <span style={{ fontFamily: 'monospace' }}>{p.receipt_number || 'No Receipt'}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</p>
                                        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: p.status === 'paid' ? '#10B981' : 'var(--text-primary)' }}>
                                            ₹{parseFloat(p.amount_paid).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <span className={`badge ${STATUS_BADGE[p.status]}`} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}>
                                            {p.status}
                                        </span>
                                        
                                        <button 
                                            onClick={() => downloadReceipt(p.id)}
                                            style={{
                                                background: 'rgba(79, 70, 229, 0.1)',
                                                border: '1px solid rgba(79, 70, 229, 0.2)',
                                                color: 'var(--primary)',
                                                padding: '10px 14px',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontWeight: 600,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}
                                        >
                                            <Download size={18} /> Receipt
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
