import 'dotenv/config';

export default function morganFormat(): string {
  if (process.env.NODE_ENV === 'testing') {
    return `:status :method :url :response-time ms
              Date: :date[web]
              User Agent: :user-agent
              Length: :res[content-length]
              `;
  }

  if (process.env.NODE_ENV === 'production') {
    return `common`;
  }

  return 'dev';
}
