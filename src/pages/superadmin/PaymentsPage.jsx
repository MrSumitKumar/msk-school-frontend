import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { saasApi } from '../../services/api';
import { CreditCard, Search, DollarSign, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
    const [search, setSearch] = useState('');

    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: saasApi.payments.list,
    });

    const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => saasApi.invoices.list(),
    });

    const payments = (paymentsData?.results || paymentsData || []).filter(p =>
        (p.school_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.transaction_id || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payments & Billing</h1>
                    <p className="page-subtitle">Track school payments, transactions, and invoices</p>
                </div>
            </div>

            <div className="search-bar" style={{ marginBottom: 24, display: 'inline-flex' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input placeholder="Search transactions or schools..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="glass-card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr>
                        <th>Date</th><th>School</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Status</th><th>Bill</th>
                    </tr></thead>
                    <tbody>
                        {paymentsLoading ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading payments...</td></tr> : payments.map(p => (
                            <tr key={p.id}>
                                <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                                <td><strong>{p.school_name || `School #${p.school}`}</strong></td>
                                <td><strong style={{ color: 'var(--success)' }}>₹{p.amount}</strong></td>
                                <td><span className="badge badge-info">{p.payment_method?.toUpperCase()}</span></td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.transaction_id || '—'}</td>
                                <td>
                                    {p.payment_status === 'completed' && <span className="badge badge-success"><CheckCircle size={12} /> Paid</span>}
                                    {p.payment_status === 'pending' && <span className="badge badge-warning"><Clock size={12} /> Pending</span>}
                                    {p.payment_status === 'failed' && <span className="badge badge-danger">Failed</span>}
                                </td>
                                <td>
                                    {p.invoice_number ? (
                                        <span className="badge badge-outline" title={p.invoice_number} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                                            📄 {p.invoice_number}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!paymentsLoading && payments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No payment records found.</td></tr>}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 40 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Invoices</h3>
                <div className="grid-3" style={{ gap: 16 }}>
                    {(invoicesData?.results || invoicesData || []).slice(0, 6).map(inv => (
                        <div key={inv.id} className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: 14 }}>{inv.invoice_number}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{inv.school_name} - {inv.plan_name}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>₹{inv.amount}</p>
                                <span className="badge badge-success" style={{ fontSize: 10 }}>Paid</span>
                            </div>
                        </div>
                    ))}
                    {!invoicesLoading && (invoicesData?.results || invoicesData || []).length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>No invoices generated yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
