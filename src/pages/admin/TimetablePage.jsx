import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi, academicsApi, teachersApi } from '../../services/api';
import { Calendar, Plus, Trash2, BookOpen, Users, Clock, Grid, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [
    { id: 'monday',    label: 'Monday'    },
    { id: 'tuesday',   label: 'Tuesday'   },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday',  label: 'Thursday'  },
    { id: 'friday',    label: 'Friday'    },
    { id: 'saturday',  label: 'Saturday'  },
];

export default function TimetablePage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab]         = useState('grid');
    const [selectedSection, setSelectedSection] = useState('');
    const [showModal, setShowModal]         = useState(false);
    const [editing, setEditing]             = useState({});
    const [editSlot, setEditSlot]           = useState(null);
    const [showAddSlot, setShowAddSlot]     = useState(false);
    const [newSlot, setNewSlot]             = useState({ period_number: '', start_time: '', end_time: '' });

    const { data: rawSlots = [] } = useQuery({ queryKey: ['tt-slots'], queryFn: timetableApi.getSlots });
    const slots = Array.isArray(rawSlots) ? rawSlots : (rawSlots?.results ?? []);

    const { data: rawSections = [] } = useQuery({ queryKey: ['sections'], queryFn: academicsApi.getSections });
    const sections = Array.isArray(rawSections) ? rawSections : (rawSections?.results ?? []);

    const { data: rawEntries = [] } = useQuery({
        queryKey: ['tt-entries', selectedSection],
        queryFn: () => timetableApi.getEntries({ section: selectedSection }),
        enabled: !!selectedSection,
    });
    const entries = Array.isArray(rawEntries) ? rawEntries : (rawEntries?.results ?? []);

    const { data: rawSubjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: academicsApi.getSubjects });
    const subjects = Array.isArray(rawSubjects) ? rawSubjects : (rawSubjects?.results ?? []);

    const { data: teachersData } = useQuery({ queryKey: ['teachers-list'], queryFn: () => teachersApi.list({ page_size: 100 }) });
    const teachers = teachersData?.results ?? [];

    const createMut = useMutation({
        mutationFn: timetableApi.createEntry,
        onSuccess: () => {
            qc.invalidateQueries(['tt-entries']);
            setShowModal(false);
            setEditing({});
            toast.success('Period assigned successfully!');
        },
        onError: (e) => {
            const msg = e.response?.data?.teacher || e.response?.data?.slot || e.response?.data?.non_field_errors?.[0] || 'Conflict detected';
            toast.error(msg);
        },
    });

    const deleteMut = useMutation({
        mutationFn: timetableApi.deleteEntry,
        onSuccess: () => { qc.invalidateQueries(['tt-entries']); toast.success('Entry removed'); },
    });

    const updateSlotMut = useMutation({
        mutationFn: ({ id, data }) => timetableApi.updateSlot(id, data),
        onSuccess: () => {
            qc.invalidateQueries(['tt-slots']);
            setEditSlot(null);
            toast.success('Period timing updated!');
        },
        onError: () => toast.error('Failed to update slot'),
    });

    const createSlotMut = useMutation({
        mutationFn: (data) => timetableApi.createSlot(data),
        onSuccess: () => {
            qc.invalidateQueries(['tt-slots']);
            setShowAddSlot(false);
            setNewSlot({ period_number: '', start_time: '', end_time: '' });
            toast.success('Period added!');
        },
        onError: () => toast.error('Failed to add period'),
    });

    const getEntry = (day, slotId) => entries.find(e => e.day === day && e.slot === slotId);

    const openAssign = (day, slotId) => {
        setEditing({ day, slot: slotId, subject: '', teacher: '' });
        setShowModal(true);
    };

    const tabs = [
        { id: 'grid',   label: 'Timetable Grid', icon: Grid  },
        { id: 'slots',  label: 'Period Slots',    icon: Clock },
    ];

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>

            {/* ── Page Header ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={24} color="var(--primary)" />
                        Timetable Management
                    </h1>
                    <p className="page-subtitle">Assign teachers and subjects to class periods for each day of the week</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 18px', borderRadius: 10, border: 'none',
                            cursor: 'pointer', fontSize: 14, fontWeight: 600,
                            background: activeTab === id ? 'var(--primary)' : 'var(--overlay)',
                            color: activeTab === id ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Icon size={15} />{label}
                    </button>
                ))}
            </div>

            {/* ── Grid Tab ── */}
            {activeTab === 'grid' && (
                <>
                    {/* Section selector */}
                    <div className="glass-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px' }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            View Timetable for:
                        </label>
                        <select
                            className="form-input"
                            style={{ maxWidth: 320 }}
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                        >
                            <option value="">Select a class / section</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>
                                    Class {s.grade_name} — Section {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedSection ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
                            <Calendar size={52} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <p style={{ fontSize: 17, fontWeight: 600 }}>Select a section to view its timetable</p>
                            <p style={{ fontSize: 13, marginTop: 6 }}>Choose a class and section from the dropdown above to get started.</p>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                            <Clock size={40} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
                            <p style={{ fontSize: 15, fontWeight: 600 }}>No period slots configured</p>
                            <p style={{ fontSize: 13, marginTop: 6 }}>Switch to the "Period Slots" tab to add period timings.</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 700 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 120 }}>Day</th>
                                        {slots.map(slot => (
                                            <th key={slot.id} style={{ textAlign: 'center', minWidth: 160 }}>
                                                <div>Period {slot.period_number}</div>
                                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--primary)', marginTop: 2 }}>
                                                    {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map(day => (
                                        <tr key={day.id}>
                                            <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {day.label}
                                            </td>
                                            {slots.map(slot => {
                                                const entry = getEntry(day.id, slot.id);
                                                return (
                                                    <td key={slot.id} style={{ padding: 10 }}>
                                                        {entry ? (
                                                            <div style={{
                                                                background: 'rgba(79,70,229,0.1)',
                                                                border: '1px solid rgba(79,70,229,0.25)',
                                                                borderRadius: 10,
                                                                padding: '10px 12px',
                                                                position: 'relative',
                                                            }}>
                                                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)', paddingRight: 24 }}>
                                                                    {entry.subject_name}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <Users size={10} /> {entry.teacher_name}
                                                                </div>
                                                                <button
                                                                    onClick={() => deleteMut.mutate(entry.id)}
                                                                    style={{
                                                                        position: 'absolute', top: 8, right: 8,
                                                                        background: 'none', border: 'none',
                                                                        color: '#EF4444', cursor: 'pointer',
                                                                        padding: 2, opacity: 0.6,
                                                                        lineHeight: 1,
                                                                    }}
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => openAssign(day.id, slot.id)}
                                                                style={{
                                                                    width: '100%', minHeight: 56,
                                                                    background: 'none',
                                                                    border: '1px dashed var(--border)',
                                                                    borderRadius: 10,
                                                                    color: 'var(--text-secondary)',
                                                                    cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 13, gap: 6,
                                                                    transition: 'all 0.2s',
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'rgba(79,70,229,0.06)'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}
                                                            >
                                                                <Plus size={14} /> Assign
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── Period Slots Tab ── */}
            {activeTab === 'slots' && (
                <>
                    {/* Header row with Add button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: 15 }}>Period Slots</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Configure start & end times for each period of the school day.</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setNewSlot({ period_number: slots.length + 1, start_time: '', end_time: '' });
                                setShowAddSlot(true);
                            }}
                        >
                            <Plus size={15} /> Add Period
                        </button>
                    </div>

                    <div className="glass-card" style={{ overflowX: 'auto' }}>
                    {slots.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                            <Clock size={40} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
                            <p style={{ fontWeight: 600 }}>No period slots found</p>
                            <p style={{ fontSize: 13, marginTop: 6 }}>Default slots are seeded automatically when your school is set up.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Period No.</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Duration</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map(slot => {
                                    const [sh, sm] = slot.start_time.split(':').map(Number);
                                    const [eh, em] = slot.end_time.split(':').map(Number);
                                    const duration = (eh * 60 + em) - (sh * 60 + sm);
                                    return (
                                        <tr key={slot.id}>
                                            <td style={{ fontWeight: 700 }}>Period {slot.period_number}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{slot.start_time?.slice(0, 5)}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{slot.end_time?.slice(0, 5)}</td>
                                            <td><span className="badge badge-info">{duration} min</span></td>
                                            <td>
                                                <button
                                                    onClick={() => setEditSlot({ ...slot })}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <Edit2 size={15} /> Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                </>
            )}

            {/* ── Add Period Modal ── */}
            {showAddSlot && (
                <div className="modal-overlay" onClick={() => setShowAddSlot(false)}>
                    <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Plus size={20} color="var(--primary)" />
                            Add New Period
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Define a new period slot for your school day.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label className="form-label">Period Number *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 6"
                                min={1}
                                value={newSlot.period_number}
                                onChange={e => setNewSlot({ ...newSlot, period_number: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label className="form-label">Start Time *</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={newSlot.start_time}
                                    onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">End Time *</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={newSlot.end_time}
                                    onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setShowAddSlot(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={!newSlot.period_number || !newSlot.start_time || !newSlot.end_time || createSlotMut.isPending}
                                onClick={() => createSlotMut.mutate({
                                    period_number: Number(newSlot.period_number),
                                    start_time: newSlot.start_time,
                                    end_time: newSlot.end_time,
                                })}
                            >
                                <Plus size={15} />
                                {createSlotMut.isPending ? 'Adding…' : 'Add Period'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setEditing({}); }}>
                    <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <BookOpen size={20} color="var(--primary)" />
                            Assign Period Slot
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Choose a subject and teacher for this time slot. Conflicts are automatically detected.
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label className="form-label">Subject *</label>
                            <select
                                className="form-input"
                                value={editing.subject || ''}
                                onChange={e => setEditing({ ...editing, subject: e.target.value })}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label className="form-label">Teacher *</label>
                            <select
                                className="form-input"
                                value={editing.teacher || ''}
                                onChange={e => setEditing({ ...editing, teacher: e.target.value })}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditing({}); }}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={!editing.subject || !editing.teacher || createMut.isPending}
                                onClick={() => createMut.mutate({ ...editing, section: selectedSection })}
                            >
                                <Plus size={15} />
                                {createMut.isPending ? 'Saving…' : 'Assign Slot'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Slot Modal ── */}
            {editSlot && (
                <div className="modal-overlay" onClick={() => setEditSlot(null)}>
                    <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Clock size={20} color="var(--primary)" />
                            Edit Period {editSlot.period_number} Timing
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Adjust the start and end time for this period. Changes apply to all classes.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label className="form-label">Start Time *</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={editSlot.start_time?.slice(0, 5)}
                                    onChange={e => setEditSlot({ ...editSlot, start_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">End Time *</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={editSlot.end_time?.slice(0, 5)}
                                    onChange={e => setEditSlot({ ...editSlot, end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setEditSlot(null)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={updateSlotMut.isPending}
                                onClick={() => updateSlotMut.mutate({
                                    id: editSlot.id,
                                    data: { start_time: editSlot.start_time, end_time: editSlot.end_time, period_number: editSlot.period_number }
                                })}
                            >
                                {updateSlotMut.isPending ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
