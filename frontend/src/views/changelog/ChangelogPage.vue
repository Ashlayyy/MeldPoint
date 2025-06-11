<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import DOMPurify from 'dompurify';
import { useChangelogStore } from '@/stores/verbeterplein/changelog';
import { hasPermission, type Permission } from '@/utils/permission';
import { useChangelogVersion } from '@/composables/useChangelogVersion';

const changelogStore = useChangelogStore();

const { changelogs, isLoading, error, source } = storeToRefs(changelogStore);

onMounted(() => {
  if (changelogs.value.length === 0 && !isLoading.value && !error.value) {
    changelogStore.fetchChangelogs();
  }
});

const linkViewPermission: Permission[] = [{ action: 'manage', resourceType: 'all' }];

const sanitizeHtml = (html: string): string => {
  let processedHtml = '';
  let canViewLinks = false;

  try {
    canViewLinks = hasPermission(linkViewPermission);

    DOMPurify.addHook('afterSanitizeElements', (node) => {
      if (node instanceof Element) {
        if (!canViewLinks && node.tagName === 'A' && !node.classList.contains('link-view')) {
          const textNode = document.createTextNode(node.textContent || '');
          node.parentNode?.replaceChild(textNode, node);
        }
      }
    });
    processedHtml = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  } catch (error) {
    console.error('Error during HTML sanitization or permission check:', error);
    processedHtml = html;
  } finally {
    DOMPurify.removeHook('afterSanitizeElements');
  }

  return processedHtml;
};

const publishedReleases = computed(() => {
  return changelogs.value.filter((release) => !(release as any).upcomingRelease);
});

const draftReleases = computed(() => {
  return changelogs.value.filter(
    (release) => ((release as any).upcomingRelease && (release as any).isVisibleWhenUpcoming === true) ?? false
  );
});

const { currentVersion } = useChangelogVersion(publishedReleases as any);
</script>

<template>
  <div class="changelog-page">
    <h1>
      Changelog
      <span v-if="source" class="source-chip">{{ source }}</span>
      <span class="current-version-display" v-if="currentVersion !== 'N/A'">Current Version: {{ currentVersion }}</span>
    </h1>

    <p v-if="isLoading" class="loading-message">Loading changelogs...</p>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="changelogStore.fetchChangelogs">Retry Fetch</button>
    </div>

    <div v-else>
      <!-- Upcoming Releases Section -->
      <div v-if="draftReleases.length > 0" class="upcoming-releases">
        <h2>Upcoming Releases</h2>
        <div v-for="release in draftReleases" :key="release.version + '-draft'" class="release-card draft-card">
          <h2>
            {{ release.version }} <span class="draft-badge">(Upcoming)</span>
            <span v-if="release.date"> - {{ release.date }}</span>
          </h2>
          <!-- Handle Object structure (original) -->
          <div v-if="typeof release.changes === 'object' && !Array.isArray(release.changes) && release.changes !== null">
            <div
              v-for="([category, changesInCategory], catIndex) in Object.entries(release.changes)"
              :key="catIndex"
              class="category-section"
            >
              <h3 class="category-title">
                <span v-if="category.toUpperCase() === 'FEATURES'">✨</span>
                <span v-else-if="category.toUpperCase() === 'BUG FIXES'">🐛</span>
                <span v-else-if="category.toUpperCase() === 'IMPROVEMENTS'">🚀</span>
                <span v-else-if="category.toUpperCase() === 'REFACTORING'">🔧</span>
                <span v-else-if="category.toUpperCase() === 'TESTS'">🧪</span>
                <span v-else>📄</span> {{ category }}
              </h3>
              <ul>
                <li v-for="(change, changeIndex) in changesInCategory" :key="changeIndex" v-html="sanitizeHtml(change)"></li>
              </ul>
              <br />
            </div>
          </div>
          <!-- Handle Array structure -->
          <div v-else-if="Array.isArray(release.changes)" class="category-section">
            <h3 class="category-title">📄 Changes</h3>
            <ul>
              <li v-for="(change, changeIndex) in release.changes" :key="changeIndex" v-html="sanitizeHtml(change)"></li>
            </ul>
            <br />
          </div>
          <!-- Handle potential other cases or null/undefined changes -->
          <div v-else class="category-section">
            <p>No changes listed for this release.</p>
          </div>
        </div>
      </div>

      <!-- Published Releases Timeline -->
      <div v-if="publishedReleases.length > 0" class="timeline-container">
        <div
          v-for="release in publishedReleases"
          :key="release.version"
          class="release-card"
          :class="{ 'current-version': release.version === currentVersion }"
        >
          <h2>
            {{ release.version }} <span v-if="release.date">- {{ release.date }}</span>
          </h2>
          <!-- Handle Object structure (original) -->
          <div v-if="typeof release.changes === 'object' && !Array.isArray(release.changes) && release.changes !== null">
            <div
              v-for="([category, changesInCategory], catIndex) in Object.entries(release.changes)"
              :key="catIndex"
              class="category-section"
            >
              <h3 class="category-title">
                <span v-if="category.toUpperCase() === 'FEATURES'">✨</span>
                <span v-else-if="category.toUpperCase() === 'BUG FIXES'">🐛</span>
                <span v-else-if="category.toUpperCase() === 'IMPROVEMENTS'">🚀</span>
                <span v-else-if="category.toUpperCase() === 'REFACTORING'">🔧</span>
                <span v-else-if="category.toUpperCase() === 'TESTS'">🧪</span>
                <span v-else>📄</span> {{ category }}
              </h3>
              <ul>
                <li v-for="(change, changeIndex) in changesInCategory" :key="changeIndex" v-html="sanitizeHtml(change)"></li>
              </ul>
              <br />
            </div>
          </div>
          <!-- Handle Array structure -->
          <div v-else-if="Array.isArray(release.changes)" class="category-section">
            <h3 class="category-title">📄 Changes</h3>
            <ul>
              <li v-for="(change, changeIndex) in release.changes" :key="changeIndex" v-html="sanitizeHtml(change)"></li>
            </ul>
            <br />
          </div>
          <!-- Handle potential other cases or null/undefined changes -->
          <div v-else class="category-section">
            <p>No changes listed for this release.</p>
          </div>
        </div>
      </div>

      <!-- Message if no releases of either type -->
      <p v-if="publishedReleases.length === 0 && draftReleases.length === 0" class="no-entries">No changelog entries found.</p>
    </div>
  </div>
</template>

<style scoped>
.changelog-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: sans-serif;
  color: #333;
}

h1 {
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 30px;
  text-align: center;
}

.source-chip {
  display: inline-block;
  margin-left: 10px;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: #e0e0e0;
  color: #555;
  font-size: 0.75em;
  font-weight: bold;
  vertical-align: middle;
  text-transform: capitalize;
}

.loading-message,
.error-message,
.no-entries {
  text-align: center;
  margin-top: 20px;
}

.error-message {
  color: red;
  padding: 15px;
  border: 1px solid red;
  background-color: #ffebeb;
  border-radius: 4px;
  display: inline-block;
  margin: 20px auto;
}

.error-message button {
  margin-left: 10px;
  padding: 5px 10px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.timeline-container {
  position: relative;
  padding-left: 40px; /* Space for the timeline line and circles */
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 15px; /* Position of the vertical line */
  width: 2px;
  background-color: #e0e0e0; /* Color of the timeline line */
}

.release-card {
  background-color: #f9f9f9; /* Card background color */
  border: 1px solid #ddd; /* Card border */
  border-radius: 8px; /* Rounded corners for cards */
  padding: 20px;
  margin-bottom: 30px;
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Optional shadow */
  margin-left: 20px; /* Push card slightly away from the line */
}

.release-card::before {
  content: '';
  position: absolute;
  top: 25px; /* Align circle with the top part of the card */
  left: -33px; /* Position circle on the timeline line */
  width: 14px; /* Circle size */
  height: 14px; /* Circle size */
  background-color: #007bff; /* Circle color */
  border: 3px solid #fff; /* White border to stand out */
  border-radius: 50%; /* Make it a circle */
  z-index: 1; /* Ensure circle is above the line */
}

.release-card h2 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 1.3em;
  border-bottom: 1px dashed #eee;
  padding-bottom: 10px;
}

.category-section {
  margin-top: 15px;
}

.category-title {
  font-size: 1.1em;
  margin-bottom: 10px;
  color: #555;
  text-transform: capitalize;
}

.category-title span:first-child {
  margin-right: 8px;
}

.release-card h2 span {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
}

.release-card ul {
  list-style: disc;
  padding-left: 20px;
  margin-bottom: 0;
}

.release-card li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.release-card li:last-child {
  margin-bottom: 0;
}

/* Styles for Current Version Display */
.current-version-display {
  display: block;
  font-size: 0.8em;
  color: #555;
  text-align: center;
  margin-bottom: 20px;
}

/* Styles for Upcoming Releases Section */
.upcoming-releases {
  margin-bottom: 40px;
  padding: 15px;
  background-color: #f0f8ff; /* Light blue background */
  border: 1px solid #cce5ff;
  border-radius: 8px;
}

.upcoming-releases h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 20px;
  color: #0056b3;
}

.draft-card {
  background-color: #fff; /* White background for contrast */
  border: 1px solid #eee;
  box-shadow: none; /* Less prominent than published */
  margin-left: 0; /* No timeline indent */
}

.draft-card::before {
  display: none; /* No timeline circle for drafts */
}

.draft-badge {
  display: inline-block;
  margin-left: 5px;
  padding: 2px 6px;
  font-size: 0.75em;
  font-weight: bold;
  background-color: #ffc107; /* Amber color */
  color: #333;
  border-radius: 4px;
  vertical-align: middle;
}

/* Styles for Highlighting Current Version in Timeline */
.release-card.current-version {
  border-color: #007bff; /* Blue border */
  background-color: #e7f3ff; /* Lighter blue background */
}

.release-card.current-version::before {
  background-color: #ff5722; /* Distinct color (e.g., Orange) for current version circle */
  border-color: #fff;
}
</style>
