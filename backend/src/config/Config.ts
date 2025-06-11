import IConfig from '../types/IConfig';

const config: IConfig = {
  request: {
    rateLimit: {
      window: 15 * 60 * 1000,
      max: 4000
    },
    slowDown: {
      window: 15 * 60 * 1000,
      delayAfter: 1000,
      delayMs: 150
    }
  }
};

export default config;
