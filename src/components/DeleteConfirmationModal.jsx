import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    isLoading,
    error,
    title = "Confirm Deletion",
    isPermanent = false
}) => {
    const cancelBtnRef = useRef(null);
    const modalRef = useRef(null);
    const lastFocusedElement = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Save last focused element
            lastFocusedElement.current = document.activeElement;

            // Auto-focus Cancel button
            setTimeout(() => cancelBtnRef.current?.focus(), 10);

            // Disable background scroll
            document.body.style.overflow = 'hidden';

            // ESC key handler
            const handleEsc = (e) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);

            // Focus Trap
            const handleFocusTrap = (e) => {
                if (!modalRef.current) return;
                const focusableElements = modalRef.current.querySelectorAll('button:not([disabled])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };
            window.addEventListener('keydown', handleFocusTrap);

            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('keydown', handleEsc);
                window.removeEventListener('keydown', handleFocusTrap);
                // Restore focus
                lastFocusedElement.current?.focus();
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div
                ref={modalRef}
                className="modal scale-in"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '400px', textAlign: 'center', position: 'relative' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '16px', right: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                        className="hover-text-primary"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '10px auto 20px',
                    color: '#EF4444'
                }}>
                    <AlertTriangle size={32} />
                </div>

                <h3 id="modal-title" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{title}</h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                    Are you sure you want to delete <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{itemName}</span>?
                    {isPermanent
                        ? " This action cannot be undone and will permanently remove the record from the database."
                        : " This record will be moved to the Trash and can be restored later."}
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginBottom: '20px',
                        textAlign: 'left'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        ref={cancelBtnRef}
                        className="btn btn-outline"
                        onClick={onClose}
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                        style={{ flex: 1, justifyContent: 'center', background: '#EF4444', color: 'white' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
