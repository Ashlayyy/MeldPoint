import createSecureRouter from '../utils/secureRoute';
import validateGithubWebhook from '../middleware/github-webhook.middleware';
import processWebhook from '../modules/GitHubWebhook/controller/GitHubWebhookController';

const router = createSecureRouter();

router.post('/webhook', validateGithubWebhook, processWebhook);

export default router;
