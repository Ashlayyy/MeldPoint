import prisma from '../../prismaClient';

const getSystemLogsByMeldingId = async (meldingId: string, preventiefId: string, correctiefId: string) => {
  const searchQuery: any[] = [];

  if (meldingId) {
    searchQuery.push({ resourceId: meldingId });
  }
  if (preventiefId) {
    searchQuery.push({ resourceId: preventiefId });
  }
  if (correctiefId) {
    searchQuery.push({ resourceId: correctiefId });
  }

  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        OR: searchQuery
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return logs;
  } catch (error) {
    console.error('Error fetching system logs:', error);
    throw error;
  }
};

export default getSystemLogsByMeldingId;
