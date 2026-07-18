import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'telodije_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const cacheService = {
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const itemStr = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  async getKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(k => k.startsWith(CACHE_PREFIX))
        .map(k => k.replace(CACHE_PREFIX, ''));
    } catch (error) {
      console.error('Cache getKeys error:', error);
      return [];
    }
  },
};

// Cache keys
export const CACHE_KEYS = {
  QUINIELAS: 'quinielas',
  RANKINGS: 'rankings',
  PREDICTIONS: 'predictions',
  MATCHES: 'matches',
  USER_PROFILE: 'user_profile',
} as const;
