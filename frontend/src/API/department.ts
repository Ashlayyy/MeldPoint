/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  status: number;
  data: T;
}

export async function GetAllDepartments(): Promise<APIResponse<Department[]>> {
  try {
    const response = await axios.get(`/department`);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

export async function GetDepartmentById(id: string): Promise<APIResponse<Department>> {
  try {
    const response = await axios.get(`/department/${id}`);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    console.error(`Error fetching department ${id}:`, error);
    throw error;
  }
}

export async function CreateDepartment(data: { name: string; description?: string }): Promise<APIResponse<Department>> {
  try {
    const response = await axios.post(`/department`, data);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

export async function UpdateDepartment(id: string, data: { name?: string; description?: string }): Promise<APIResponse<Department>> {
  try {
    const response = await axios.patch(`/department/${id}`, data);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    console.error(`Error updating department ${id}:`, error);
    throw error;
  }
}

export async function DeleteDepartment(id: string): Promise<APIResponse<void>> {
  try {
    const response = await axios.delete(`/department/${id}`);
    return { status: response.status, data: response.data.data };
  } catch (error) {
    console.error(`Error deleting department ${id}:`, error);
    throw error;
  }
}
