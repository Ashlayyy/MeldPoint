import axios from '@/utils/axios';

export interface Task {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  action: string;
  status: string;
  category: string;
  deadline: string;
  preventiefId?: string;
  correctiefId?: string;
  completedAt?: Date | null;
  url?: string;
  finished: boolean;
  user?: {
    Name: string;
  };
}

export interface TaskCreateDTO {
  message: string;
  level: number;
  userId: string;
  url?: string;
  action: string;
  actionType: 'preventief' | 'correctief';
  targetId?: string;
  deadline: string;
  finished: boolean;
}

export const TasksAPI = {
  async getTasks(): Promise<{ data: Task[]; status: number }> {
    const response = await axios.get('/tasks');
    return { data: response.data.data || response.data, status: response.status };
  },

  async getTasksCurrentUser(): Promise<{ data: Task[]; status: number }> {
    const response = await axios.get('/tasks/currentUser');
    return { data: response.data.data || response.data, status: response.status };
  },

  async getTasksByUserId(userId: string): Promise<{ data: Task[]; status: number }> {
    const response = await axios.get(`/tasks/user/${userId}`);
    return { data: response.data.data || response.data, status: response.status };
  },

  async getTasksByCorrectief(correctiefId: string): Promise<{ data: Task[]; status: number }> {
    const response = await axios.get(`/tasks/correctief/${correctiefId}`);
    return { data: response.data.data || response.data, status: response.status };
  },

  async getTasksByPreventief(preventiefId: string): Promise<{ data: Task[]; status: number }> {
    const response = await axios.get(`/tasks/preventief/${preventiefId}`);
    return { data: response.data.data || response.data, status: response.status };
  },

  async createTask(todo: TaskCreateDTO): Promise<{ data: Task; status: number }> {
    const response = await axios.post('/tasks', todo);
    return { data: response.data.data || response.data, status: response.status };
  },

  async updateTask(id: string, updates: any): Promise<{ data: Task; status: number }> {
    const response = await axios.put(`/tasks/${id}`, updates);
    return { data: response.data, status: response.status };
  },

  async deleteTask(id: string): Promise<{ status: number }> {
    const response = await axios.delete(`/tasks/${id}`);
    return { status: response.status };
  },

  async completeTodo(id: string): Promise<{ data: Task; status: number }> {
    const response = await axios.put(`/tasks/${id}/complete`);
    return { data: response.data, status: response.status };
  },

  async uncompleteTodo(id: string): Promise<{ data: Task; status: number }> {
    const response = await axios.put(`/tasks/${id}/uncomplete`);
    return { data: response.data, status: response.status };
  },

  async findTasksByIds(ids: { id: string; category: string | undefined }[]): Promise<{ data: Task[]; status: number }> {
    const response = await axios.post('/tasks/findByID', { ids });
    return { data: response.data.data || response.data, status: response.status };
  }
};

export default TasksAPI;
