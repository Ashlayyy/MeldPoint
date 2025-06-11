interface Config {
  github: {
    repoFull: string | undefined;
    username: string | undefined;
    apiKey: string | undefined;
    repo: string | undefined;
    webhookSecret: string | undefined;
  };
  ai: {
    apiKey: string | undefined;
    model: string | undefined;
  };
}

export default <Config>{
  github: {
    repoFull: process.env.USE_PROD_GITHUB === 'true' ? process.env.PROD_GITHUB_REPO_FULL : process.env.GITHUB_REPO_FULL,
    username: process.env.USE_PROD_GITHUB === 'true' ? process.env.PROD_GITHUB_USERNAME : process.env.GITHUB_USERNAME,
    apiKey: process.env.USE_PROD_GITHUB === 'true' ? process.env.PROD_GITHUB_API_KEY : process.env.GITHUB_API_KEY,
    repo: process.env.USE_PROD_GITHUB === 'true' ? process.env.PROD_GITHUB_REPO : process.env.GITHUB_REPO,
    webhookSecret:
      process.env.USE_PROD_GITHUB === 'true'
        ? process.env.PROD_GITHUB_WEBHOOK_SECRET
        : process.env.GITHUB_WEBHOOK_SECRET
  },
  ai: {
    apiKey: process.env.AI_API_KEY as string,
    model: process.env.AI_MODEL as string
  }
};
