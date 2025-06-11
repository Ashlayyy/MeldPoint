import { computed, type ComputedRef, type Ref } from 'vue';
interface Release {
  version: string;
}

type PublishedReleasesRef = Ref<Release[]>;

const compareVersions = (v1: string, v2: string): number => {
  const formatVersion = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const parts1 = formatVersion(v1);
  const parts2 = formatVersion(v2);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

// Composable function
export function useChangelogVersion(publishedReleases: PublishedReleasesRef): {
  currentVersion: ComputedRef<string>;
} {
  const currentVersion = computed(() => {
    const latestPublished = publishedReleases.value.length > 0 ? publishedReleases.value[0] : null;
    const githubVersion = latestPublished ? latestPublished.version : '0.0.0';
    const packageVersion = (import.meta.env.PACKAGE_VERSION as string | undefined) || '0.0.0';

    if (compareVersions(packageVersion, githubVersion) >= 0) {
      return packageVersion;
    } else {
      return githubVersion;
    }
  });

  return {
    currentVersion
  };
}
