import React from 'react';
import { Smartphone, Download, Share2, ShieldCheck, Globe, Bell } from 'lucide-react';
import { useAuthStore } from '../../app/authStore';

export default function MobileAppPage() {
    const { user } = useAuthStore();

    // Fallback if links are not set
    const androidUrl = user?.android_app_url || '#';
    const iosUrl = user?.ios_app_url || '#';

    return (
        <div style={{ padding: '20px' }}>
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                {/* Background Decor */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 300, height: 300, background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: 300, height: 300, background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

                <div style={{
                    width: 100, height: 100, borderRadius: 24,
                    background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 32px',
                    boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <Smartphone size={48} color="white" />
                </div>

                <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, marginBottom: 16, background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                    Connect Your School to the World
                </h1>

                <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 48, maxWidth: 650, marginInline: 'auto', lineHeight: 1.6 }}>
                    Enable parents and teachers to stay updated on the go. Get your white-labeled Android & iOS apps and transform how your school communicates.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 56, position: 'relative', zIndex: 1 }}>
                    {/* Android Card */}
                    <div className="glass-card hover-lift" style={{ padding: 40, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Globe size={30} color="#10B981" />
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Android Solution</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
                            {androidUrl === '#' ? '🛑 APK link not set in Settings!' : 'Available as a direct APK for all Android devices.'}
                        </p>
                        <a
                            href={androidUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn ${androidUrl === '#' ? 'btn-outline disabled' : 'btn-primary'}`}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: androidUrl === '#' ? 0.5 : 1, pointerEvents: androidUrl === '#' ? 'none' : 'auto' }}
                        >
                            <Download size={18} /> {androidUrl === '#' ? 'No Link Provided' : 'Download Android APK'}
                        </a>
                    </div>

                    {/* iOS Card */}
                    <div className="glass-card hover-lift" style={{ padding: 40, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Smartphone size={30} color="#3B82F6" />
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>iOS Solution</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
                            {iosUrl === '#' ? '🛑 App Store link not set in Settings!' : 'Secure and professional app experience for iOS devices.'}
                        </p>
                        <a
                            href={iosUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn ${iosUrl === '#' ? 'btn-outline disabled' : 'btn-primary'}`}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: iosUrl === '#' ? 0.5 : 1, pointerEvents: iosUrl === '#' ? 'none' : 'auto' }}
                        >
                            <Download size={18} /> {iosUrl === '#' ? 'No Link Provided' : 'Download for iOS'}
                        </a>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, padding: '40px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><ShieldCheck color="var(--primary)" size={24} /></div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>End-to-End Encryption</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All data transmissions are fully secured.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Bell size={24} color="var(--primary)" /></div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Instant Notifications</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Real-time alerts for attendance and fees.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Share2 size={24} color="var(--primary)" /></div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Easy Sharing</h4>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Invite staff and parents with a single link.</p>
                    </div>
                </div>

                {/* PWA Section */}
                <div style={{ marginTop: 40, padding: 32, background: 'rgba(255, 255, 255, 0.02)', borderRadius: 24, border: '1px dashed var(--border)' }}>
                    <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>No Space? Try Web App (PWA)</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Install the portal as an app on your home screen without downloading any files.</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Tap <Share2 size={14} style={{ display: 'inline', margin: '0 4px' }} /> Share &rarr; "Add to Home Screen"</p>
                </div>
            </div>

            <style>{`
                .hover-lift:hover {
                    transform: translateY(-8px);
                    border-color: var(--primary) !important;
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}
