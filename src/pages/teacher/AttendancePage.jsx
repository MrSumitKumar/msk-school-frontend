import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, academicsApi, studentsApi, authApi } from '../../services/api';
import { ClipboardCheck, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendancePage() {
    const qc = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [attendance, setAttendance] = useState({}); // {user_id: status}

    // Fetch current user to check if teacher is a class teacher
    const { data: meData, isLoading: meLoading } = useQuery({
        queryKey: ['me'],
        queryFn: () => authApi.me(),
    });

    const teacherProfile = meData?.teacher_profile;
    const isClassTeacher = teacherProfile?.is_class_teacher;
    const classTeacherGradeId = teacherProfile?.class_teacher_grade_id;
    const classTeacherSectionId = teacherProfile?.class_teacher_section_id;

    // Fetch active academic session
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => academicsApi.sessions(),
    });
    const activeSession = (sessionsData?.results || sessionsData || []).find(s => s.is_active);

    // Auto-select grade and section for class teacher
    useEffect(() => {
        if (isClassTeacher && classTeacherGradeId && classTeacherSectionId) {
            setSelectedClass(String(classTeacherGradeId));
            setSelectedSection(String(classTeacherSectionId));
        }
    }, [isClassTeacher, classTeacherGradeId, classTeacherSectionId]);

    const { data: gradesData } = useQuery({
        queryKey: ['grades'],
        queryFn: () => academicsApi.getGrades(),
    });

    const { data: sections } = useQuery({
        queryKey: ['sections', selectedClass],
        queryFn: () => academicsApi.getSections(selectedClass),
        enabled: !!selectedClass,
    });

    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['students', selectedClass, selectedSection],
        queryFn: () => studentsApi.list({ grade: selectedClass, section: selectedSection }),
        enabled: !!selectedClass && !!selectedSection,
    });

    // Fetch existing attendance records for the selected section and date
    const { data: existingAttendanceData, isLoading: attendanceLoading } = useQuery({
        queryKey: ['attendance', selectedSection, date],
        queryFn: () => attendanceApi.list({ section: selectedSection, date }),
        enabled: !!selectedSection && !!date,
    });

    // Populate attendance state with existing records
    useEffect(() => {
        const attendanceRecords = existingAttendanceData?.results || existingAttendanceData || [];
        if (attendanceRecords && attendanceRecords.length > 0) {
            const attendanceMap = {};
            attendanceRecords.forEach(record => {
                attendanceMap[record.student] = record.status;
            });
            setAttendance(attendanceMap);
        } else {
            // Reset to empty if no existing records
            setAttendance({});
        }
    }, [existingAttendanceData]);

    const gradeList = gradesData?.results || gradesData || [];
    const sectionList = sections?.results || sections || [];
    const studentList = studentsData?.results || studentsData || [];
    const existingAttendance = existingAttendanceData?.results || existingAttendanceData || [];

    const submitMutation = useMutation({
        mutationFn: attendanceApi.markBulk,
        onSuccess: () => {
            qc.invalidateQueries(['attendance']);
            toast.success('Attendance recorded successfully');
        },
        onError: (err) => {
            const msg = err?.response?.data?.error || err?.message || 'Failed to save attendance';
            toast.error(msg);
        }
    });

    const handleSave = () => {
        if (!selectedClass || !selectedSection) return;
        if (!activeSession) {
            toast.error('No active academic session found. Please contact admin.');
            return;
        }
        const records = Object.entries(attendance).map(([id, status]) => ({ student: Number(id), status }));
        if (records.length === 0) {
            toast.error('Please mark attendance for at least one student.');
            return;
        }
        submitMutation.mutate({
            section: Number(selectedSection),
            academic_session: activeSession.id,
            date,
            records,
        });
    };

    // Show loading while fetching user data
    if (meLoading) {
        return (
            <div className="glass-card" style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ClipboardCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Loading...</p>
            </div>
        );
    }

    // If teacher is NOT a class teacher, show restriction message
    if (!isClassTeacher) {
        return (
            <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Daily Attendance</h1>
                        <p className="page-subtitle">Mark and manage student attendance</p>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <AlertTriangle size={56} style={{ margin: '0 auto 20px', opacity: 0.5, color: '#f59e0b' }} />
                    <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Access Restricted</h3>
                    <p>Only class teachers can mark attendance. You are not assigned as a class teacher to any section.</p>
                    <p style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>Please contact your school administrator if you believe this is an error.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Daily Attendance</h1>
                    <p className="page-subtitle">Mark attendance for your assigned class: {teacherProfile?.class_teacher_section}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                        <label className="form-label">Class</label>
                        <select className="form-input" value={selectedClass} disabled>
                            <option value="">Select Class</option>
                            {gradeList.map(g => <option key={g.id} value={g.id}>Class {g.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                        <label className="form-label">Section</label>
                        <select className="form-input" value={selectedSection} disabled>
                            <option value="">Select Section</option>
                            {sectionList.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!selectedClass || !selectedSection || submitMutation.isPending}>
                        <Save size={16} /> {submitMutation.isPending ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {!selectedClass || !selectedSection ? (
                <div className="glass-card" style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <ClipboardCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>Loading your assigned class...</p>
                </div>
            ) : isLoading ? (
                <div className="glass-card" style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <ClipboardCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>Loading students...</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                    {attendanceLoading && (
                        <div style={{ padding: '16px 20px', backgroundColor: 'var(--warning-light)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--warning)' }}>
                            <p style={{ margin: 0, color: 'var(--warning-dark)', fontWeight: 600 }}>
                                ⏳ Loading attendance data...
                            </p>
                        </div>
                    )}
                    {existingAttendance.length > 0 && !attendanceLoading && (
                        <div style={{ padding: '16px 20px', backgroundColor: 'var(--success-light)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--success)' }}>
                            <p style={{ margin: 0, color: 'var(--success-dark)', fontWeight: 600 }}>
                                ✓ Attendance already marked for {new Date(date).toLocaleDateString()}. You can update it below.
                            </p>
                        </div>
                    )}
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Roll No</th>
                                <th style={{ textAlign: 'center' }}>Present</th>
                                <th style={{ textAlign: 'center' }}>Absent</th>
                                <th style={{ textAlign: 'center' }}>Late</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentList.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.user?.full_name}</td>
                                    <td>{s.roll_number || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="radio" name={`att-${s.user?.id}`} checked={attendance[s.user?.id] === 'present'} onChange={() => setAttendance({ ...attendance, [s.user?.id]: 'present' })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="radio" name={`att-${s.user?.id}`} checked={attendance[s.user?.id] === 'absent'} onChange={() => setAttendance({ ...attendance, [s.user?.id]: 'absent' })} />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="radio" name={`att-${s.user?.id}`} checked={attendance[s.user?.id] === 'late'} onChange={() => setAttendance({ ...attendance, [s.user?.id]: 'late' })} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

