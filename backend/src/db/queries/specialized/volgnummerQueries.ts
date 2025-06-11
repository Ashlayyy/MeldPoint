/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function getVolgNummer() {
  const highestVolgNummer = await prisma.volgNummer.findFirst({
    where: {
      Type: 'volgNummer'
    },
    orderBy: {
      VolgNummer: 'desc'
    }
  });

  if (!highestVolgNummer) {
    const newVolgNummer = await prisma.volgNummer.create({
      data: {
        VolgNummer: 1,
        Type: 'volgNummer'
      }
    });
    return newVolgNummer.VolgNummer;
  }

  return highestVolgNummer.VolgNummer + 1;
}

export async function updateVolgNummer() {
  return await prisma.volgNummer.updateMany({
    where: {
      Type: 'volgNummer'
    },
    data: { VolgNummer: { increment: 1 } }
  });
}

export async function revertVolgNummer() {
  const currentVolgNummer = await prisma.volgNummer.findFirst({
    where: {
      Type: 'volgNummer'
    },
    orderBy: {
      VolgNummer: 'desc'
    }
  });

  if (currentVolgNummer) {
    await prisma.volgNummer.updateMany({
      where: {
        Type: 'volgNummer'
      },
      data: { VolgNummer: { decrement: 1 } }
    });
  }
}

export async function getPreventiefVolgNummer() {
  const highestVolgNummer = await prisma.volgNummer.findFirst({
    where: {
      Type: 'preventiefVolgNummer'
    },
    orderBy: {
      VolgNummer: 'desc'
    }
  });

  if (!highestVolgNummer) {
    const newVolgNummer = await prisma.volgNummer.create({
      data: {
        VolgNummer: 1,
        Type: 'preventiefVolgNummer'
      }
    });
    return newVolgNummer.VolgNummer;
  }

  return highestVolgNummer.VolgNummer + 1;
}

export async function updatePreventiefVolgNummer() {
  return await prisma.volgNummer.updateMany({
    where: {
      Type: 'preventiefVolgNummer'
    },
    data: { VolgNummer: { increment: 1 } }
  });
}

export async function revertPreventiefVolgNummer() {
  const currentVolgNummer = await prisma.volgNummer.findFirst({
    where: {
      Type: 'preventiefVolgNummer'
    },
    orderBy: {
      VolgNummer: 'desc'
    }
  });

  if (currentVolgNummer) {
    await prisma.volgNummer.updateMany({
      where: {
        Type: 'preventiefVolgNummer'
      },
      data: { VolgNummer: { decrement: 1 } }
    });
  }
}

export async function handleVolgNummerTransaction() {
  const nextNumber = await getVolgNummer();
  await updateVolgNummer();
  return nextNumber;
}

export async function handlePreventiefVolgNummerTransaction() {
  const nextNumber = await getPreventiefVolgNummer();
  await updatePreventiefVolgNummer();
  return nextNumber;
}
