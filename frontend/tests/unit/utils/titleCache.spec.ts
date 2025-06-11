import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Import the object under test
import { titleCacheManager } from '@/utils/titleCache';

describe('titleCacheManager', () => {
  const meldingId = 'testMelding123';
  const categoryId = 'testCategory456'; // Can be same as meldingId or different based on usage

  beforeEach(() => {
    // Clear mocks and localStorage store before each test
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Titles and Selected Index', () => {
    const titlesCacheKey = 'generatedTitles';

    it('should return empty array and -1 index if cache is empty for getCachedData', () => {
      const result = titleCacheManager.getCachedData(meldingId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(titlesCacheKey);
      expect(result).toEqual({ titles: [], selectedIndex: -1 });
    });

    it('should return empty array if cache is empty for getCachedTitles', () => {
      const result = titleCacheManager.getCachedTitles(meldingId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(titlesCacheKey);
      expect(result).toEqual([]);
    });

    it('should save a title to an empty cache', () => {
      const title = 'First Title';
      titleCacheManager.saveTitleToCache(meldingId, title);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        titlesCacheKey,
        JSON.stringify({ [meldingId]: { titles: [title], selectedIndex: -1 } })
      );
    });

    it('should append a title to an existing cache entry', () => {
      const title1 = 'First Title';
      const title2 = 'Second Title';
      const initialCache = { [meldingId]: { titles: [title1], selectedIndex: 0 } };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialCache));

      titleCacheManager.saveTitleToCache(meldingId, title2);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        titlesCacheKey,
        JSON.stringify({ [meldingId]: { titles: [title1, title2], selectedIndex: 0 } })
      );
    });

    it('should retrieve cached data correctly', () => {
      const title1 = 'Cached Title 1';
      const title2 = 'Cached Title 2';
      const selectedIndex = 1;
      const cacheData = { [meldingId]: { titles: [title1, title2], selectedIndex: selectedIndex } };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const result = titleCacheManager.getCachedData(meldingId);
      expect(result).toEqual({ titles: [title1, title2], selectedIndex: selectedIndex });
    });

    it('should retrieve cached titles correctly', () => {
      const title1 = 'Cached Title A';
      const title2 = 'Cached Title B';
      const cacheData = { [meldingId]: { titles: [title1, title2], selectedIndex: 0 } };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const result = titleCacheManager.getCachedTitles(meldingId);
      expect(result).toEqual([title1, title2]);
    });

    it('should save the selected index for an existing entry', () => {
      const title1 = 'Title X';
      const newIndex = 0;
      const initialCache = { [meldingId]: { titles: [title1], selectedIndex: -1 } };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(initialCache));

      titleCacheManager.saveSelectedIndex(meldingId, newIndex);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        titlesCacheKey,
        JSON.stringify({ [meldingId]: { titles: [title1], selectedIndex: newIndex } })
      );
    });

    it('should not save selected index if meldingId does not exist in cache', () => {
      const newIndex = 0;
      // Cache is initially empty
      localStorageMock.getItem.mockReturnValueOnce(null);

      titleCacheManager.saveSelectedIndex(meldingId, newIndex);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Categories', () => {
    it('should return null for categories if cache is empty', () => {
      const categoryKey = `category_${categoryId}`;
      const result = titleCacheManager.getCachedCategories(categoryId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(categoryKey);
      expect(result).toBeNull();
    });

    it('should save a category to an empty cache and return it in an array', () => {
      const category = 'Bug';
      const categoryKey = `category_${categoryId}`;

      const result = titleCacheManager.saveCategoryToCache(categoryId, category);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(categoryKey, JSON.stringify([category]));
      expect(result).toEqual([category]);
    });

    it('should append a category to existing categories', () => {
      const category1 = 'Bug';
      const category2 = 'Feature';
      const categoryKey = `category_${categoryId}`;
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([category1]));

      const result = titleCacheManager.saveCategoryToCache(categoryId, category2);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(categoryKey, JSON.stringify([category1, category2]));
      expect(result).toEqual([category1, category2]);
    });

    it('should retrieve cached categories correctly', () => {
      const category1 = 'UI';
      const category2 = 'UX';
      const categoryKey = `category_${categoryId}`;
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([category1, category2]));

      const result = titleCacheManager.getCachedCategories(categoryId);
      expect(result).toEqual([category1, category2]);
    });
  });
});
