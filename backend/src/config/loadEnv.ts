import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

function findBackendRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.resolve(dir, '..');
  }
  return process.cwd();
}

const backendRoot = findBackendRoot();
const isProd = process.env.NODE_ENV === 'production';
const envFiles = isProd ? ['.env.server', '.env'] : ['.env', '.env.server'];

envFiles.forEach((file) => {
  const envPath = path.join(backendRoot, file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

export function getMongoUrl(): string {
  const useDev = process.env.ENABLE_DEV_DATABASE === 'true';
  const url = (useDev ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL)?.trim();

  if (!url) {
    throw new Error(
      `Missing ${useDev ? 'DATABASE_URL_DEV' : 'DATABASE_URL'} for Mongo session store. ` +
        `Set it in backend/.env or backend/.env.server (cwd=${process.cwd()}, backendRoot=${backendRoot}).`
    );
  }

  return url;
}
