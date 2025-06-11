import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Breadcrumb {
  title: string;
  href: string;
}

export const usePageStore = defineStore('page', () => {
  const title = ref('');
  const breadcrumbs = ref<Breadcrumb[]>([]);

  function setPageInfo(pageTitle: string, pageBreadcrumbs: Breadcrumb[] = []) {
    title.value = pageTitle;
    breadcrumbs.value = pageBreadcrumbs;
  }

  return {
    title,
    breadcrumbs,
    setPageInfo,
  };
}); 