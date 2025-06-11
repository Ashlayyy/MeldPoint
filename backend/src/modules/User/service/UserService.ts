/* eslint-disable import/no-extraneous-dependencies */
import { User as PrismaUser } from '@prisma/client';
import logger from '../../../helpers/loggerInstance';
import { withDatabaseRetry } from '../../../helpers/databaseRetry';
import {
  getAllUsers as getAllUsersQuery,
  getUserById as getUserByIdQuery,
  getUserByEmail as getUserByEmailQuery,
  updateUser as updateUserQuery,
  deleteUser as deleteUserQuery,
  getUsersByRole as getUsersByRoleQuery,
  getUsersByDepartment as getUsersByDepartmentQuery,
  searchUsers as searchUsersQuery,
  getActiveUsers as getActiveUsersQuery,
  getAllUsersForFilter as getAllUsersForFilterQuery
} from '../../../db/queries/specialized/userQueries';
import { createUser as createUserQuery } from '../../../db/queries';

export type User = PrismaUser;

export interface CreateUserDto {
  Email: string;
  Name: string;
  MicrosoftId: string;
  lastLogin: Date;
  groupID: string;
  departmentId?: string;
}

export interface UpdateUserDto {
  Name?: string;
  Email?: string;
  MicrosoftId?: string;
  departmentId?: string;
}

export interface SearchFilters {
  query?: string;
  role?: string;
  department?: string;
  status?: string;
}

export async function getAll(page: number = 1, limit: number = 10) {
  try {
    logger.info('User-Service: Getting all users');
    return await withDatabaseRetry(() => getAllUsersQuery(page, limit));
  } catch (error) {
    logger.error('User-Service: Failed to get all users', error as Error);
    throw error;
  }
}

export async function getById(id: string) {
  try {
    logger.info('User-Service: Getting user by id', { id });
    return await withDatabaseRetry(() => getUserByIdQuery(id));
  } catch (error) {
    logger.error('User-Service: Failed to get user by id', error as Error);
    throw error;
  }
}

export async function getByEmail(email: string) {
  try {
    logger.info('User-Service: Getting user by email', { email });
    return await withDatabaseRetry(() => getUserByEmailQuery(email));
  } catch (error) {
    logger.error('User-Service: Failed to get user by email', error as Error);
    throw error;
  }
}

export async function create(data: CreateUserDto) {
  try {
    logger.info('User-Service: Creating user', { email: data.Email });
    return await withDatabaseRetry(() => createUserQuery(data));
  } catch (error) {
    logger.error('User-Service: Failed to create user', error as Error);
    throw error;
  }
}

export async function update(id: string, data: UpdateUserDto) {
  try {
    logger.info('User-Service: Updating user', { id });
    return await withDatabaseRetry(() => updateUserQuery(id, data));
  } catch (error) {
    logger.error('User-Service: Failed to update user', error as Error);
    throw error;
  }
}

export async function remove(id: string) {
  try {
    logger.info('User-Service: Deleting user', { id });
    return await withDatabaseRetry(() => deleteUserQuery(id));
  } catch (error) {
    logger.error('User-Service: Failed to delete user', error as Error);
    throw error;
  }
}

export async function getByRole(role: string, page: number = 1, limit: number = 10) {
  try {
    logger.info('User-Service: Getting users by role', { role });
    return await withDatabaseRetry(() => getUsersByRoleQuery(role, page, limit));
  } catch (error) {
    logger.error('User-Service: Failed to get users by role', error as Error);
    throw error;
  }
}

export async function getByDepartment(departmentId: string, page: number = 1, limit: number = 10) {
  try {
    logger.info('User-Service: Getting users by department', { departmentId });
    return await withDatabaseRetry(() => getUsersByDepartmentQuery(departmentId, page, limit));
  } catch (error) {
    logger.error('User-Service: Failed to get users by department', error as Error);
    throw error;
  }
}

export async function search(filters: SearchFilters) {
  try {
    logger.info('User-Service: Searching users', { filters });
    return await withDatabaseRetry(() => searchUsersQuery(filters));
  } catch (error) {
    logger.error('User-Service: Failed to search users', error as Error);
    throw error;
  }
}

export async function getActive(userId: string) {
  try {
    logger.info('User-Service: Getting active users', { userId });
    return await withDatabaseRetry(() => getActiveUsersQuery(userId));
  } catch (error) {
    logger.error('User-Service: Failed to get active users', error as Error);
    throw error;
  }
}

export async function getAllForFilter() {
  try {
    logger.info('User-Service: Getting all users for filter');
    return await withDatabaseRetry(() => getAllUsersForFilterQuery());
  } catch (error) {
    logger.error('User-Service: Failed to get all users for filter', error as Error);
    throw error;
  }
}
