/* eslint-disable no-return-await */
import { Department } from '@prisma/client';
import {
  getAllDepartments as getAllDepartmentsQuery,
  getDepartmentById as getDepartmentByIdQuery,
  createDepartment as createDepartmentQuery,
  updateDepartment as updateDepartmentQuery,
  deleteDepartment as deleteDepartmentQuery,
  assignUserToDepartment as assignUserToDepartmentQuery
} from '../../../db/queries';

export const getAllDepartments = async (): Promise<Department[]> => {
  return await getAllDepartmentsQuery();
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
  return await getDepartmentByIdQuery(id);
};

export const createDepartment = async (data: { name: string; description?: string }): Promise<Department> => {
  if (!data.name) {
    throw new Error('Name is required');
  }
  return await createDepartmentQuery(data);
};

export const updateDepartment = async (
  id: string,
  data: { name?: string; description?: string }
): Promise<Department> => {
  return await updateDepartmentQuery(id, data);
};

export const deleteDepartment = async (id: string): Promise<boolean> => {
  await deleteDepartmentQuery(id);
  return true;
};

export const assignUserToDepartment = async (userId: string, departmentId: string) => {
  if (!userId || !departmentId) {
    throw new Error('User ID and Department ID are required');
  }
  return await assignUserToDepartmentQuery(userId, departmentId);
};
