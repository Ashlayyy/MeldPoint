import prisma from '../../prismaClient';

export async function getStatuses() {
  return prisma.status.findMany({
    orderBy: {
      StatusNaam: 'asc'
    }
  });
}

export async function getStatus(id: string) {
  return prisma.status.findUnique({
    where: { id }
  });
}

export async function createStatus(data: { StatusNaam: string; StatusColor: string; StatusType: string }) {
  return prisma.status.create({
    data: {
      StatusNaam: data.StatusNaam,
      StatusColor: data.StatusColor,
      StatusType: data.StatusType
    }
  });
}

export async function updateStatus(
  id: string,
  data: {
    StatusNaam?: string;
    StatusColor?: string;
    StatusType?: string;
  }
) {
  return prisma.status.update({
    where: { id },
    data: {
      ...(data.StatusNaam && { StatusNaam: data.StatusNaam }),
      ...(data.StatusColor && { StatusColor: data.StatusColor }),
      ...(data.StatusType && { StatusType: data.StatusType })
    }
  });
}

export async function deleteStatus(id: string) {
  return prisma.status.delete({
    where: { id }
  });
}
