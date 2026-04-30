import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi, studentsApi, academicsApi } from '../../services/api';
import {
    Wallet, CheckCircle, Clock, AlertCircle, Trash2, Edit2, CreditCard, Receipt,
    BarChart3, FileText, Plus, Download, Filter, Search, TrendingUp, PieChart, Activity, XCircle, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const STATUS_BADGE = { paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger', partial: 'badge-info' };
const STATUS_COLORS = { paid: '#10B981', pending: '#F59E0B', overdue: '#EF4444', partial: '#06B6D4' };
const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6'];
const TABS = ['Dashboard', 'Records', 'Submission', 'Structures'];

const styles = `
.fees-glass-header {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 40px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
}
.fees-glass-header::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 60%);
    animation: rotate 30s linear infinite;
    z-index: 0;
}
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.stat-card-premium {
    background: var(--glass-bg);
    border: 1px solid var(--overlay);
    border-radius: 24px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card-premium:hover {
    transform: translateY(-6px);
    border-color: rgba(79, 70, 229, 0.4);
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.3);
}
.custom-tab {
    padding: 12px 28px;
    border-radius: 100px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    color: var(--text-secondary);
}
.custom-tab.active {
    background: var(--primary);
    color: white;
    box-shadow: 0 8px 20px -6px rgba(79, 70, 229, 0.5);
}
.custom-tab:not(.active):hover {
    background: var(--overlay);
    color: var(--text-primary);
}
.recharts-tooltip-wrapper { outline: none !important; }
.custom-tooltip {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.premium-input {
    background: rgba(0,0,0,0.1);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 14px 18px;
    color: var(--text-primary);
    transition: all 0.2s;
    width: 100%;
}
.premium-input:focus {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
    outline: none;
}
.chart-container {
    background: var(--glass-bg);
    border: 1px solid var(--overlay);
    border-radius: 24px;
    padding: 24px;
}
`;

export default function FeesPage() {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [admissionSearch, setAdmissionSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
    const [paymentForm, setPaymentForm] = useState({
        student: '', fee_structure: '', installment: '', amount_paid: '',
        payment_date: new Date().toISOString().slice(0, 10), due_date: '',
        payment_mode: 'cash', transaction_id: '', discount_amount: '0',
        scholarship_amount: '0', late_fee_amount: '0', remarks: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [structureModal, setStructureModal] = useState(false);
    const [structureForm, setStructureForm] = useState({
        category: '', amount: '', frequency: 'monthly', installments: 1,
        due_date: 10, discount_percent: 0, late_fee_penalty_percent: 0,
        grade: '', academic_session: ''
    });
    const [structureErrors, setStructureErrors] = useState({});
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    const qc = useQueryClient();

    const { data: categoriesData } = useQuery({ queryKey: ['fee-categories'], queryFn: feesApi.categories });
    const categories = categoriesData?.results || categoriesData || [];

    const { data: gradesData } = useQuery({ queryKey: ['grades'], queryFn: academicsApi.getGrades });
    const grades = gradesData?.results || gradesData || [];

    const { data: sessionsData } = useQuery({ queryKey: ['academic-sessions'], queryFn: academicsApi.sessions });
    const sessions = sessionsData?.results || sessionsData || [];

    const createCategoryMutation = useMutation({
        mutationFn: feesApi.createCategory,
        onSuccess: (data) => {
            qc.invalidateQueries(['fee-categories']);
            setStructureForm({ ...structureForm, category: data.id });
            setShowCategoryForm(false);
            setNewCategoryName('');
            toast.success('Category created');
        }
    });

    const createStructureMutation = useMutation({
        mutationFn: feesApi.createStructure,
        onSuccess: () => {
            qc.invalidateQueries(['fee-structures']);
            setStructureModal(false);
            setStructureForm({ category: '', amount: '', frequency: 'monthly', installments: 1, due_date: 10, discount_percent: 0, late_fee_penalty_percent: 0, grade: '', academic_session: '' });
            toast.success('Fee structure created');
        },
        onError: (err) => {
            setStructureErrors(err?.response?.data || {});
            toast.error('Failed to create structure');
        }
    });

    const { data: studentsData } = useQuery({ queryKey: ['students', 'fee-students'], queryFn: () => studentsApi.list({ role: 'student', page_size: 100 }) });
    const students = studentsData?.results || studentsData || [];

    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({ queryKey: ['payments', statusFilter], queryFn: () => feesApi.payments({ status: statusFilter }) });
    const payments = paymentsData?.results || paymentsData || [];

    const { data: structuresData } = useQuery({ queryKey: ['fee-structures'], queryFn: () => feesApi.structures() });
    const structures = structuresData?.results || structuresData || [];

    const selectedStructure = structures.find(s => String(s.id) === String(paymentForm.fee_structure));
    const { data: installmentsData } = useQuery({
        queryKey: ['fee-installments', paymentForm.student, paymentForm.fee_structure],
        queryFn: () => feesApi.installments({ student: paymentForm.student, fee_structure: paymentForm.fee_structure }),
        enabled: !!paymentForm.student && !!paymentForm.fee_structure
    });
    const installments = installmentsData?.results || installmentsData || [];
    const selectedInstallment = installments.find(i => String(i.id) === String(paymentForm.installment));

    const computedAmountDue = selectedInstallment
        ? parseFloat(selectedInstallment.total_due)
        : selectedStructure
            ? parseFloat(selectedStructure.installments > 1 ? selectedStructure.installment_amount : selectedStructure.effective_amount)
            : 0;
    const computedTotalDue = computedAmountDue + parseFloat(paymentForm.late_fee_amount || 0) - parseFloat(paymentForm.discount_amount || 0) - parseFloat(paymentForm.scholarship_amount || 0);
    const computedBalance = computedTotalDue - parseFloat(paymentForm.amount_paid || 0);

    const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;

    const chartData = useMemo(() => {
        if (!payments.length) return [];
        const monthly = {};
        payments.forEach(p => {
            if (p.payment_date) {
                const month = new Date(p.payment_date).toLocaleString('default', { month: 'short' });
                monthly[month] = (monthly[month] || 0) + parseFloat(p.amount_paid || 0);
            }
        });
        return Object.entries(monthly).map(([name, Revenue]) => ({ name, Revenue }));
    }, [payments]);

    const pieData = useMemo(() => {
        if (!payments.length) return [];
        const modes = {};
        payments.forEach(p => {
            if (p.amount_paid > 0) {
                const mode = p.payment_mode || 'cash';
                modes[mode] = (modes[mode] || 0) + 1;
            }
        });
        return Object.entries(modes).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    }, [payments]);

    const downloadReceipt = async (paymentId) => {
        try {
            const response = await feesApi.downloadReceipt(paymentId);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', `fee_receipt_${paymentId}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            toast.success('Receipt downloaded successfully');
        } catch (error) { toast.error('Failed to download receipt'); }
    };

    const paymentMutation = useMutation({
        mutationFn: feesApi.createPayment,
        onSuccess: () => {
            qc.invalidateQueries(['payments']);
            qc.invalidateQueries(['fee-installments', paymentForm.student, paymentForm.fee_structure]);
            setPaymentForm({ student: '', fee_structure: '', installment: '', amount_paid: '', payment_date: new Date().toISOString().slice(0, 10), due_date: '', payment_mode: 'cash', transaction_id: '', discount_amount: '0', scholarship_amount: '0', late_fee_amount: '0', remarks: '' });
            setAdmissionSearch('');
            setFormErrors({}); toast.success('Fee payment recorded successfully');
        },
        onError: (error) => {
            setFormErrors(error?.response?.data || {});
            toast.error('Unable to submit fee payment');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: feesApi.deletePayment,
        onSuccess: () => {
            qc.invalidateQueries(['payments']);
            setDeleteModal({ isOpen: false, item: null });
            toast.success('Fee record removed');
        }
    });

    const updatePaymentForm = (field, value) => setPaymentForm(current => ({ ...current, [field]: value }));

    const handleSubmitPayment = async (event) => {
        event.preventDefault(); setFormErrors({});
        const payload = {
            ...paymentForm,
            amount_paid: parseFloat(paymentForm.amount_paid || 0), discount_amount: parseFloat(paymentForm.discount_amount || 0),
            scholarship_amount: parseFloat(paymentForm.scholarship_amount || 0), late_fee_amount: parseFloat(paymentForm.late_fee_amount || 0),
            installment: paymentForm.installment || null,
            due_date: paymentForm.due_date || null,
        };
        paymentMutation.mutate(payload);
    };

    const renderDashboard = () => (
        <div className="fade-in">
            <div className="grid-4" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, bg: 'linear-gradient(135deg, #4F46E5, #7C3AED)', trend: '+12%' },
                    { label: 'Settled Fees', value: paidCount, icon: CheckCircle, bg: 'linear-gradient(135deg, #10B981, #059669)', trend: '+8%' },
                    { label: 'Pending Fees', value: pendingCount, icon: Clock, bg: 'linear-gradient(135deg, #F59E0B, #D97706)', trend: '-3%' },
                    { label: 'Overdue', value: overdueCount, icon: AlertCircle, bg: 'linear-gradient(135deg, #EF4444, #DC2626)', trend: '+5%' },
                ].map(({ label, value, icon: Icon, bg, trend }) => (
                    <div key={label} className="stat-card-premium">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                                <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{value}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, fontWeight: 600, color: trend.startsWith('+') ? '#10B981' : '#EF4444' }}>
                                    <TrendingUp size={14} /> <span>{trend} vs last month</span>
                                </div>
                            </div>
                            <div style={{ background: bg, width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                                <Icon size={24} color="white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 32 }}>
                <div className="chart-container">
                    <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={20} color="var(--primary)" /> Revenue Trends
                    </h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                                <Bar dataKey="Revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="chart-container">
                    <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PieChart size={20} color="var(--secondary)" /> Payment Methods
                    </h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                        {pieData.map((entry, index) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length] }} />
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 24 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700 }}>
                        <Activity size={20} color="var(--primary)" /> Recent Transactions
                    </h3>
                    <button className="btn-outline" onClick={() => setActiveTab('Records')}>View All</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Student</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {payments.slice(0, 5).map(p => (
                                <tr key={p.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ fontWeight: 600 }}>{p.student_name}</td>
                                    <td style={{ fontWeight: 800, color: '#10B981' }}>₹{parseFloat(p.amount_paid).toLocaleString()}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{p.payment_date || '—'}</td>
                                    <td>
                                        <span className={`badge ${STATUS_BADGE[p.status]}`} style={{ padding: '6px 12px', fontSize: 12 }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => downloadReceipt(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 8, borderRadius: 8 }} className="hover-bg-primary">
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderRecords = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--card)', padding: '6px 16px', borderRadius: 100, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 250 }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input type="text" placeholder="Search students..." style={{ background: 'none', border: 'none', width: '100%', color: 'var(--text-primary)', outline: 'none', padding: '8px 0', fontSize: 14 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div style={{ background: 'var(--card)', padding: '6px 16px', borderRadius: 100, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Filter size={18} color="var(--text-secondary)" />
                    <select style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '8px 0', fontSize: 14, cursor: 'pointer' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {['paid', 'pending', 'overdue', 'partial'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 24 }}>
                {paymentsLoading ? (
                    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}><div className="animate-pulse">Loading fee records...</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Student</th><th>Category</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                        </thead>
                        <tbody>
                            {payments.filter(p => !searchTerm || p.student_name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.student_name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{p.fee_structure?.category?.name || p.fee_structure_name}</td>
                                    <td style={{ fontWeight: 800, color: '#10B981' }}>₹{parseFloat(p.amount_paid).toLocaleString()}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{p.payment_date || '—'}</td>
                                    <td><span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{p.payment_mode}</span></td>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.receipt_number || 'PENDING'}</td>
                                    <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button onClick={() => downloadReceipt(p.id)} className="btn-outline" style={{ padding: 6, borderRadius: 8, border: 'none' }}><Download size={16} color="var(--primary)"/></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, item: p })} className="btn-outline" style={{ padding: 6, borderRadius: 8, border: 'none' }}><Trash2 size={16} color="#EF4444"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>No fee records found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderSubmission = () => {
        const selectedStudent = students.find(s => String(s.user?.id) === String(paymentForm.student));
        const filteredStudents = students.filter(s => s.admission_number?.toLowerCase().includes(admissionSearch.toLowerCase()) || s.user?.full_name?.toLowerCase().includes(admissionSearch.toLowerCase()));

        return (
        <div className="fade-in grid-2" style={{ gap: 32, alignItems: 'start' }}>
            <form className="glass-card" style={{ padding: 32, borderRadius: 24, flex: 1 }} onSubmit={handleSubmitPayment}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 20, fontWeight: 700 }}>
                    <CreditCard size={24} color="var(--primary)" /> New Fee Collection
                </h3>
                
                <div style={{ marginBottom: 24, position: 'relative' }}>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Student Admission No.</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            className="premium-input" 
                            placeholder="Type admission number or name..."
                            value={admissionSearch}
                            onChange={e => {
                                setAdmissionSearch(e.target.value);
                                updatePaymentForm('student', '');
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            style={{ paddingRight: 40, fontSize: 16, fontWeight: 500, borderColor: paymentForm.student ? '#10B981' : 'var(--border)' }}
                        />
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                            {paymentForm.student ? (
                                <CheckCircle size={22} color="#10B981" />
                            ) : admissionSearch.trim().length > 0 ? (
                                <XCircle size={22} color="#EF4444" />
                            ) : null}
                        </div>
                    </div>
                    
                    {showSuggestions && admissionSearch && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--primary)', borderRadius: 12, marginTop: 8, zIndex: 50, maxHeight: 220, overflowY: 'auto', boxShadow: '0 12px 30px rgba(79, 70, 229, 0.15)' }}>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(s => (
                                    <div key={s.id} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--overlay)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                                        onMouseDown={() => {
                                            setAdmissionSearch(s.admission_number || s.user?.full_name);
                                            updatePaymentForm('student', s.user?.id);
                                            setShowSuggestions(false);
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.user?.full_name}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.grade_name || 'No Grade'} - {s.section_name || 'No Section'}</span>
                                        </div>
                                        <span className="badge badge-purple" style={{ fontSize: 12 }}>{s.admission_number}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>No student found with that ID or name</div>
                            )}
                        </div>
                    )}
                    {formErrors.student && <p className="form-error" style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{formErrors.student}</p>}
                </div>

                <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
                    <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Fee Structure</label>
                        <select value={paymentForm.fee_structure} onChange={e => { updatePaymentForm('fee_structure', e.target.value); updatePaymentForm('installment', ''); }} className="premium-input" style={{ fontSize: 14 }}>
                            <option value="">Select structure...</option>
                            {structures.map(s => <option key={s.id} value={s.id}>{s.category_name} - {s.grade_name || 'General'}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Installment (Optional)</label>
                        <select value={paymentForm.installment} onChange={e => {
                            updatePaymentForm('installment', e.target.value);
                            const inst = installments.find(i => String(i.id) === String(e.target.value));
                            if (inst) updatePaymentForm('due_date', inst.due_date);
                        }} className="premium-input" disabled={!installments.length} style={{ fontSize: 14 }}>
                            <option value="">None / Full Payment</option>
                            {installments.map(i => <option key={i.id} value={i.id}>Inst. {i.installment_number} · ₹{parseFloat(i.total_due).toLocaleString()} · Due {i.due_date}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid-3" style={{ gap: 16, marginBottom: 24, padding: 20, background: 'rgba(0,0,0,0.05)', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Amount Paid (₹)</label>
                        <input type="number" min="0" step="0.01" value={paymentForm.amount_paid} onChange={e => updatePaymentForm('amount_paid', e.target.value)} className="premium-input" placeholder="0.00" style={{ background: 'var(--card)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 800 }} />
                    </div>
                    <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Payment Mode</label>
                        <select value={paymentForm.payment_mode} onChange={e => updatePaymentForm('payment_mode', e.target.value)} className="premium-input" style={{ background: 'var(--card)' }}>
                            {['cash', 'upi', 'bank_transfer', 'online', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Payment Date</label>
                        <input type="date" value={paymentForm.payment_date} onChange={e => updatePaymentForm('payment_date', e.target.value)} className="premium-input" style={{ background: 'var(--card)' }} />
                    </div>
                </div>

                <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
                    <div>
                        <label className="form-label">Discount (₹)</label>
                        <input type="number" min="0" step="0.01" value={paymentForm.discount_amount} onChange={e => updatePaymentForm('discount_amount', e.target.value)} className="premium-input" />
                    </div>
                    <div>
                        <label className="form-label">Late Penalty (₹)</label>
                        <input type="number" min="0" step="0.01" value={paymentForm.late_fee_amount} onChange={e => updatePaymentForm('late_fee_amount', e.target.value)} className="premium-input" />
                    </div>
                    <div>
                        <label className="form-label">Remarks / Ref</label>
                        <input type="text" value={paymentForm.remarks} onChange={e => updatePaymentForm('remarks', e.target.value)} className="premium-input" placeholder="Notes or TXN ID..." />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                    <button type="button" className="btn-outline" style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 600 }} onClick={() => { setAdmissionSearch(''); setPaymentForm({ student: '', fee_structure: '', installment: '', amount_paid: '', payment_date: new Date().toISOString().slice(0, 10), due_date: '', payment_mode: 'cash', transaction_id: '', discount_amount: '0', scholarship_amount: '0', late_fee_amount: '0', remarks: '' }); }}>
                        Reset Form
                    </button>
                    <button type="submit" className="btn-premium" style={{ padding: '14px 36px', borderRadius: 12, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }} disabled={paymentMutation.isLoading}>
                        {paymentMutation.isLoading ? 'Processing...' : <><CheckCircle size={20} /> Confirm Payment</>}
                    </button>
                </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {selectedStudent ? (
                    <div className="stat-card-premium" style={{ borderLeft: '4px solid var(--primary)', animation: 'slideInRight 0.4s ease' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected Student</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white' }}>
                                {selectedStudent.user?.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{selectedStudent.user?.full_name}</h3>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', display: 'flex', gap: 12, fontSize: 14 }}>
                                    <span><strong style={{ color: 'var(--text-primary)' }}>ID:</strong> {selectedStudent.admission_number}</span>
                                    <span><strong style={{ color: 'var(--text-primary)' }}>Class:</strong> {selectedStudent.grade_name || 'N/A'} {selectedStudent.section_name}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, borderStyle: 'dashed', opacity: 0.7 }}>
                        <FileText size={48} color="var(--text-secondary)" style={{ marginBottom: 16, opacity: 0.5 }} />
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No Student Selected</h4>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Enter an admission number to retrieve student details.</p>
                    </div>
                )}

                <div className="stat-card-premium" style={{ background: 'linear-gradient(145deg, rgba(79, 70, 229, 0.05), rgba(0,0,0,0))' }}>
                    <p style={{ margin: '0 0 20px', color: 'var(--primary)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Receipt size={18} /> Payment Summary
                    </p>
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Amount Due</span>
                            <span style={{ fontWeight: 800 }}>₹{computedAmountDue.toFixed(2)}</span>
                        </div>
                        {parseFloat(paymentForm.discount_amount || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 12, color: '#10B981' }}>
                                <span style={{ fontWeight: 600 }}>Discount</span>
                                <span style={{ fontWeight: 800 }}>- ₹{parseFloat(paymentForm.discount_amount).toFixed(2)}</span>
                            </div>
                        )}
                        {parseFloat(paymentForm.late_fee_amount || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, color: '#EF4444' }}>
                                <span style={{ fontWeight: 600 }}>Late Penalty</span>
                                <span style={{ fontWeight: 800 }}>+ ₹{parseFloat(paymentForm.late_fee_amount).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--primary)', borderRadius: 16, color: 'white', marginTop: 8, boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)' }}>
                            <span style={{ fontWeight: 600, fontSize: 16 }}>Total Payable</span>
                            <span style={{ fontWeight: 800, fontSize: 24 }}>₹{Math.max(computedTotalDue, 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: 8 }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Balance After Payment</span>
                            <span style={{ fontWeight: 800, color: computedBalance <= 0 ? '#10B981' : '#F59E0B' }}>₹{Math.max(computedBalance, 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    };

    const renderStructures = () => (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={24} color="var(--primary)" /> Fee Structures
                </h3>
                <button className="btn-premium" onClick={() => setStructureModal(true)} style={{ borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} /> Create Structure
                </button>
            </div>
            <div className="grid-3">
                {structures.map(s => (
                    <div key={s.id} className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{s.category_name}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>{s.grade_name || 'All Grades'} • {s.academic_session_name}</p>
                            </div>
                            <span className="badge badge-info" style={{ borderRadius: 8 }}>{s.installments} Inst.</span>
                        </div>
                        <div style={{ padding: '16px 0', borderTop: '1px solid var(--overlay)', borderBottom: '1px solid var(--overlay)' }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Effective Amount</p>
                            <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>₹{parseFloat(s.effective_amount || s.amount).toLocaleString()}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                            <button className="btn-outline" style={{ flex: 1, borderRadius: 10 }}>Edit</button>
                            <button className="btn-outline" style={{ flex: 1, borderRadius: 10, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <style>{styles}</style>
            
            <div className="fees-glass-header">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>Fee Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600 }}>
                        Streamline your institution's financial operations. Monitor revenue, track settlements, and process payments securely.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 32, background: 'var(--overlay)', padding: 8, borderRadius: 100, width: 'max-content' }}>
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`custom-tab ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Dashboard' && renderDashboard()}
            {activeTab === 'Records' && renderRecords()}
            {activeTab === 'Submission' && renderSubmission()}
            {activeTab === 'Structures' && renderStructures()}

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={() => deleteMutation.mutate(deleteModal.item.id)}
                itemName={`Fee record for ${deleteModal.item?.student_name}`}
                isLoading={deleteMutation.isPending}
            />

            {structureModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: 600, padding: 32, borderRadius: 24, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setStructureModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>New Fee Structure</h3>
                        
                        <form onSubmit={e => {
                            e.preventDefault();
                            setStructureErrors({});
                            const payload = { ...structureForm, grade: structureForm.grade || null };
                            createStructureMutation.mutate(payload);
                        }}>
                            <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <label className="form-label" style={{ margin: 0 }}>Category</label>
                                        <button type="button" onClick={() => setShowCategoryForm(!showCategoryForm)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                                            {showCategoryForm ? 'Cancel' : '+ New'}
                                        </button>
                                    </div>
                                    {showCategoryForm ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="text" className="premium-input" placeholder="Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                                            <button type="button" className="btn-premium" style={{ padding: '0 16px', borderRadius: 12 }} onClick={() => newCategoryName.trim() && createCategoryMutation.mutate({ name: newCategoryName })}>Add</button>
                                        </div>
                                    ) : (
                                        <select className="premium-input" value={structureForm.category} onChange={e => setStructureForm({...structureForm, category: e.target.value})}>
                                            <option value="">Select...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                    {structureErrors.category && <span style={{ color: '#EF4444', fontSize: 12 }}>{structureErrors.category}</span>}
                                </div>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Amount (₹)</label>
                                    <input type="number" step="0.01" className="premium-input" value={structureForm.amount} onChange={e => setStructureForm({...structureForm, amount: e.target.value})} required />
                                    {structureErrors.amount && <span style={{ color: '#EF4444', fontSize: 12 }}>{structureErrors.amount}</span>}
                                </div>
                            </div>

                            <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Grade (Optional)</label>
                                    <select className="premium-input" value={structureForm.grade} onChange={e => setStructureForm({...structureForm, grade: e.target.value})}>
                                        <option value="">All Grades</option>
                                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Academic Session</label>
                                    <select className="premium-input" value={structureForm.academic_session} onChange={e => setStructureForm({...structureForm, academic_session: e.target.value})}>
                                        <option value="">Select...</option>
                                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {structureErrors.academic_session && <span style={{ color: '#EF4444', fontSize: 12 }}>{structureErrors.academic_session}</span>}
                                </div>
                            </div>

                            <div className="grid-3" style={{ gap: 20, marginBottom: 32 }}>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Frequency</label>
                                    <select className="premium-input" value={structureForm.frequency} onChange={e => setStructureForm({...structureForm, frequency: e.target.value})}>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="half_yearly">Half Yearly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="one_time">One Time</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Installments</label>
                                    <input type="number" min="1" className="premium-input" value={structureForm.installments} onChange={e => setStructureForm({...structureForm, installments: e.target.value})} />
                                    {structureErrors.installments && <span style={{ color: '#EF4444', fontSize: 12 }}>{structureErrors.installments}</span>}
                                </div>
                                <div>
                                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Due Date (Day)</label>
                                    <input type="number" min="1" max="31" className="premium-input" value={structureForm.due_date} onChange={e => setStructureForm({...structureForm, due_date: e.target.value})} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                                <button type="button" className="btn-outline" onClick={() => setStructureModal(false)} style={{ padding: '12px 24px', borderRadius: 12 }}>Cancel</button>
                                <button type="submit" className="btn-premium" disabled={createStructureMutation.isPending} style={{ padding: '12px 24px', borderRadius: 12 }}>
                                    {createStructureMutation.isPending ? 'Creating...' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
