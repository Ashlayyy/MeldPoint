import { RequestHandler } from 'express';
import { ResourceType } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../../helpers/loggerInstance';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import * as GitHubService from '../../GitHub/service/GitHubService';
import config from '../../../config';

// --- Caching for getLastVersion ---
let cachedLatestVersion: { version: string; expires: number } | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache duration: 5 minutes
// ---------------------------------

interface ChangelogFileData {
  date: string;
  changes: {
    [category: string]: string[];
  };
}

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    [category: string]: string[];
  };
  upcomingRelease?: boolean;
  isVisibleWhenUpcoming?: boolean;
}

function formatDateDDMMYYYY(dateString: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    logger.warn(`Changelogs-Controller: Invalid date format encountered: ${dateString}. Expected YYYY-MM-DD.`);
    return dateString;
  }
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}

function linkifyIssueReferences(text: string, repoFull?: string): string {
  if (!repoFull) {
    return text;
  }

  const issueRegex = /#(\d+)/g;
  const baseUrl = `https://github.com/${repoFull}/issues/`;

  return text.replace(issueRegex, (match, issueNumber) => {
    const url = `${baseUrl}${issueNumber}`;
    return `<a href="${url}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">#${issueNumber}</a>`;
  });
}

function linkifyUrls(text: string): string {
  // Basic regex to find URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.replace(urlRegex, (url) => {
    // Create an anchor tag for the URL
    return `<a href="${url}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

const changelogsDir = path.join(__dirname, '..', '..', '..', '..', 'changelogs');

async function readLocalChangelogs(): Promise<ChangelogEntry[]> {
  let localChangelogs: ChangelogEntry[] = [];
  try {
    const files = await fs.readdir(changelogsDir);
    const jsonFiles = files.filter((file) => path.extname(file) === '.json');
    const repoFull = config.github?.repoFull; // Get repoFull for issue linkification

    for (const file of jsonFiles) {
      const filePath = path.join(changelogsDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: ChangelogFileData = JSON.parse(fileContent);
      const version = path.basename(file, '.json');

      if (data.date && typeof data.changes === 'object' && data.changes !== null) {
        const formattedDate = formatDateDDMMYYYY(data.date);
        // Linkify URLs and GitHub issues in local changes
        const linkifiedChanges = Object.entries(data.changes).reduce(
          (acc, [category, descriptions]) => {
            acc[category] = descriptions.map((desc) => {
              let result = linkifyUrls(desc);
              if (repoFull) {
                result = linkifyIssueReferences(result, repoFull);
              }
              return result;
            });
            return acc;
          },
          {} as { [category: string]: string[] }
        );
        localChangelogs.push({ version, date: formattedDate, changes: linkifiedChanges, upcomingRelease: false });
      } else {
        logger.warn(`Changelogs-Controller: Invalid format in local file ${file}. Skipping.`);
      }
    }
  } catch (readErr: any) {
    if (readErr.code === 'ENOENT') {
      logger.warn(`Changelogs-Controller: Local changelogs directory not found at ${changelogsDir}.`);
    } else {
      logger.error('Changelogs-Controller: Error reading local changelog files', readErr);
    }
    localChangelogs = [];
  }
  return localChangelogs;
}

async function fetchGithubChangelogs(): Promise<ChangelogEntry[] | null> {
  if (!config.github?.apiKey || !config.github?.username || !config.github?.repo) {
    logger.warn('Changelogs-Controller: GitHub config missing, cannot fetch releases.');
    return null;
  }
  const repoFull = config.github.repoFull; // Get repoFull for issue linkification

  try {
    const response = await GitHubService.getReleases();
    const releases = response.data;

    if (!releases || releases.length === 0) {
      logger.info('Changelogs-Controller: No releases found on GitHub.');
      return [];
    }

    const githubChangelogs = releases
      .filter(
        (release) => !release.prerelease && release.tag_name && release.body && (release.draft || release.published_at)
      )
      .map((release) => {
        const isUpcoming = release.draft;
        let finalDate = 'N/A';
        const changes: { [category: string]: string[] } = {};
        let dateFoundInBody = false;
        let isVisibleWhenUpcoming = false;

        if (release.published_at) {
          finalDate = formatDateDDMMYYYY(release.published_at.substring(0, 10));
        }

        if (release.body) {
          const lines = release.body.split(/\r?\n/);
          const dateRegex = /^DATUM:\s*\(([^)]+)\)/i;
          const categoryRegex = /^\[\s*(FEATURE|BUGFIX|IMPROVEMENT)\s*\]\s*(.*)/i;
          const upcomingVisibleRegex = /^UPCOMING_VISIBLE:\s*\((true|false)\)/i;

          for (const line of lines) {
            const dateMatch = line.match(dateRegex);
            const categoryMatch = line.match(categoryRegex);
            const upcomingVisibleMatch = line.match(upcomingVisibleRegex);
            const trimmedLine = line.trim();

            if (dateMatch && dateMatch[1]) {
              const potentialDate = dateMatch[1].trim();
              if (/^\d{2}-\d{2}-\d{4}$/.test(potentialDate)) {
                finalDate = potentialDate;
                dateFoundInBody = true;
              } else {
                logger.warn(
                  `Changelogs-Controller: Date found in DATUM line for release ${release.tag_name} is not in DD-MM-YYYY format: ${potentialDate}.`
                );
              }
            } else if (upcomingVisibleMatch && upcomingVisibleMatch[1]) {
              isVisibleWhenUpcoming = upcomingVisibleMatch[1].toLowerCase() === 'true';
            } else if (categoryMatch && categoryMatch[1] && categoryMatch[2]) {
              let category = categoryMatch[1].toUpperCase().trim();
              if (category === 'BUGFIX') category = 'BUG FIXES';
              if (category === 'FEATURE') category = 'FEATURES';

              let message = categoryMatch[2].trim();
              if (message) {
                if (!changes[category]) {
                  changes[category] = [];
                }
                // Apply URL linkification first
                message = linkifyUrls(message);
                // Then apply issue linkification if repo is configured
                if (repoFull) {
                  message = linkifyIssueReferences(message, repoFull);
                }
                changes[category].push(message);
              }
            } else if (trimmedLine.length > 0) {
              const category = 'OTHER';
              if (!changes[category]) {
                changes[category] = [];
              }
              // Apply URL linkification to 'OTHER' lines as well
              let processedLine = linkifyUrls(trimmedLine);
              // Apply issue linkification if applicable
              if (repoFull) {
                processedLine = linkifyIssueReferences(processedLine, repoFull);
              }
              changes[category].push(processedLine);
            }
          }
        }

        if (isUpcoming && finalDate === 'N/A' && !dateFoundInBody) {
          finalDate = 'Upcoming';
        }

        if (!isUpcoming && finalDate === 'N/A' && !dateFoundInBody) {
          logger.warn(`Changelogs-Controller: No valid date found for non-draft release ${release.tag_name}.`);
        }

        return {
          version: release.tag_name,
          date: finalDate,
          changes: changes,
          upcomingRelease: isUpcoming,
          isVisibleWhenUpcoming: isVisibleWhenUpcoming
        };
      });

    return githubChangelogs;
  } catch (githubErr) {
    const errorToLog =
      githubErr instanceof Error ? githubErr : new Error(`Unknown error during GitHub fetch: ${String(githubErr)}`);
    logger.error('Changelogs-Controller: Failed to fetch releases from GitHub', errorToLog);
    return null;
  }
}

export const getLastVersion: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();

  // Check cache first
  if (cachedLatestVersion && Date.now() < cachedLatestVersion.expires) {
    logger.info('Changelogs-Controller(getLastVersion): Returning cached version.');
    res.json({ latestVersion: cachedLatestVersion.version });

    logSuccess(req, {
      action: 'GET_LAST_VERSION',
      resourceType: ResourceType.CHANGELOGS,
      metadata: {
        source: 'Cache',
        version: cachedLatestVersion.version,
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });
    return; // Return cached version
  }

  // Cache invalid or expired, proceed to fetch
  logger.info('Changelogs-Controller(getLastVersion): Cache miss or expired, fetching from GitHub.');
  let latestVersionString: string | null = null;
  let source: 'GitHub' | 'Local' | 'None' = 'None';

  try {
    // Attempt to fetch from GitHub first
    const githubChangelogs = await fetchGithubChangelogs();

    if (githubChangelogs && githubChangelogs.length > 0) {
      const publishedReleases = githubChangelogs.filter((entry) => !entry.upcomingRelease);

      if (publishedReleases.length > 0) {
        source = 'GitHub';
        logger.info('Changelogs-Controller(getLastVersion): Found published releases on GitHub.');
        publishedReleases.sort((a, b) =>
          b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
        );
        latestVersionString = publishedReleases[0].version;
      } else {
        logger.info('Changelogs-Controller(getLastVersion): No published releases found on GitHub, checking local.');
      }
    } else if (githubChangelogs === null) {
      logger.warn('Changelogs-Controller(getLastVersion): Failed to fetch from GitHub, checking local.');
    } else {
      logger.info('Changelogs-Controller(getLastVersion): No releases found on GitHub, checking local.');
    }

    // Fallback to local files if GitHub fetch failed or yielded no published version
    if (!latestVersionString) {
      logger.info('Changelogs-Controller(getLastVersion): Attempting to read local changelogs.');
      const localChangelogs = await readLocalChangelogs();

      if (localChangelogs.length > 0) {
        source = 'Local';
        // Filter out any potential "upcoming" entries if they exist in local format (though unlikely based on current structure)
        const publishedLocal = localChangelogs.filter((entry) => !entry.upcomingRelease);
        if (publishedLocal.length > 0) {
          logger.info('Changelogs-Controller(getLastVersion): Found local changelogs.');
          publishedLocal.sort((a, b) =>
            b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
          );
          latestVersionString = publishedLocal[0].version;
        } else {
          logger.info('Changelogs-Controller(getLastVersion): No published local changelogs found.');
        }
      } else {
        logger.warn('Changelogs-Controller(getLastVersion): No local changelogs found.');
      }
    }

    // Update cache if a version was found from any source
    if (latestVersionString) {
      cachedLatestVersion = {
        version: latestVersionString,
        expires: Date.now() + CACHE_DURATION_MS
      };
      logger.info(`Changelogs-Controller(getLastVersion): Cached new version: ${latestVersionString} from ${source}.`);

      // Return only the version string
      res.json({ latestVersion: latestVersionString });

      logSuccess(req, {
        action: 'GET_LAST_VERSION',
        resourceType: ResourceType.CHANGELOGS,
        metadata: {
          source: source,
          version: latestVersionString,
          executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
        }
      });
    } else {
      res.status(404).json({ error: 'No published version found from GitHub or local files.' });
      logger.warn('Changelogs-Controller(getLastVersion): No published version could be determined from any source.');
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error occurred during last version retrieval');
    logger.error('Changelogs-Controller(getLastVersion): Failed to get last version', error);

    logError(req, {
      action: 'GET_LAST_VERSION',
      resourceType: ResourceType.CHANGELOGS,
      error,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    handleError(error, res);
  }
};

export const getAllChangeLogs: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  let changelogs: ChangelogEntry[] = [];
  let source: 'GitHub' | 'Local' | 'None' = 'None';

  try {
    const githubChangelogs = await fetchGithubChangelogs();

    if (githubChangelogs !== null && githubChangelogs.length > 0) {
      changelogs = githubChangelogs;
      source = 'GitHub';
      logger.info('Changelogs-Controller: Successfully fetched changelogs from GitHub.');
    } else {
      if (githubChangelogs === null) {
        logger.warn('Changelogs-Controller: GitHub fetch failed or not configured, falling back to local files.');
      } else {
        logger.info('Changelogs-Controller: No valid releases found on GitHub, falling back to local files.');
      }
      changelogs = await readLocalChangelogs();
      if (changelogs.length > 0) {
        source = 'Local';
        logger.info('Changelogs-Controller: Successfully read changelogs from local files.');
      } else {
        logger.warn('Changelogs-Controller: No changelogs found from GitHub or local files.');
      }
    }

    changelogs.sort((a, b) => b.version.localeCompare(a.version));

    res.json({ changelogs, source });

    logSuccess(req, {
      action: 'GET_CHANGELOGS',
      resourceType: ResourceType.CHANGELOGS,
      metadata: {
        source: source,
        count: changelogs.length,
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }

    const error = err instanceof Error ? err : new Error('Unknown error occurred during changelog retrieval');
    logger.error('Changelogs-Controller: Failed to get changelogs', error);

    logError(req, {
      action: 'GET_CHANGELOGS',
      resourceType: ResourceType.CHANGELOGS,
      error,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    handleError(error, res);
  }
};
