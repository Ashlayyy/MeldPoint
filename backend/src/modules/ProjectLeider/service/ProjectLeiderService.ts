import {
  createProjectleider,
  getAllProjectleiders,
  getSingleProjectleider,
  updateSingleProjectleider,
  deleteSingleProjectLeider
} from '../../../db/queries';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { ProjectLeider } from '../validation/schemas';
import logger from '../../../helpers/loggerInstance';

export const getAllProjectLeiders = async () => {
  try {
    return await getAllProjectleiders();
  } catch (error) {
    logger.error(`ProjectLeiderService: Failed to fetch all project leaders - ${error}`);
    throw error;
  }
};

export const getSingleProjectLeider = async (id: string) => {
  try {
    if (!id) {
      throw new BadRequestError('Project leader ID is required');
    }

    const projectLeider = await getSingleProjectleider(id);
    if (!projectLeider) {
      throw new NotFoundError(`Project leader with ID ${id} not found`);
    }

    return projectLeider;
  } catch (error) {
    logger.error(`ProjectLeiderService: Failed to fetch project leader ${id} - ${error}`);
    throw error;
  }
};

export const createProjectLeider = async (data: ProjectLeider) => {
  try {
    return await createProjectleider({ Name: data.name });
  } catch (error) {
    logger.error(`ProjectLeiderService: Failed to create project leader - ${error}`);
    throw error;
  }
};

export const updateProjectLeider = async (id: string, data: Partial<ProjectLeider>) => {
  try {
    const existingProjectLeider = await getSingleProjectleider(id);
    if (!existingProjectLeider) {
      throw new NotFoundError(`Project leader with ID ${id} not found`);
    }

    return await updateSingleProjectleider(id, { Name: data.name });
  } catch (error) {
    logger.error(`ProjectLeiderService: Failed to update project leader ${id} - ${error}`);
    throw error;
  }
};

export const deleteProjectLeider = async (id: string) => {
  try {
    const existingProjectLeider = await getSingleProjectleider(id);
    if (!existingProjectLeider) {
      throw new NotFoundError(`Project leader with ID ${id} not found`);
    }

    return await deleteSingleProjectLeider(id);
  } catch (error) {
    logger.error(`ProjectLeiderService: Failed to delete project leader ${id} - ${error}`);
    throw error;
  }
};
