import { Prisma, Project } from '@prisma/client';
import prisma from '../../../db/prismaClient';
import logger from '../../../utils/logger';

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    return await prisma.project.findMany({
      include: {
        ProjectLeider: true
      }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to get all projects', { error });
    throw error;
  }
};

export const getProjectById = async (id: string, type: 'id' | 'number' = 'id'): Promise<Project | null> => {
  try {
    const where = type === 'id' ? { id } : { NumberID: parseInt(id, 10) };
    return await prisma.project.findUnique({
      where,
      include: {
        ProjectLeider: true
      }
    });
  } catch (error) {
    logger.error(`ProjectService: Failed to get project by ${type}`, { id, error });
    throw error;
  }
};

export const createProject = async (data: Prisma.ProjectCreateInput): Promise<Project> => {
  try {
    return await prisma.project.create({
      data,
      include: {
        ProjectLeider: true
      }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to create project', { error });
    throw error;
  }
};

export const updateProject = async (id: string, data: Prisma.ProjectUpdateInput): Promise<Project> => {
  try {
    console.log('data from UPDATE PROJECT');
    console.log(data);
    return await prisma.project.update({
      where: { id },
      data,
      include: {
        ProjectLeider: true
      }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to update project', { id, error });
    throw error;
  }
};

export const addDeelorder = async (projectId: string, deelorderId: string): Promise<Project> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const updatedDeelorders = [...(project.Deelorders || []), deelorderId];

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        Deelorders: updatedDeelorders
      }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to add deelorder', { projectId, deelorderId, error });
    throw error;
  }
};

export const removeDeelorder = async (projectId: string, deelorderId: string): Promise<Project> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const updatedDeelorders = project.Deelorders.filter((id) => id !== deelorderId);

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        Deelorders: updatedDeelorders
      }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to remove deelorder', { projectId, deelorderId, error });
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<any> => {
  try {
    if (!id) {
      return null;
    }
    return await prisma.project.delete({
      where: { id }
    });
  } catch (error) {
    logger.error('ProjectService: Failed to delete project', { id, error });
    throw error;
  }
};
