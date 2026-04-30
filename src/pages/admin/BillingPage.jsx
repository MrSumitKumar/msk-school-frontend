import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { schoolsApi } from '../../services/api';
import {
    CreditCard, CheckCircle, AlertTriangle, Layers, Zap,
    Crown, Clock, Users, GraduationCap, ArrowRight, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

// Plan metadata
const PLAN_META = {
    basic: {
        icon: <Layers size={24} color="white" />,
        color: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        badge: null,
        tagline: 'Perfect for small schools getting started',
    },
    pro: {
        icon: <Zap size={24} color="white" />,
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        badge: 'MOST POPULAR',
        tagline: 'Ideal for growing schools',
    },
    premium: {
        icon: <Crown size={24} color="white" />,
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        badge: 'BEST VALUE',
        tagline: 'Full power for large institutions',
    },
};

function getPlanMeta(planName) {
    return PLAN_META[planName?.toLowerCase()] || PLAN_META.basic;
}

export default function BillingPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingPlanId, setProcessingPlanId] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showMethodModal, setShowMethodModal] = useState(false);

    // Fetch current subscription
    const { data: subData, isLoading: subLoading } = useQuery({
        queryKey: ['current-subscription'],
        queryFn: () => schoolsApi.billing.currentPlan(),
    });

    // Fetch all available plans
    const { data: plansData, isLoading: plansLoading } = useQuery({
        queryKey: ['available-plans'],
        queryFn: () => schoolsApi.plans.list(),
    });

    const activeSub = subData?.active_plan;
    const plans = plansData?.results || plansData || [];

    // Sort plans: basic → pro → premium
    const PLAN_ORDER = ['basic', 'pro', 'premium'];
    const sortedPlans = [...plans].sort((a, b) =>
        PLAN_ORDER.indexOf(a.name.toLowerCase()) - PLAN_ORDER.indexOf(b.name.toLowerCase())
    );

    const isExpired = activeSub && new Date(activeSub.end_date) < new Date();

    // ── Handle returning from PhonePe redirect ────────────────────────
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tid = urlParams.get('tid');
        if (tid) {
            handleVerifyPhonePePayment(tid);
        }
    }, []);

    const handleVerifyPhonePePayment = async (tid) => {
        setIsProcessing(true);
        const loadingToast = toast.loading('Verifying PhonePe payment...');
        
        // Polling logic: retry up to 5 times with 3s delay
        let attempts = 0;
        const maxAttempts = 5;

        const verify = async () => {
            try {
                const res = await schoolsApi.billing.phonepe.verifyPayment({ transaction_id: tid });
                if (res.status === 'success') {
                    toast.success('🎉 Payment successful! Your plan is now active.', { id: loadingToast, duration: 5000 });
                    queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
                    // Clear URL params
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setTimeout(() => navigate('/admin'), 1000);
                    return true;
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        toast.loading(`Payment pending... checking again (${attempts}/${maxAttempts})`, { id: loadingToast });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return await verify();
                    } else {
                        toast.error(res.message || 'Payment pending or failed. Please refresh later.', { id: loadingToast });
                        return false;
                    }
                }
            } catch (err) {
                toast.error('Payment verification encountered an error. Support notified.', { id: loadingToast });
                return false;
            }
        };

        await verify();
        setIsProcessing(false);
    };

    const handleBuyPlan = (plan) => {
        setSelectedPlan(plan);
        setShowMethodModal(true);
    };

    // ── PhonePe Flow ──────────────────────────────────
    const initiatePhonePe = async () => {
        const plan = selectedPlan;
        if (!plan || isProcessing) return;

        setIsProcessing(true);
        setShowMethodModal(false);
        setProcessingPlanId(plan.id);

        const loadingToast = toast.loading(`Opening PhonePe for ${plan.name}...`);
        try {
            console.log('DEBUG: Initiating PhonePe order for plan:', plan.id);
            const res = await schoolsApi.billing.phonepe.createOrder({ plan_id: plan.id });
            console.log('DEBUG: PhonePe order response:', res);
            toast.dismiss(loadingToast);
            if (res.payment_url) {
                window.location.href = res.payment_url;
            } else {
                toast.error('Could not initiate PhonePe payment.');
                setIsProcessing(false);
                setProcessingPlanId(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'PhonePe payment failed.', { id: loadingToast });
            setIsProcessing(false);
            setProcessingPlanId(null);
        }
    };

    // ── Binance Pay Flow ──────────────────────────────
    const initiateBinance = async () => {
        const plan = selectedPlan;
        if (!plan || isProcessing) return;

        setIsProcessing(true);
        setShowMethodModal(false);
        setProcessingPlanId(plan.id);

        const loadingToast = toast.loading(`Opening Binance Pay for ${plan.name}...`);
        try {
            // Updated api.js to have binance.createOrder
            const res = await schoolsApi.billing.binance.createOrder({ plan_id: plan.id });
            toast.dismiss(loadingToast);

            if (res.checkoutUrl) {
                window.location.href = res.checkoutUrl;
            } else if (res.universalUrl) {
                window.location.href = res.universalUrl;
            } else {
                toast.error('Could not initiate Binance payment.');
                setIsProcessing(false);
                setProcessingPlanId(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Binance Pay failed. Ensure API keys are setup.', { id: loadingToast });
            setIsProcessing(false);
            setProcessingPlanId(null);
        }
    };

    if (subLoading || plansLoading) {
        return (
            <div className="fade-in" style={{ padding: 60, textAlign: 'center' }}>
                <div className="billing-spinner" />
                <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading billing info...</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <CreditCard size={26} style={{ marginRight: 10, verticalAlign: 'middle' }} />
                        Billing &amp; Subscription
                    </h1>
                    <p className="page-subtitle">Upgrade your school plan — pay securely with PhonePe / UPI</p>
                </div>
            </div>

            {/* Status Banner */}
            {activeSub ? (
                <div className={`bill-status ${isExpired ? 'bill-expired' : 'bill-active'}`}>
                    <div className="bill-status-icon">
                        {isExpired ? <AlertTriangle size={22} color="white" /> : <CheckCircle size={22} color="white" />}
                    </div>
                    <div className="bill-status-body">
                        <h3>{isExpired ? 'Subscription Expired' : `Active Plan: ${activeSub.plan_name?.toUpperCase()}`}</h3>
                        <p>
                            {isExpired
                                ? 'Renew your subscription to continue using all features.'
                                : `Valid until ${new Date(activeSub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ${activeSub.plan_details?.max_students === 0 ? 'Unlimited' : activeSub.plan_details?.max_students} Students · ${activeSub.plan_details?.max_teachers === 0 ? 'Unlimited' : activeSub.plan_details?.max_teachers} Teachers`
                            }
                        </p>
                    </div>
                    <span className={`bill-badge ${isExpired ? 'bill-badge-exp' : ''}`}>
                        {isExpired ? 'Expired' : '✓ Active'}
                    </span>
                </div>
            ) : (
                <div className="bill-status bill-trial">
                    <div className="bill-status-icon trial-icon"><Clock size={22} color="white" /></div>
                    <div className="bill-status-body">
                        <h3>No Active Subscription</h3>
                        <p>Select a plan below to get started with your school management system.</p>
                    </div>
                </div>
            )}

            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Choose Your Plan</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        30-day billing cycle • Pay via PhonePe / UPI / Debit Card
                    </p>
                </div>
                <div className="secure-strip">
                    <ShieldCheck size={14} /> SSL Secured
                </div>
            </div>

            {/* Plans Grid */}
            <div className="bill-grid">
                {sortedPlans.map((plan) => {
                    const meta = getPlanMeta(plan.name);
                    const isActivePlan = activeSub?.plan === plan.id && !isExpired;
                    const isProcPlan = processingPlanId === plan.id && isProcessing;

                    return (
                        <div
                            key={plan.id}
                            className={`bill-card ${isActivePlan ? 'bill-card-active' : ''} ${meta.badge ? 'bill-card-featured' : ''}`}
                            style={{ '--pc': meta.color, '--pg': meta.gradient }}
                        >
                            {meta.badge && <div className="bill-ribbon">{meta.badge}</div>}

                            {/* Card Header */}
                            <div className="bill-card-head">
                                <div className="bill-card-icon" style={{ background: meta.gradient }}>{meta.icon}</div>
                                <div>
                                    <h3 className="bill-plan-name">{plan.name}</h3>
                                    <p className="bill-plan-tag">{meta.tagline}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="bill-price">
                                <span className="bill-cur">₹</span>
                                <span className="bill-amt">{Number(plan.price).toLocaleString('en-IN')}</span>
                                <span className="bill-per">/ month</span>
                            </div>

                            {/* Limits */}
                            <div className="bill-limits">
                                <div className="bill-limit-row">
                                    <Users size={13} />
                                    <span>{plan.max_students === 0 ? 'Unlimited' : plan.max_students} Students</span>
                                </div>
                                <div className="bill-limit-row">
                                    <GraduationCap size={13} />
                                    <span>{plan.max_teachers === 0 ? 'Unlimited' : plan.max_teachers} Teachers</span>
                                </div>
                            </div>

                            {/* Modules */}
                            {plan.unlocked_modules?.length > 0 && (
                                <div className="bill-mods">
                                    <p className="bill-mods-title">Included Modules</p>
                                    <div className="bill-mods-list">
                                        {plan.unlocked_modules.map((m, i) => (
                                            <span key={i} className="bill-mod-pill">
                                                <CheckCircle size={9} />
                                                {m.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <button
                                className={`bill-btn ${isActivePlan ? 'bill-btn-active' : 'bill-btn-buy'}`}
                                onClick={() => !isActivePlan && handleBuyPlan(plan)}
                                disabled={isActivePlan || isProcessing}
                                style={isActivePlan ? {} : { background: meta.gradient }}
                            >
                                {isActivePlan ? (
                                    <><CheckCircle size={15} /> Current Plan</>
                                ) : isProcPlan ? (
                                    <><div className="btn-spin" /> Opening PhonePe...</>
                                ) : (
                                    <>Buy Plan <ArrowRight size={15} /></>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* PhonePe & Binance Trust Strip */}
            <div className="phonepe-trust">
                <span style={{ fontSize: 20 }}>🛡️</span>
                <span>Payments powered by <strong style={{ color: '#5f259f' }}>PhonePe</strong> &amp; <strong style={{ color: '#FCD535' }}>Binance Pay</strong> · Secure Transaction</span>
                <span className="phonepe-secured">🔒 SSL Secured</span>
            </div>

            {/* Method Selection Modal */}
            {showMethodModal && (
                <div className="modal-overlay">
                    <div className="method-modal glass-card fade-in">
                        <div className="modal-head">
                            <h3>Select Payment Method</h3>
                            <button className="close-btn" onClick={() => setShowMethodModal(false)}>×</button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Upgrading to <strong>{selectedPlan?.name?.toUpperCase()}</strong> plan (₹{selectedPlan?.price})
                        </p>

                        <div className="method-grid">
                            <button className="method-opt phonepe-opt" onClick={initiatePhonePe}>
                                <div className="opt-icon">📱</div>
                                <div className="opt-text">
                                    <strong>PhonePe / UPI</strong>
                                    <span>GPay, PhonePe, Cards, Net Banking</span>
                                </div>
                                <ArrowRight size={16} />
                            </button>

                            <button className="method-opt binance-opt" onClick={initiateBinance}>
                                <div className="opt-icon" style={{ background: '#FCD535' }}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="black">
                                        <path d="M16.624 13.9202l2.711 2.7112-4.335 4.3351-2.711-2.7113-4.3351 4.3351-2.7112-2.7113 4.3351-4.3351-2.7112-2.7111 4.3351-4.3351 2.7112 2.7112 4.335-4.3351 2.7113 2.7113-4.3351 4.335zM12.0001 0l2.7112 2.7113-2.7112 2.7112-2.7112-2.7112L12.0001 0z" />
                                    </svg>
                                </div>
                                <div className="opt-text">
                                    <strong>Binance Pay</strong>
                                    <span>USDT, BTC, ETH & Crypto</span>
                                </div>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STYLES */}
            <style>{`
                /* Status */
                .bill-status {
                    display: flex; align-items: center; gap: 18px;
                    padding: 20px 24px; border-radius: 14px;
                    margin-bottom: 32px; border: 1px solid transparent;
                }
                .bill-active { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.25); }
                .bill-expired { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.25); }
                .bill-trial { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.25); }
                .bill-status-icon {
                    width: 46px; height: 46px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .bill-active .bill-status-icon { background: #10B981; }
                .bill-expired .bill-status-icon { background: #EF4444; }
                .bill-trial .trial-icon { background: #F59E0B; }
                .bill-status-body { flex: 1; }
                .bill-status-body h3 { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
                .bill-status-body p { margin: 0; font-size: 13px; color: var(--text-secondary); }
                .bill-badge {
                    font-size: 11px; font-weight: 700; padding: 5px 12px;
                    border-radius: 20px; background: rgba(16,185,129,0.15); color: #10B981; white-space: nowrap;
                }
                .bill-badge-exp { background: rgba(239,68,68,0.15); color: #EF4444; }

                /* Secure strip */
                .secure-strip {
                    display: flex; align-items: center; gap: 6px; font-size: 12px;
                    font-weight: 600; color: var(--text-secondary);
                    background: rgba(255,255,255,0.04); padding: 7px 14px;
                    border-radius: 20px; border: 1px solid var(--border);
                }

                /* Grid */
                .bill-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
                    gap: 22px; margin-bottom: 32px;
                }

                /* Card */
                .bill-card {
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: 18px; padding: 26px;
                    position: relative; overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
                    display: flex; flex-direction: column; gap: 18px;
                }
                .bill-card::before {
                    content: ''; position: absolute; inset: 0;
                    background: var(--pg); opacity: 0;
                    transition: opacity 0.3s; border-radius: 18px;
                }
                .bill-card > * { position: relative; z-index: 1; }
                .bill-card:hover::before { opacity: 0.04; }
                .bill-card:hover {
                    transform: translateY(-6px);
                    border-color: var(--pc);
                    box-shadow: 0 18px 36px rgba(0,0,0,0.2), 0 0 0 1px var(--pc);
                }
                .bill-card-active {
                    border-color: var(--pc) !important;
                    box-shadow: 0 0 0 2px var(--pc), 0 12px 28px rgba(0,0,0,0.15) !important;
                }
                .bill-card-featured { border-color: var(--pc); }

                /* Ribbon */
                .bill-ribbon {
                    position: absolute; top: 16px; right: -28px;
                    background: var(--pg); color: white;
                    font-size: 9px; font-weight: 800;
                    padding: 5px 34px; transform: rotate(35deg);
                    letter-spacing: 0.8px; z-index: 2;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                }

                /* Card Head */
                .bill-card-head { display: flex; align-items: center; gap: 14px; }
                .bill-card-icon {
                    width: 50px; height: 50px; border-radius: 13px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .bill-plan-name { margin: 0 0 3px; font-size: 19px; font-weight: 800; text-transform: uppercase; }
                .bill-plan-tag { margin: 0; font-size: 11px; color: var(--text-secondary); line-height: 1.4; }

                /* Price */
                .bill-price { display: flex; align-items: baseline; gap: 3px; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
                .bill-cur { font-size: 20px; font-weight: 700; color: var(--pc); }
                .bill-amt { font-size: 38px; font-weight: 900; color: var(--pc); line-height: 1; }
                .bill-per { font-size: 12px; color: var(--text-secondary); }

                /* Limits */
                .bill-limits { display: flex; flex-direction: column; gap: 9px; }
                .bill-limit-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
                .bill-limit-row svg { color: var(--pc); flex-shrink: 0; }

                /* Modules */
                .bill-mods { flex: 1; }
                .bill-mods-title { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 9px; }
                .bill-mods-list { display: flex; flex-wrap: wrap; gap: 5px; }
                .bill-mod-pill {
                    display: flex; align-items: center; gap: 4px;
                    font-size: 10px; font-weight: 600; padding: 3px 9px;
                    border-radius: 20px; background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border); color: var(--text-secondary);
                    text-transform: capitalize;
                }
                .bill-mod-pill svg { color: #10B981; }

                /* Button */
                .bill-btn {
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 13px 18px; border-radius: 11px; border: none;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    transition: all 0.2s ease; margin-top: auto;
                }
                .bill-btn.bill-btn-buy { color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .bill-btn.bill-btn-buy:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
                .bill-btn.bill-btn-active { background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.3); cursor: default; }
                .bill-btn:disabled { opacity: 0.65; }

                /* Spinner */
                .btn-spin {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white; border-radius: 50%;
                    animation: bspin 0.7s linear infinite;
                }
                .billing-spinner {
                    width: 38px; height: 38px; margin: 0 auto;
                    border: 3px solid rgba(255,255,255,0.08);
                    border-top-color: #5f259f; border-radius: 50%;
                    animation: bspin 0.8s linear infinite;
                }
                @keyframes bspin { to { transform: rotate(360deg); } }

                /* PhonePe trust */
                .phonepe-trust {
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    font-size: 12px; color: var(--text-secondary);
                    padding: 16px; border-top: 1px solid var(--border); margin-top: 4px;
                }
                .phonepe-secured {
                    font-size: 11px; font-weight: 700;
                    background: rgba(95,37,159,0.1); color: #5f259f;
                    padding: 3px 10px; border-radius: 10px;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
                    z-index: 1000; padding: 20px;
                }
                .method-modal {
                    width: 100%; max-width: 440px; padding: 30px; border: 1px solid rgba(255,255,255,0.1);
                }
                .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .modal-head h3 { margin: 0; font-size: 18px; font-weight: 800; }
                .close-btn { background: none; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
                
                .method-grid { display: flex; flex-direction: column; gap: 12px; }
                .method-opt {
                    display: flex; align-items: center; gap: 16px; padding: 16px;
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
                    border-radius: 14px; text-align: left; cursor: pointer; transition: all 0.2s;
                    width: 100%; color: inherit;
                }
                .method-opt:hover { background: rgba(255,255,255,0.07); transform: translateX(5px); border-color: var(--primary); }
                .opt-icon {
                    width: 44px; height: 44px; border-radius: 12px; display: flex;
                    align-items: center; justify-content: center; font-size: 18px;
                }
                .phonepe-opt .opt-icon { background: #5f259f; }
                .opt-text { flex: 1; }
                .opt-text strong { display: block; font-size: 14px; }
                .opt-text span { font-size: 11px; color: var(--text-secondary); }

                @media (max-width: 640px) {
                    .bill-grid { grid-template-columns: 1fr; }
                    .bill-status { flex-direction: column; align-items: flex-start; }
                }
            `}</style>
        </div>
    );
}
