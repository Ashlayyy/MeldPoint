import fs from 'fs/promises';
import path from 'path';
import { Request } from 'express';
import Handlebars from 'handlebars';
import logger from '../../../helpers/loggerInstance';
import defaultVariables from '../constants/emailTemplateVariables';

// Convert class to exported functions
const templateDir = path.join(__dirname, '../../../../templates/email');

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('nl-NL');
});

Handlebars.registerHelper('formatDateTime', (date: Date) => {
  return new Date(date).toLocaleString('nl-NL');
});

Handlebars.registerHelper('formatTime', (date: Date) => {
  return new Date(date).toLocaleTimeString('nl-NL');
});

export const getTemplate = async (templateName: string): Promise<string> => {
  try {
    const templatePath = path.join(templateDir, `${templateName}.hbs`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    logger.error(`Template-Service: Error reading template ${templateName} - ${error}`);
    throw new Error(`Template ${templateName} not found`);
  }
};

export const replaceTemplateVariables = (template: string, variables: Record<string, any>, req: Request): string => {
  try {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate({
      ...defaultVariables,
      ...variables,
      user: req.user,
      apiUrl: process.env.API_URL
    });
  } catch (error) {
    logger.error(`Template-Service: Error replacing variables - ${error}`);
    throw new Error('Failed to replace template variables');
  }
};

export const listTemplates = async (): Promise<string[]> => {
  try {
    const files = await fs.readdir(templateDir);
    return files.filter((file) => file.endsWith('.hbs')).map((file) => file.replace('.hbs', ''));
  } catch (error) {
    logger.error(`Template-Service: Error listing templates - ${error}`);
    throw new Error('Failed to list templates');
  }
};
