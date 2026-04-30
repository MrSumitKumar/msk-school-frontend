import axios from 'axios';
import { useAuthStore } from '../app/authStore';
import toast from 'react-hot-toast';

// TIP: Using dynamic hostname makes it work on both local and external networks.
// const BASE_URL = `http://${window.location.hostname}:8000/api`;
const BASE_URL = `https://msk-school-backend-1.onrender.com/api`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken });
                useAuthStore.getState().setTokens(data.access, refreshToken);
                original.headers.Authorization = `Bearer ${data.access}`;
                return api(original);
            } catch {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        // Show error toast for non-401 errors
        if (error.response?.status >= 500) {
            toast.error('Server error. Please try again.');
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Auth ────────────────────────────────────────────
export const authApi = {
    login: (data) => api.post('/auth/login/', data),
    logout: () => api.post('/auth/logout/'),
    refresh: (refresh) => api.post('/auth/refresh/', { refresh }),

    me: () => api.get(`/accounts/me/?_t=${new Date().getTime()}`),
    changePassword: (data) => api.post('/accounts/change-password/', data),
};

// ─── Dashboard ───────────────────────────────────────
export const dashboardApi = {
    stats: () => api.get('/accounts/dashboard-stats/'),
};

// ─── Super Admin SaaS ────────────────────────────────
export const saasApi = {
    dashboardStats: () => api.get('/schools/saas-dashboard/'),
    subscriptions: {
        list: (params) => api.get('/schools/subscriptions/', { params }),
        create: (data) => api.post('/schools/subscriptions/', data),
        update: (id, data) => api.put(`/schools/subscriptions/${id}/`, data),
        delete: (id) => api.delete(`/schools/subscriptions/${id}/`),
        getBySchool: (schoolId) => api.get('/schools/subscriptions/', { params: { school: schoolId } }),
    },
    payments: {
        list: (params) => api.get('/schools/payments/', { params }),
    },
    invoices: {
        list: (params) => api.get('/schools/invoices/', { params }),
    },
    notifications: {
        list: (params) => api.get('/schools/notifications/', { params }),
        markRead: (id) => api.patch(`/schools/notifications/${id}/`, { is_read: true }),
    }
};

// ─── Accounts / Users ────────────────────────────────
export const accountsApi = {
    list: (params) => api.get('/accounts/users/', { params }),
    create: (data) => api.post('/accounts/users/', data),
    update: (id, data) => api.put(`/accounts/users/${id}/`, data),
    delete: (id) => api.delete(`/accounts/users/${id}/`),
    get: (id) => api.get(`/accounts/users/${id}/`),
};

// ─── Schools ─────────────────────────────────────────
export const schoolsApi = {
    list: () => api.get('/schools/'),
    create: (data) => api.post('/schools/', data),
    update: (id, data) => api.put(`/schools/${id}/`, data),
    delete: (id) => api.delete(`/schools/${id}/`),
    plans: {
        list: () => api.get('/schools/plans/'),
        create: (data) => api.post('/schools/plans/', data),
        update: (id, data) => api.put(`/schools/plans/${id}/`, data),
        delete: (id) => api.delete(`/schools/plans/${id}/`),
    },
    updateSettings: (data) => api.patch('/schools/settings/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    billing: {
        currentPlan: () => api.get('/schools/billing/current-plan/'),
        razorpay: {
            createOrder: (data) => api.post('/schools/billing/razorpay/create-order/', data),
            verifyPayment: (data) => api.post('/schools/billing/razorpay/verify-payment/', data),
        },
        phonepe: {
            createOrder: (data) => {
                console.log('DEBUG: api.js - phonepe.createOrder payload:', data);
                return api.post('/schools/billing/phonepe/create-order/', data);
            },
            verifyPayment: (data) => {
                console.log('DEBUG: api.js - phonepe.verifyPayment payload:', data);
                return api.post('/schools/billing/phonepe/verify-payment/', data);
            },
        },
        binance: {
            createOrder: (data) => api.post('/schools/billing/binance/create-order/', data),
            verifyPayment: (data) => api.post('/schools/billing/binance/verify-payment/', data),
        }
    }
};

// ─── Academics ───────────────────────────────────────
export const academicsApi = {
    sessions: () => api.get('/academics/sessions/'),
    createSession: (data) => api.post('/academics/sessions/', data),
    updateSession: (id, data) => api.put(`/academics/sessions/${id}/`, data),
    deleteSession: (id) => api.delete(`/academics/sessions/${id}/`),
    classes: () => api.get('/academics/classes/', { params: { page_size: 100 } }),
    createClass: (data) => api.post('/academics/classes/', data),
    getGrades: () => api.get('/academics/grades/', { params: { page_size: 100 } }),
    createGrade: (data) => api.post('/academics/grades/', data),
    bulkCreateGrades: () => api.post('/academics/grades/bulk-create/'),
    updateGrade: (id, data) => api.put(`/academics/grades/${id}/`, data),
    deleteGrade: (id) => api.delete(`/academics/grades/${id}/`),
    getSections: (gradeId) => api.get('/academics/sections/', { params: { ...(gradeId ? { grade: gradeId } : {}), page_size: 100 } }),
    createSection: (data) => api.post('/academics/sections/', data),
    updateSection: (id, data) => api.put(`/academics/sections/${id}/`, data),
    deleteSection: (id) => api.delete(`/academics/sections/${id}/`),
    getSubjects: () => api.get('/academics/subjects/', { params: { page_size: 100 } }),
    createSubject: (data) => api.post('/academics/subjects/', data),
    updateSubject: (id, data) => api.put(`/academics/subjects/${id}/`, data),
    deleteSubject: (id) => api.delete(`/academics/subjects/${id}/`),
    getGradeSubjects: (gradeId) => api.get(`/academics/grade-subjects/${gradeId ? `?grade=${gradeId}` : ''}`),
    createGradeSubject: (data) => api.post('/academics/grade-subjects/', data),
    getBooks: () => api.get('/academics/books/'),
    createBook: (data) => api.post('/academics/books/', data),
    getPeriods: (sectionId) => api.get(`/academics/periods/${sectionId ? `?section=${sectionId}` : ''}`),
    createPeriod: (data) => api.post('/academics/periods/', data),
};

// ─── Students ────────────────────────────────────────
export const studentsApi = {
    list: (params) => api.get('/students/', { params }),
    create: (data) => api.post('/students/create-with-user/', data),
    get: (id) => api.get(`/students/${id}/`),
    update: (id, data) => api.patch(`/students/${id}/`, data),
    delete: (id) => api.delete(`/students/${id}/`),
    restore: (id) => api.post(`/students/${id}/restore/`),
    permanentDelete: (id) => api.delete(`/students/${id}/permanent-delete/`),
    trash: (params) => api.get('/students/', { params: { ...params, trash: 'true' } }),
};

// ─── Teachers ────────────────────────────────────────
export const teachersApi = {
    list: (params) => api.get('/teachers/', { params }),
    create: (data) => api.post('/teachers/create-with-user/', data),
    get: (id) => api.get(`/teachers/${id}/`),
    update: (id, data) => api.patch(`/teachers/${id}/`, data),
    delete: (id) => api.delete(`/teachers/${id}/`),
    restore: (id) => api.post(`/teachers/${id}/restore/`),
    permanentDelete: (id) => api.delete(`/teachers/${id}/permanent-delete/`),
    trash: (params) => api.get('/teachers/', { params: { ...params, trash: 'true' } }),
};

// ─── Attendance ──────────────────────────────────────
export const attendanceApi = {
    list: (params) => api.get('/attendance/', { params }),
    markBulk: (data) => api.post('/attendance/bulk/', data),
    summary: (studentId) => api.get(`/attendance/summary/${studentId}/`),
};

// ─── Fees ────────────────────────────────────────────
export const feesApi = {
    categories: () => api.get('/fees/categories/'),
    createCategory: (data) => api.post('/fees/categories/', data),
    structures: (schoolClass) => api.get(`/fees/structures/${schoolClass ? `?class=${schoolClass}` : ''}`),
    createStructure: (data) => api.post('/fees/structures/', data),
    payments: (params) => api.get('/fees/payments/', { params }),
    createPayment: (data) => api.post('/fees/payments/', data),
    updatePayment: (id, data) => api.put(`/fees/payments/${id}/`, data),
    deletePayment: (id) => api.delete(`/fees/payments/${id}/`),
    downloadReceipt: (paymentId) => api.get(`/fees/payments/${paymentId}/receipt/`, { responseType: 'blob' }),
    installments: (params) => api.get('/fees/installments/', { params }),
};

// ─── Exams ───────────────────────────────────────────
export const examsApi = {
    list: () => api.get('/exams/'),
    create: (data) => api.post('/exams/', data),
    update: (id, data) => api.put(`/exams/${id}/`, data),
    delete: (id) => api.delete(`/exams/${id}/`),
    schedules: (examId) => api.get(`/exams/schedules/${examId ? `?exam=${examId}` : ''}`),
    createSchedule: (data) => api.post('/exams/schedules/', data),
    results: (params) => api.get('/exams/results/', { params }),
    createResult: (data) => api.post('/exams/results/', data),
    updateResult: (id, data) => api.put(`/exams/results/${id}/`, data),
    deleteResult: (id) => api.delete(`/exams/results/${id}/`),

    // Question Management
    questions: {
        list: (params) => api.get('/exams/questions/', { params }),
        create: (data) => api.post('/exams/questions/', data),
        update: (id, data) => api.put(`/exams/questions/${id}/`, data),
        delete: (id) => api.delete(`/exams/questions/${id}/`),
    },

    // Exam Paper Management
    papers: {
        list: (params) => api.get('/exams/papers/', { params }),
        create: (data) => api.post('/exams/papers/', data),
        update: (id, data) => api.put(`/exams/papers/${id}/`, data),
        delete: (id) => api.delete(`/exams/papers/${id}/`),
    },

    // Exam Paper Questions
    paperQuestions: {
        list: (params) => api.get('/exams/paper-questions/', { params }),
        create: (data) => api.post('/exams/paper-questions/', data),
        update: (id, data) => api.put(`/exams/paper-questions/${id}/`, data),
        delete: (id) => api.delete(`/exams/paper-questions/${id}/`),
        reorder: (data) => api.post('/exams/paper-questions/reorder/', data),
    },
};

// ─── Audit Logs ──────────────────────────────────────
export const auditApi = {
    list: (params) => api.get('/audit-logs/', { params }),
    get: (id) => api.get(`/audit-logs/${id}/`),
    delete: (id) => api.delete(`/audit-logs/${id}/delete/`),
    bulkDelete: (ids) => api.post('/audit-logs/bulk-delete/', { ids }),
};

// ─── Timetable ─────────────────────────────────────────
export const timetableApi = {
    getConfig: () => api.get('/timetable/config/'),
    updateConfig: (id, data) => api.put(`/timetable/config/${id}/`, data),
    getActivities: () => api.get('/timetable/activities/'),
    createActivity: (data) => api.post('/timetable/activities/', data),
    updateActivity: (id, data) => api.put(`/timetable/activities/${id}/`, data),
    deleteActivity: (id) => api.delete(`/timetable/activities/${id}/`),
    getSlots: () => api.get('/timetable/slots/'),
    createSlot: (data) => api.post('/timetable/slots/', data),
    updateSlot: (id, data) => api.put(`/timetable/slots/${id}/`, data),
    deleteSlot: (id) => api.delete(`/timetable/slots/${id}/`),
    getEntries: (params) => api.get('/timetable/entries/', { params }),
    createEntry: (data) => api.post('/timetable/entries/', data),
    updateEntry: (id, data) => api.put(`/timetable/entries/${id}/`, data),
    deleteEntry: (id) => api.delete(`/timetable/entries/${id}/`),
};

