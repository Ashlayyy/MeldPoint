// eslint-disable-next-line import/no-extraneous-dependencies
import fs from 'fs-extra';
import path from 'path';

const copyTemplates = async () => {
  const sourceDir = path.join(__dirname, '../templates');
  const targetDir = path.join(__dirname, '../dist/templates');

  try {
    await fs.copy(sourceDir, targetDir);
    console.log('✅ Templates copied successfully to dist folder');
  } catch (err) {
    console.error('Error copying templates:', err);
    process.exit(1);
  }
};

const copyChangelogs = async () => {
  const sourceDir = path.join(__dirname, '../changelogs');
  const targetDir = path.join(__dirname, '../dist/changelogs');

  try {
    await fs.copy(sourceDir, targetDir);
    console.log('✅ Changelogs copied successfully to dist folder');
  } catch (err) {
    console.error('Error copying changelogs:', err);
    process.exit(1);
  }
};

const run = async () => {
  await copyTemplates();
  await copyChangelogs();
};

run();
