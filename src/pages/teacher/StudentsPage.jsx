import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsApi, academicsApi, authApi } from '../../services/api';
import { Search, Filter, User, Mail, Phone, MapPin } from 'lucide-react';

export default function StudentsPage() {
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    // Fetch current user to check teacher assignments
    const { data: meData } = useQuery({
        queryKey: ['me'],
        queryFn: () => authApi.me(),
    });

    const teacherProfile = meData?.teacher_profile;
    const isClassTeacher = teacherProfile?.is_class_teacher;
    const classTeacherGradeId = teacherProfile?.class_teacher_grade_id;

    // Fetch all students the teacher has access to
    const { data: allStudentsData, isLoading: allLoading } = useQuery({
        queryKey: ['students-all'],
        queryFn: () => studentsApi.list({}),
    });

    // Fetch students for selected class
    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['students', selectedClass],
        queryFn: () => studentsApi.list({ grade: selectedClass }),
        enabled: !!selectedClass,
    });

    const allStudents = allStudentsData?.results || allStudentsData || [];
    const students = studentsData?.results || studentsData || [];

    // Extract unique grades from all accessible students
    const assignedGrades = Array.from(
        new Set(allStudents.map(s => s.grade).filter(Boolean))
    ).map(gradeId => {
        const student = allStudents.find(s => s.grade === gradeId);
        return {
            id: gradeId,
            name: student?.grade_name || `Grade ${gradeId}`
        };
    });

    // Auto-select class for class teacher
    useEffect(() => {
        if (isClassTeacher && classTeacherGradeId && assignedGrades.length > 0) {
            setSelectedClass(String(classTeacherGradeId));
        } else if (assignedGrades.length === 1) {
            // If teacher only has one assigned class, auto-select it
            setSelectedClass(String(assignedGrades[0].id));
        }
    }, [isClassTeacher, classTeacherGradeId, assignedGrades]);

    const filtered = students.filter(s =>
        `${s.user?.first_name} ${s.user?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Students</h1>
                    <p className="page-subtitle">View and manage students in your assigned classes</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 280 }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input placeholder="Search students by name or admission no..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-input" style={{ width: 180 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    <option value="">Select Class</option>
                    {assignedGrades.map(g => <option key={g.id} value={g.id}>Class {g.name.replace('Grade ', '')}</option>)}
                </select>
            </div>

            <div className="glass-card" style={{ overflowX: 'auto' }}>
                {allLoading || isLoading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading students...</div>
                ) : !selectedClass ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                        <User size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>Please select a class to view students</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Admission No</th>
                                <th>Class</th>
                                <th>Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="bg-gradient-primary" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                                                {s.user?.first_name?.[0]}{s.user?.last_name?.[0]}
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{s.user?.first_name} {s.user?.last_name}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{s.admission_number}</td>
                                    <td>Class {s.grade_name || '—'}</td>
                                    <td>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.user?.email}</div>
                                        <div style={{ fontSize: 11, opacity: 0.7 }}>{s.user?.phone || 'No phone'}</div>
                                    </td>
                                    <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
