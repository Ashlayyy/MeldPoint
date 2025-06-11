export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}
export interface ResponseData {
  changelogs: ChangelogEntry[];
  source: string;
}
export interface ChangelogState {
  changelogs: ChangelogEntry[];
  isLoading: boolean;
  error: string | null;
}
