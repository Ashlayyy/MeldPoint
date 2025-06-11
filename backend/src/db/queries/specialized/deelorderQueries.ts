/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function addDeelorder(projectID: string, deelorder: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectID },
    select: { Deelorders: true }
  });

  if (project && !project.Deelorders.includes(deelorder)) {
    return prisma.project.update({
      where: { id: projectID },
      data: {
        Deelorders: {
          push: deelorder
        }
      }
    });
  }
  return project;
}

export async function removeDeelorder(projectID: string, deelorder: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectID },
    select: { Deelorders: true }
  });

  if (project) {
    const updatedDeelorders = project.Deelorders.filter((d) => d !== deelorder);
    return prisma.project.update({
      where: { id: projectID },
      data: {
        Deelorders: updatedDeelorders
      }
    });
  }
  return project;
}
