import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { ShieldAlert, Lock, ArrowUpCircle } from 'lucide-react';

const ModuleGuard = ({ moduleName, children, redirect = false }) => {
    const { isModuleUnlocked, isLoading } = useSubscription();
    const location = useLocation();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <div className="billing-spinner" />
            </div>
        );
    }

    const isUnlocked = isModuleUnlocked(moduleName);

    if (!isUnlocked) {
        if (redirect) {
            return <Navigate to="/admin/billing" state={{ from: location, lockedModule: moduleName }} replace />;
        }

        return (
            <div className="module-locked-container fade-in">
                <div className="locked-card">
                    <div className="locked-icon-stack">
                        <div className="icon-bg-glow" />
                        <Lock className="lock-icon" size={48} />
                        <ShieldAlert className="alert-icon" size={24} />
                    </div>

                    <h2>Feature Locked</h2>
                    <p>The <strong>{moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</strong> module is not available in your current plan.</p>

                    <div className="benefits-preview">
                        <div className="benefit-item">
                            <span className="dot" />
                            <span>Advanced analytics and reporting</span>
                        </div>
                        <div className="benefit-item">
                            <span className="dot" />
                            <span>Full data management & exports</span>
                        </div>
                    </div>

                    <button
                        className="upgrade-btn"
                        onClick={() => navigate('/admin/billing')}
                    >
                        <ArrowUpCircle size={18} />
                        Upgrade Plan
                    </button>
                </div>

                <style>{`
                    .module-locked-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 70vh;
                        padding: 20px;
                        background: radial-gradient(circle at center, rgba(245,158,11,0.03) 0%, transparent 70%);
                    }
                    .locked-card {
                        background: rgba(30, 41, 59, 0.7);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 28px;
                        padding: 48px 40px;
                        max-width: 480px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        position: relative;
                        overflow: hidden;
                        transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                    }
                    .locked-card:hover {
                        transform: translateY(-12px) scale(1.02);
                        border-color: rgba(245, 158, 11, 0.4);
                        box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.1);
                    }
                    .locked-card::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(135deg, transparent 0%, rgba(245, 158, 11, 0.05) 100%);
                        opacity: 0;
                        transition: opacity 0.5s ease;
                    }
                    .locked-card:hover::after {
                        opacity: 1;
                    }
                    .locked-card::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0; height: 5px;
                        background: linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B);
                        background-size: 200% 100%;
                        animation: gradientMove 3s linear infinite;
                    }
                    @keyframes gradientMove {
                        0% { background-position: 100% 0%; }
                        100% { background-position: -100% 0%; }
                    }
                    .locked-icon-stack {
                        position: relative;
                        width: 90px;
                        height: 90px;
                        margin: 0 auto 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .icon-bg-glow {
                        position: absolute;
                        inset: -10px;
                        background: radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%);
                        animation: pulse 3s ease-in-out infinite;
                    }
                    .lock-icon { 
                        color: #fbbf24; 
                        z-index: 1; 
                        filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
                    }
                    .alert-icon { 
                        position: absolute;
                        bottom: 12px;
                        right: 12px;
                        color: #ef4444;
                        z-index: 2;
                        background: #1e293b;
                        border-radius: 50%;
                        padding: 2px;
                        box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
                    }
                    
                    h2 { 
                        font-size: 28px; 
                        font-weight: 800; 
                        margin-bottom: 16px; 
                        background: linear-gradient(to bottom, #ffffff, #94a3b8);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        letter-spacing: -0.02em;
                    }
                    p { 
                        color: #94a3b8; 
                        margin-bottom: 32px; 
                        line-height: 1.6; 
                        font-size: 15px;
                    }
                    
                    .benefits-preview {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 16px;
                        padding: 24px;
                        margin-bottom: 32px;
                        text-align: left;
                        transition: all 0.3s ease;
                    }
                    .locked-card:hover .benefits-preview {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(245, 158, 11, 0.1);
                    }
                    .benefit-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 14px;
                        font-size: 14px;
                        color: #cbd5e1;
                    }
                    .benefit-item:last-child { margin-bottom: 0; }
                    .dot {
                        width: 8px; height: 8px;
                        background: #F59E0B;
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
                    }
                    
                    .upgrade-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        width: 100%;
                        padding: 16px;
                        background: linear-gradient(135deg, #F59E0B, #D97706);
                        color: white;
                        border: none;
                        border-radius: 16px;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.4);
                        position: relative;
                        z-index: 1;
                    }
                    .upgrade-btn:hover {
                        transform: scale(1.03);
                        box-shadow: 0 20px 30px -10px rgba(245, 158, 11, 0.5);
                        filter: brightness(1.1);
                    }
                    .upgrade-btn:active {
                        transform: scale(0.98);
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(0.9); opacity: 0.3; }
                        50% { transform: scale(1.2); opacity: 0.6; }
                        100% { transform: scale(0.9); opacity: 0.3; }
                    }
                `}</style>
            </div>
        );
    }

    return children;
};

export default ModuleGuard;
