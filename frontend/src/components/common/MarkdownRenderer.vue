<template>
  <div class="markdown-renderer">
    <div v-html="renderedContent" class="markdown-body"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps<{
  content: string;
}>();

const renderedContent = ref('');

const renderMarkdown = async (content: string) => {
  // First replace all single line breaks with <br> tags, but preserve double line breaks for paragraphs
  const preprocessed = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{2,}/g, '§PARAGRAPH§') // Temporarily preserve paragraphs
    .replace(/\n/g, '<br>') // Replace single line breaks
    .replace(/§PARAGRAPH§/g, '\n\n'); // Restore paragraphs

  const rawHtml = await marked(preprocessed || '', {
    breaks: true, // Enable line breaks
    gfm: true // Enable GitHub Flavored Markdown
  });

  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'del',
      'input' // For task lists
    ],
    ALLOWED_ATTR: ['href', 'src', 'class', 'target', 'type', 'checked', 'disabled']
  });
};

watch(
  () => props.content,
  async (newContent) => {
    renderedContent.value = await renderMarkdown(newContent);
  },
  { immediate: true }
);
</script>

<style scoped>
.markdown-renderer {
  font-size: 0.9rem;
  line-height: 1.6;
}

:deep(.markdown-body) {
  overflow-wrap: break-word;
}

:deep(.markdown-body pre) {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}

:deep(.markdown-body code) {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  margin: 1rem 0;
  padding: 0.5rem 0 0.5rem 1rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 0 4px 4px 0;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin: 1rem 0;
  border: 1px solid rgba(var(--v-border-color), 0.1);
}

:deep(.markdown-body a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

:deep(.markdown-body a:hover) {
  text-decoration: underline;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

:deep(.markdown-body li + li) {
  margin-top: 0.25rem;
}

:deep(.markdown-body li > p) {
  margin: 0.5rem 0;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  margin: 1.5rem 0 1rem;
  line-height: 1.3;
  font-weight: 600;
}

:deep(.markdown-body h1) {
  font-size: 2em;
}
:deep(.markdown-body h2) {
  font-size: 1.5em;
}
:deep(.markdown-body h3) {
  font-size: 1.25em;
}
:deep(.markdown-body h4) {
  font-size: 1em;
}
:deep(.markdown-body h5) {
  font-size: 0.875em;
}
:deep(.markdown-body h6) {
  font-size: 0.85em;
}

:deep(.markdown-body h1:first-child),
:deep(.markdown-body h2:first-child),
:deep(.markdown-body h3:first-child),
:deep(.markdown-body h4:first-child),
:deep(.markdown-body h5:first-child),
:deep(.markdown-body h6:first-child) {
  margin-top: 0;
}

:deep(.markdown-body p) {
  margin: 1rem 0;
}

:deep(.markdown-body p:first-child) {
  margin-top: 0;
}

:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-body table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  border: 1px solid rgba(var(--v-border-color), 0.1);
  padding: 0.5rem;
  text-align: left;
}

:deep(.markdown-body th) {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  font-weight: 600;
}

:deep(.markdown-body tr:nth-child(even)) {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}

:deep(.markdown-body hr) {
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), 0.1);
  margin: 1.5rem 0;
}

:deep(.markdown-body del) {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

:deep(.markdown-body input[type='checkbox']) {
  margin-right: 0.5rem;
}
</style>
