import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsApi, studentsApi, examsApi, authApi } from '../../services/api';
import {
    ClipboardList, CheckCircle, AlertCircle, Save, Search, User,
    Plus, Edit, Trash2, FileText, Download, BookOpen, Target,
    Type, CheckSquare, AlignLeft, Hash, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

export default function ExamsPage() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState('results'); // results, questions, papers
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [marks, setMarks] = useState({}); // {student_id: marks}

    // Question Bank state
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        options: [''],
        correct_answer: '',
        marks: 1,
        difficulty_level: 'medium',
        subject: '',
        grade: ''
    });

    // Exam Paper state
    const [showPaperModal, setShowPaperModal] = useState(false);
    const [editingPaper, setEditingPaper] = useState(null);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [paperForm, setPaperForm] = useState({
        exam: '',
        subject: '',
        grade: '',
        title: '',
        instructions: '',
        total_marks: 100,
        duration_minutes: 60
    });

    // Fetch current user
    const { data: meData } = useQuery({
        queryKey: ['me'],
        queryFn: () => authApi.me(),
    });

    const teacherProfile = meData?.teacher_profile;
    const isClassTeacher = teacherProfile?.is_class_teacher;
    const classTeacherGradeId = teacherProfile?.class_teacher_grade_id;

    // Fetch data based on active tab
    const { data: examsData } = useQuery({
        queryKey: ['exams'],
        queryFn: () => examsApi.list()
    });

    const { data: gradesData } = useQuery({
        queryKey: ['grades'],
        queryFn: () => academicsApi.getGrades()
    });

    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => academicsApi.getSubjects()
    });

    const { data: students } = useQuery({
        queryKey: ['students', selectedClass],
        queryFn: () => studentsApi.list({ grade: selectedClass }),
        enabled: !!selectedClass,
    });

    const { data: results } = useQuery({
        queryKey: ['results', selectedExam, selectedClass],
        queryFn: () => examsApi.results({ exam: selectedExam, grade: selectedClass }),
        enabled: !!selectedExam && !!selectedClass,
    });

    // Question Bank queries
    const { data: questionsData, isLoading: questionsLoading } = useQuery({
        queryKey: ['questions', activeTab === 'questions' ? {} : null],
        queryFn: () => examsApi.questions.list({}),
        enabled: activeTab === 'questions'
    });

    // Exam Papers queries
    const { data: papersData, isLoading: papersLoading } = useQuery({
        queryKey: ['exam-papers', activeTab === 'papers' ? {} : null],
        queryFn: () => examsApi.papers.list({}),
        enabled: activeTab === 'papers'
    });

    const exams = examsData?.results || examsData || [];
    const gradeList = gradesData?.results || gradesData || [];
    const subjectList = subjectsData?.results || subjectsData || [];
    const studentList = students?.results || students || [];
    const questions = questionsData?.results || questionsData || [];
    const papers = papersData?.results || papersData || [];

    // Mutations
    const updateMarksMutation = useMutation({
        mutationFn: examsApi.updateResults,
        onSuccess: () => {
            qc.invalidateQueries(['results']);
            toast.success('Marks updated successfully');
        }
    });

    const createQuestionMutation = useMutation({
        mutationFn: examsApi.questions.create,
        onSuccess: () => {
            qc.invalidateQueries(['questions']);
            setShowQuestionModal(false);
            resetQuestionForm();
            toast.success('Question created successfully');
        }
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ id, data }) => examsApi.questions.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries(['questions']);
            setShowQuestionModal(false);
            setEditingQuestion(null);
            resetQuestionForm();
            toast.success('Question updated successfully');
        }
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: examsApi.questions.delete,
        onSuccess: () => {
            qc.invalidateQueries(['questions']);
            toast.success('Question deleted successfully');
        }
    });

    const createPaperMutation = useMutation({
        mutationFn: examsApi.papers.create,
        onSuccess: () => {
            qc.invalidateQueries(['exam-papers']);
            setShowPaperModal(false);
            resetPaperForm();
            toast.success('Exam paper created successfully');
        }
    });

    const updatePaperMutation = useMutation({
        mutationFn: ({ id, data }) => examsApi.papers.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries(['exam-papers']);
            setShowPaperModal(false);
            setEditingPaper(null);
            resetPaperForm();
            toast.success('Exam paper updated successfully');
        }
    });

    const deletePaperMutation = useMutation({
        mutationFn: examsApi.papers.delete,
        onSuccess: () => {
            qc.invalidateQueries(['exam-papers']);
            toast.success('Exam paper deleted successfully');
        }
    });

    // Helper functions
    const resetQuestionForm = () => {
        setQuestionForm({
            question_text: '',
            question_type: 'multiple_choice',
            options: [''],
            correct_answer: '',
            marks: 1,
            difficulty_level: 'medium',
            subject: '',
            grade: ''
        });
    };

    const resetPaperForm = () => {
        setPaperForm({
            exam: '',
            subject: '',
            grade: '',
            title: '',
            instructions: '',
            total_marks: 100,
            duration_minutes: 60
        });
    };

    const handleSave = () => {
        if (!selectedExam || !selectedClass) return;
        updateMarksMutation.mutate({ exam: selectedExam, grade: selectedClass, marks });
    };

    const handleQuestionSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...questionForm,
            options: questionForm.question_type === 'multiple_choice' ? JSON.stringify(questionForm.options) : null,
            school: meData?.school,
            created_by: meData?.id
        };

        if (editingQuestion) {
            updateQuestionMutation.mutate({ id: editingQuestion.id, data });
        } else {
            createQuestionMutation.mutate(data);
        }
    };

    const handlePaperSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...paperForm,
            created_by: meData?.id
        };

        if (editingPaper) {
            updatePaperMutation.mutate({ id: editingPaper.id, data });
        } else {
            createPaperMutation.mutate(data);
        }
    };

    const addQuestionOption = () => {
        setQuestionForm(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const updateQuestionOption = (index, value) => {
        setQuestionForm(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => i === index ? value : opt)
        }));
    };

    const removeQuestionOption = (index) => {
        setQuestionForm(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const getQuestionTypeIcon = (type) => {
        switch (type) {
            case 'multiple_choice': return <CheckSquare size={16} />;
            case 'true_false': return <CheckCircle size={16} />;
            case 'short_answer': return <Type size={16} />;
            case 'long_answer': return <AlignLeft size={16} />;
            case 'fill_blank': return <Hash size={16} />;
            default: return <Target size={16} />;
        }
    };

    const exportPaperToPDF = async (paper) => {
        try {
            toast.loading('Generating PDF...', { id: 'pdf-export' });

            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 20;

            // School Header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('School Name', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('School Address, City, State - PIN', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;

            pdf.text('Phone: +91-XXXXXXXXXX | Email: info@school.com', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Exam Details
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(paper.title, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Subject: ${paper.subject_name} | Class: ${paper.grade_name} | Total Marks: ${paper.total_marks}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;
            pdf.text(`Duration: ${paper.duration_minutes} minutes | Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Instructions
            if (paper.instructions) {
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Instructions:', 20, yPosition);
                yPosition += 10;

                pdf.setFont('helvetica', 'normal');
                const instructions = pdf.splitTextToSize(paper.instructions, pageWidth - 40);
                pdf.text(instructions, 20, yPosition);
                yPosition += instructions.length * 5 + 10;
            }

            // Questions section
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Questions:', 20, yPosition);
            yPosition += 15;

            // For now, we'll add a placeholder since we don't have the actual questions
            // In a real implementation, you'd fetch the questions for this paper
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Questions will be loaded from the question bank...', 20, yPosition);
            yPosition += 20;

            // Footer
            const footerY = pageHeight - 20;
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text('This is a computer-generated document. Please verify all details.', pageWidth / 2, footerY, { align: 'center' });

            // Save the PDF
            const fileName = `${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            pdf.save(fileName);

            toast.success('PDF exported successfully!', { id: 'pdf-export' });
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export PDF', { id: 'pdf-export' });
        }
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Exam Management</h1>
                    <p className="page-subtitle">Create questions, build exam papers, and manage results</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="glass-card" style={{ padding: '0 20px', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    {[
                        { id: 'results', label: 'Results Entry', icon: ClipboardList },
                        { id: 'questions', label: 'Question Bank', icon: BookOpen },
                        { id: 'papers', label: 'Exam Papers', icon: FileText },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`tab-button ${activeTab === id ? 'active' : ''}`}
                            style={{
                                padding: '16px 24px',
                                border: 'none',
                                background: activeTab === id ? 'var(--primary)' : 'transparent',
                                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                                borderRadius: 0,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontWeight: 600
                            }}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Entry Tab */}
            {activeTab === 'results' && (
                <>
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
                            <button className="btn btn-primary" onClick={handleSave} disabled={!selectedExam || !selectedClass || updateMarksMutation.isPending}>
                                <Save size={16} /> {updateMarksMutation.isPending ? 'Saving...' : 'Save Marks'}
                            </button>
                        </div>
                    </div>

                    {!selectedExam || !selectedClass ? (
                        <div className="glass-card" style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <p>Please select an examination and class to enter marks</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Admission No</th>
                                        <th>Marks Obtained</th>
                                        <th>Max Marks</th>
                                        <th>Grade</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.user?.full_name}</td>
                                            <td>{s.admission_number}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ width: 80 }}
                                                    value={marks[s.user?.id] || ''}
                                                    onChange={e => setMarks({ ...marks, [s.user?.id]: e.target.value })}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td>100</td>
                                            <td>A</td>
                                            <td><span className="badge badge-success">Present</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Question Bank Tab */}
            {activeTab === 'questions' && (
                <>
                    <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Question Bank</h3>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    Create and manage questions for your exams
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowQuestionModal(true)}>
                                <Plus size={16} /> Add Question
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ overflowX: 'auto' }}>
                        {questionsLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                                Loading questions...
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Question</th>
                                        <th>Subject</th>
                                        <th>Class</th>
                                        <th>Marks</th>
                                        <th>Difficulty</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map(q => (
                                        <tr key={q.id}>
                                            <td>{getQuestionTypeIcon(q.question_type)} {q.question_type.replace('_', ' ')}</td>
                                            <td style={{ maxWidth: 300 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {q.question_text}
                                                </div>
                                            </td>
                                            <td>{q.subject_name}</td>
                                            <td>Class {q.grade_name}</td>
                                            <td>{q.marks}</td>
                                            <td>
                                                <span className={`badge ${
                                                    q.difficulty_level === 'easy' ? 'badge-success' :
                                                    q.difficulty_level === 'medium' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                    {q.difficulty_level}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => {
                                                            setEditingQuestion(q);
                                                            setQuestionForm({
                                                                question_text: q.question_text,
                                                                question_type: q.question_type,
                                                                options: q.options ? JSON.parse(q.options) : [''],
                                                                correct_answer: q.correct_answer,
                                                                marks: q.marks,
                                                                difficulty_level: q.difficulty_level,
                                                                subject: q.subject,
                                                                grade: q.grade
                                                            });
                                                            setShowQuestionModal(true);
                                                        }}
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => {
                                                            if (confirm('Delete this question?')) {
                                                                deleteQuestionMutation.mutate(q.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Exam Papers Tab */}
            {activeTab === 'papers' && (
                <>
                    <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Exam Papers</h3>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    Build and manage exam papers from your question bank
                                </p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowPaperModal(true)}>
                                <Plus size={16} /> Create Paper
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ overflowX: 'auto' }}>
                        {papersLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                                Loading exam papers...
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Exam</th>
                                        <th>Subject</th>
                                        <th>Title</th>
                                        <th>Class</th>
                                        <th>Total Marks</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {papers.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.exam_name}</td>
                                            <td>{p.subject_name}</td>
                                            <td>{p.title}</td>
                                            <td>Class {p.grade_name}</td>
                                            <td>{p.total_marks}</td>
                                            <td>{p.duration_minutes} min</td>
                                            <td>
                                                <span className={`badge ${p.is_published ? 'badge-success' : 'badge-warning'}`}>
                                                    {p.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => {
                                                            setEditingPaper(p);
                                                            setPaperForm({
                                                                exam: p.exam,
                                                                subject: p.subject,
                                                                grade: p.grade,
                                                                title: p.title,
                                                                instructions: p.instructions,
                                                                total_marks: p.total_marks,
                                                                duration_minutes: p.duration_minutes
                                                            });
                                                            setShowPaperModal(true);
                                                        }}
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => exportPaperToPDF(p)}>
                                                        <Download size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => {
                                                            if (confirm('Delete this exam paper?')) {
                                                                deletePaperMutation.mutate(p.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
                            <button onClick={() => setShowQuestionModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleQuestionSubmit}>
                            <div className="modal-body">
                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Question Type</label>
                                    <select
                                        className="form-input"
                                        value={questionForm.question_type}
                                        onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                                    >
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="true_false">True/False</option>
                                        <option value="short_answer">Short Answer</option>
                                        <option value="long_answer">Long Answer</option>
                                        <option value="fill_blank">Fill in the Blank</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Question Text</label>
                                    <textarea
                                        className="form-input"
                                        value={questionForm.question_text}
                                        onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                        rows={3}
                                        required
                                    />
                                </div>

                                {questionForm.question_type === 'multiple_choice' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Options</label>
                                        {questionForm.options.map((option, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                <input
                                                    type="radio"
                                                    name="correct_answer"
                                                    checked={questionForm.correct_answer === option}
                                                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: option })}
                                                />
                                                <input
                                                    className="form-input"
                                                    value={option}
                                                    onChange={e => updateQuestionOption(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    style={{ flex: 1 }}
                                                />
                                                {questionForm.options.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeQuestionOption(index)}
                                                        style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '8px', borderRadius: 4 }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={addQuestionOption} className="btn btn-outline" style={{ marginTop: 8 }}>
                                            <Plus size={14} /> Add Option
                                        </button>
                                    </div>
                                )}

                                {questionForm.question_type !== 'multiple_choice' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Correct Answer</label>
                                        <textarea
                                            className="form-input"
                                            value={questionForm.correct_answer}
                                            onChange={e => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-input"
                                            value={questionForm.subject}
                                            onChange={e => setQuestionForm({ ...questionForm, subject: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Class</label>
                                        <select
                                            className="form-input"
                                            value={questionForm.grade}
                                            onChange={e => setQuestionForm({ ...questionForm, grade: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {gradeList.map(g => <option key={g.id} value={g.id}>Class {g.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Marks</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={questionForm.marks}
                                            onChange={e => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Difficulty</label>
                                        <select
                                            className="form-input"
                                            value={questionForm.difficulty_level}
                                            onChange={e => setQuestionForm({ ...questionForm, difficulty_level: e.target.value })}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                                    {createQuestionMutation.isPending || updateQuestionMutation.isPending ? 'Saving...' : (editingQuestion ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Exam Paper Modal */}
            {showPaperModal && (
                <div className="modal-overlay" onClick={() => setShowPaperModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPaper ? 'Edit Exam Paper' : 'Create Exam Paper'}</h3>
                            <button onClick={() => setShowPaperModal(false)}>×</button>
                        </div>
                        <form onSubmit={handlePaperSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Exam</label>
                                        <select
                                            className="form-input"
                                            value={paperForm.exam}
                                            onChange={e => setPaperForm({ ...paperForm, exam: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Exam</option>
                                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-input"
                                            value={paperForm.subject}
                                            onChange={e => setPaperForm({ ...paperForm, subject: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Class</label>
                                    <select
                                        className="form-input"
                                        value={paperForm.grade}
                                        onChange={e => setPaperForm({ ...paperForm, grade: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {gradeList.map(g => <option key={g.id} value={g.id}>Class {g.name}</option>)}
                                    </select>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Paper Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={paperForm.title}
                                        onChange={e => setPaperForm({ ...paperForm, title: e.target.value })}
                                        placeholder="e.g., Mathematics Mid Term Exam 2026"
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Instructions</label>
                                    <textarea
                                        className="form-input"
                                        value={paperForm.instructions}
                                        onChange={e => setPaperForm({ ...paperForm, instructions: e.target.value })}
                                        rows={3}
                                        placeholder="Enter exam instructions..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Total Marks</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paperForm.total_marks}
                                            onChange={e => setPaperForm({ ...paperForm, total_marks: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paperForm.duration_minutes}
                                            onChange={e => setPaperForm({ ...paperForm, duration_minutes: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPaperModal(false)} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={createPaperMutation.isPending || updatePaperMutation.isPending}>
                                    {createPaperMutation.isPending || updatePaperMutation.isPending ? 'Saving...' : (editingPaper ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .tab-button.active { background: var(--primary) !important; color: white !important; }
                .tab-button { transition: all 0.2s ease; }
                .tab-button:hover { background: var(--overlay) !important; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: var(--dark); border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
                .modal-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                .modal-header h3 { margin: 0; }
                .modal-header button { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
                .modal-body { padding: 20px; }
                .modal-footer { padding: 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; }
            `}</style>
        </div>
    );
}