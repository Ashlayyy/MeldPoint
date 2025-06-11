/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function getUserSettings(userId: string) {
  return await prisma.settings.findUnique({
    where: { UserId: userId }
  });
}

export async function updateSettings(
  userId: string,
  data: {
    theme?: string;
    language?: string;
  }
) {
  const existingSettings = await prisma.settings.findUnique({
    where: { UserId: userId }
  });

  if (!existingSettings) {
    return await prisma.settings.create({
      data: {
        User: { connect: { id: userId } },
        ...data
      }
    });
  }

  return await prisma.settings.update({
    where: { UserId: userId },
    data: {
      ...(data.theme && { Theme: data.theme }),
      ...(data.language && { Language: data.language })
    }
  });
}

export async function resetSettings(userId: string) {
  const defaultSettings = {
    theme: 'light',
    language: 'en'
  };

  return await prisma.settings.upsert({
    where: { UserId: userId },
    update: {
      Theme: defaultSettings.theme,
      Language: defaultSettings.language
    },
    create: {
      User: { connect: { id: userId } },
      Theme: defaultSettings.theme,
      Language: defaultSettings.language
    }
  });
}
