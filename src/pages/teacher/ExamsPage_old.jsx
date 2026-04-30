import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsApi, studentsApi, examsApi } from '../../services/api';
import { ClipboardList, CheckCircle, AlertCircle, Save, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamsPage() {
    const qc = useQueryClient();
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [marks, setMarks] = useState({}); // {student_id: marks}

    const { data: examsData } = useQuery({ queryKey: ['exams'], queryFn: () => examsApi.list() });
    const { data: gradesData } = useQuery({ queryKey: ['grades'], queryFn: () => academicsApi.getGrades() });

    const { data: students } = useQuery({ queryKey: ['students', selectedClass], queryFn: () => studentsApi.list({ grade: selectedClass }), enabled: !!selectedClass });
    const { data: results } = useQuery({ queryKey: ['results', selectedExam, selectedClass], queryFn: () => examsApi.results({ exam: selectedExam, grade: selectedClass }), enabled: !!selectedExam && !!selectedClass });

    const exams = examsData?.results || examsData || [];
    const gradeList = gradesData?.results || gradesData || [];
    const studentList = students?.results || students || [];

    const updateMarksMutation = useMutation({
        mutationFn: examsApi.updateResults,
        onSuccess: () => {
            qc.invalidateQueries(['results']);
            toast.success('Marks updated successfully');
        }
    });

    const handleSave = () => {
        if (!selectedExam || !selectedClass) return;
        updateMarksMutation.mutate({ exam: selectedExam, grade: selectedClass, marks });
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Exam Marks Entry</h1>
                    <p className="page-subtitle">Record and update student performance for scheduled examinations</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <select className="form-input" style={{ flex: 1, minWidth: 200 }} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
                        <option value="">Select Examination</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <select className="form-input" style={{ flex: 1, minWidth: 160 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {gradeList.map(g => <option key={g.id} value={g.id}>Class {g.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!selectedExam || !selectedClass}><Save size={16} /> Save All Marks</button>
                </div>
            </div>

            {!selectedExam || !selectedClass ? (
                <div className="glass-card" style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>Please select an examination and a class to start entering marks.</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Roll No</th>
                                <th>Marks Obtained</th>
                                <th>Max Marks</th>
                                <th>Grade/Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentList.map(s => {
                                const res = results?.find(r => r.student === s.id);
                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.user?.full_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.roll_number || '—'}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: 80, padding: '4px 8px' }}
                                                defaultValue={res?.marks_obtained || ''}
                                                onChange={e => setMarks({ ...marks, [s.id]: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>100</td>
                                        <td>{res?.grade || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
