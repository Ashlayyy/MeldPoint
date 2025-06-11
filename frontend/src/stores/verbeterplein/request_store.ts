import { defineStore } from 'pinia';
import { debounce } from 'lodash';

const LOG_PREFIX = '🔄 [RequestStore]';
const LOG_STYLES = {
  request: 'color: #2196F3',
  cache: 'color: #4CAF50',
  error: 'color: #F44336',
  info: 'color: #9C27B0'
};

export const useRequestStore = defineStore('request', {
    state: () => ({
        pendingRequests: new Map<string, Promise<any>>()
    }),

    actions: {
        async executeRequest<T>(storeId: string, key: string, requestFn: () => Promise<T>): Promise<T> {
            const requestKey = `${storeId}-${key}`;
            if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Request attempted: ${requestKey}`, LOG_STYLES.info);
            
            const existingRequest = this.pendingRequests.get(requestKey);
            if (existingRequest) {
                if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Reusing existing request for: ${requestKey}`, LOG_STYLES.cache);
                return existingRequest as Promise<T>;
            }

            if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Starting new request for: ${requestKey}`, LOG_STYLES.request);
            
            const promise = requestFn()
                .then(result => {
                    if (import.meta.env.ENABLE_LOGGING) console.log(`${LOG_PREFIX} %c Request succeeded: ${requestKey}`, LOG_STYLES.request);
                    return result;
                })
                .catch(error => {
                    if (import.meta.env.ENABLE_LOGGING) console.error(`${LOG_PREFIX} %c Request failed: ${requestKey}`, LOG_STYLES.error, error);
                    throw error;
                })
                .finally(() => {
                    this.pendingRequests.delete(requestKey);
                    if (import.meta.env.ENABLE_LOGGING)  console.log(`${LOG_PREFIX} %c Request cleaned up: ${requestKey}`, LOG_STYLES.info);
                });

            this.pendingRequests.set(requestKey, promise);
            return promise;
        },

        createDebouncedFunction(key: string, fn: (...args: any[]) => any) {
            return debounce(fn, 1000, { leading: true });
        }
    }
});
