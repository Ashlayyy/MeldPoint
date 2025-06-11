import {
  getUserSettings as getUserSettingsQuery,
  updateSettings as updateSettingsQuery,
  resetSettings as resetSettingsQuery
} from '../../../db/queries/specialized/settingsQueries';

export interface Settings {
  id: string;
  UserId: string;
  Theme: string | null;
  Language: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface UpdateSettingsDto {
  theme?: string;
  language?: string;
}

export async function getSettings(userId: string): Promise<Settings | null> {
  return getUserSettingsQuery(userId);
}

export async function update(userId: string, data: UpdateSettingsDto): Promise<Settings> {
  return updateSettingsQuery(userId, {
    theme: data.theme,
    language: data.language
  });
}

export async function reset(userId: string): Promise<Settings> {
  return resetSettingsQuery(userId);
}
