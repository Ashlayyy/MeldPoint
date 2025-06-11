/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function getAllDepartments() {
  return await prisma.department.findMany({
    include: {
      _count: {
        select: {
          users: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getDepartmentById(id: string) {
  return await prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          Name: true,
          Email: true,
          Department: true
        }
      },
      _count: {
        select: {
          users: true
        }
      }
    }
  });
}

export async function createDepartment(data: { name: string; description?: string }) {
  return await prisma.department.create({
    data: {
      name: data.name,
      description: data.description
    }
  });
}

export async function updateDepartment(id: string, data: { name?: string; description?: string }) {
  return await prisma.department.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description })
    }
  });
}

export async function deleteDepartment(id: string) {
  return await prisma.department.delete({
    where: { id }
  });
}

export async function assignUserToDepartment(userId: string, departmentId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      Department: {
        connect: {
          id: departmentId
        }
      }
    },
    include: {
      Department: true
    }
  });
}
