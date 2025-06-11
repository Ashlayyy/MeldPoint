type LogLevel = 'log' | 'error' | 'warn' | 'info';

export default function debug(namespace: string, level: LogLevel = 'log') {
  const prefix = `[${namespace}]`;

  return (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console[level](prefix, ...args);
    }
  };
}
