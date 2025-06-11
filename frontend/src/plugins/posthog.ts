import 'posthog-js/dist/recorder';
import 'posthog-js/dist/surveys';
import 'posthog-js/dist/exception-autocapture';
import 'posthog-js/dist/tracing-headers';
import 'posthog-js/dist/web-vitals';
import posthog from 'posthog-js/dist/module.no-external';

function postHog() {
  if (import.meta.env.DEV) {
    console.log('PostHog is disabled in development mode');
    return;
  }
  posthog.init(import.meta.env.VITE_POSTHOG_KEY as string, {
    api_host: import.meta.env.VITE_POSTHOG_HOST as string,
    capture_pageview: false,
    enable_recording_console_log: true
  });

  return posthog;
}

export default postHog();
