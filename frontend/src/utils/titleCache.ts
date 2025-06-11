interface TitleCache {
  [meldingId: string]: {
    titles: string[];
    selectedIndex: number;
  };
}

export const titleCacheManager = {
  getCachedData(meldingId: string) {
    const cache = localStorage.getItem('generatedTitles');
    if (!cache) return { titles: [], selectedIndex: -1 };
    
    const titleCache: TitleCache = JSON.parse(cache);
    return titleCache[meldingId] || { titles: [], selectedIndex: -1 };
  },

  getCachedTitles(meldingId: string): string[] {
    const data = this.getCachedData(meldingId);
    return data.titles;
  },

  saveTitleToCache(meldingId: string, title: string): void {
    const cache = localStorage.getItem('generatedTitles');
    const titleCache: TitleCache = cache ? JSON.parse(cache) : {};
    
    if (!titleCache[meldingId]) {
      titleCache[meldingId] = { titles: [], selectedIndex: -1 };
    }
    titleCache[meldingId].titles.push(title);
    
    localStorage.setItem('generatedTitles', JSON.stringify(titleCache));
  },

  saveSelectedIndex(meldingId: string, index: number): void {
    const cache = localStorage.getItem('generatedTitles');
    const titleCache: TitleCache = cache ? JSON.parse(cache) : {};
    
    if (titleCache[meldingId]) {
      titleCache[meldingId].selectedIndex = index;
      localStorage.setItem('generatedTitles', JSON.stringify(titleCache));
    }
  },

  saveCategoryToCache(id: string, category: string) {
    const key = `category_${id}`;
    const existingCategories = this.getCachedCategories(id);
    const updatedCategories = [...(existingCategories || []), category];
    localStorage.setItem(key, JSON.stringify(updatedCategories));
    return updatedCategories;
  },

  getCachedCategories(id: string) {
    const key = `category_${id}`;
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  }
}; 