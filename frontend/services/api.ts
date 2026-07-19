import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session timeouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Force redirect to login page if unauthorized
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: async (employeeId: string, password: string, rememberMe?: boolean) => {
    const response = await api.post('/auth/login', { employee_id: employeeId, password, remember_me: rememberMe });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        employee_id: response.data.employee_id,
        username: response.data.username,
        role: response.data.role
      }));
    }
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Users endpoints
export const userService = {
  list: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Machines endpoints
export const machineService = {
  list: async (filters?: { category?: string; status?: string; search?: string }) => {
    const response = await api.get('/machines', { params: filters });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/machines', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/machines/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/machines/${id}`);
    return response.data;
  },
  connect: async (machineId: string, connectionType: string) => {
    const response = await api.post('/machines/connect', { machine_id: machineId, connection_type: connectionType });
    return response.data;
  },
  disconnect: async (machineId: string) => {
    const response = await api.post('/machines/disconnect', { machine_id: machineId, connection_type: 'none' });
    return response.data;
  }
};

// Diagnostic endpoints
export const diagnosticService = {
  run: async (machineId: string) => {
    const response = await api.post('/diagnostic/run', { machine_id: machineId });
    return response.data;
  },
  getHistory: async (filters?: { machine_id?: string; status?: string }) => {
    const response = await api.get('/diagnostic/history', { params: filters });
    return response.data;
  },
  getResult: async (id: number) => {
    const response = await api.get(`/diagnostic/${id}`);
    return response.data;
  },
  deleteResult: async (id: number) => {
    const response = await api.delete(`/diagnostic/${id}`);
    return response.data;
  },
  updateNotes: async (id: number, notes: string) => {
    const response = await api.put(`/diagnostic/${id}/notes`, { notes });
    return response.data;
  }
};

// LLM Analysis endpoints
export const llmService = {
  analyze: async (diagnosticResultId: number) => {
    const response = await api.post('/llm/analyze', { diagnostic_result_id: diagnosticResultId });
    return response.data;
  }
};

// Report endpoints
export const reportService = {
  list: async (search?: string) => {
    const response = await api.get('/reports', { params: { search } });
    return response.data;
  },
  create: async (diagnosticResultId: number, title: string) => {
    const response = await api.post('/reports', { diagnostic_result_id: diagnosticResultId, title });
    return response.data;
  },
  updateMetadata: async (id: number, title: string) => {
    const response = await api.put(`/reports/${id}`, { title });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
  getDownloadUrl: (id: number) => {
    return `${API_BASE_URL}/reports/download/${id}`;
  }
};

// Dashboard endpoints
export const dashboardService = {
  getData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  }
};
