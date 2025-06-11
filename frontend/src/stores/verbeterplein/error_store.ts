import { defineStore } from 'pinia';

interface ErrorOptions {
  message: string;
  error?: any;
}

export const useErrorStore = defineStore('error', {
  state: () => ({
    errors: [] as ErrorOptions[]
  }),

  actions: {
    error(options: ErrorOptions) {
      console.error(options.message, options.error);
      this.errors.push(options);
    },

    info(options: ErrorOptions) {
      console.info(options.message, options.error);
    },

    success(options: ErrorOptions) {
      console.log(options.message, options.error);
    },

    warning(options: ErrorOptions) {
      console.warn(options.message, options.error);
    },

    clearErrors() {
      this.errors = [];
    }
  }
});
