/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/utils/axios';
import { cacheService } from '@/utils/cache';

interface CreateProjectData {
  NumberID: number;
  ProjectNaam: string;
  ProjectLeiderId: string;
  StartDate: string;
  EndDate: string;
  ProjectLocatie: string;
  Beschrijving: string;
}

export async function GetAllProjects() {
  const cacheKey = `projects`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/project`);
  cacheService.set(cacheKey, response.data.data, { ttl: 2 * 60 * 1000 }); // 2 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetProjectById(id: string) {
  if (!id) throw new Error('ID is required');

  const cacheKey = `project-${id}`;
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return { status: 200, data: cachedData };
  }

  const response = await axios.get(`${import.meta.env.VITE_API_URL}/project/${id}`);
  cacheService.set(cacheKey, response.data.data, { ttl: 5 * 60 * 1000 }); // 5 minutes
  return { status: response.status, data: response.data.data };
}

export async function GetProjectByNumber(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/project/number/${id}`);
  return { status: response.status, data: response.data.data };
}

export async function CreateProject(data: Record<string, any>) {
  if (!data.NumberID) throw new Error('NumberID is required');

  if (!data.ProjectNaam) {
    data.ProjectNaam = `Temp - ${Math.random().toString(36).slice(2)}`;
  }

  const response = await axios.post(`${import.meta.env.VITE_API_URL}/project`, data);
  cacheService.clear(); // Clear all project caches on creation
  return { status: response.status, data: response.data.data };
}

export async function UpdateProject(id: string, data: Record<string, any>) {
  if (!id) throw new Error('ID is required');
  if (!data) throw new Error('Data is required');
  const response = await axios.patch(`${import.meta.env.VITE_API_URL}/project/${id}`, data);
  return { status: response.status, data: response.data.data };
}

export async function DeleteProject(id: string) {
  if (!id) throw new Error('ID is required');
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/project/${id}`);
  cacheService.clear();
  return { status: response.status, data: response.data.data };
}

export async function AddDeelorder(projectId: string, deelorder: string) {
  if (!projectId || !deelorder) throw new Error('ProjectId and Deelorder are required');
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/project/${projectId}/deelorder`, { deelorder });
  cacheService.remove(`project-${projectId}`); // Clear specific project cache
  return { status: response.status, data: response.data.data };
}

export async function RemoveDeelorder(projectId: string, deelorderId: string) {
  if (!projectId) throw new Error('Project ID is required');
  if (!deelorderId) throw new Error('Deelorder ID is required');

  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/project/${projectId}/deelorder/${deelorderId}`);
  return { status: response.status, data: response.data.data };
}
