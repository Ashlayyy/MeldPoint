import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetHistory } from '@/API/history';
import { useNotificationStore } from './notification_store';
import { detectChanges } from '@/utils/changeDetector';
const notification = useNotificationStore();

interface HistoryItem {
  // User information
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  department?: string;
  ipAddress?: string;
  userAgent?: string;

  // Action information
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  endpoint?: string;
  method?: string;

  id: string;

  // State changes
  previousState?: string;
  newState?: string;
  changedFields?: string;

  // Additional information
  metadata?: any;
  errorMessage?: string;

  // Request information
  sessionId?: string;
  requestBody?: string;
  requestQuery?: string;
  requestParams?: string;

  // Computed fields for display
  timestamp: string;
  color?: string;
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    currentHistory: [] as HistoryItem[],
    loading: false
  }),

  actions: {
    async getHistory(meldingId: string, preventiefId?: string, correctiefId?: string) {
      this.loading = true;
      try {
        if (!meldingId) {
          this.currentHistory = [];
          return;
        }

        const response = await GetHistory(meldingId, preventiefId, correctiefId);
        if (response.status === 200) {
          this.currentHistory = response.data
            .filter((item: any) => {
              const excludeActions =
                import.meta.env.VITE_ENABLE_ADVANCED_HISTORY === 'true'
                  ? []
                  : [
                      'GET_SYSTEM_LOGS',
                      'GET_SINGLE_REPORT',
                      'GET_SINGLE_REPORT_BY_VOLGNUMMER',
                      'GET_SINGLE_PREVENTIEF',
                      'GET_SINGLE_CORRECTIEF'
                    ];

              return !excludeActions.some((action) => item.action.includes(action));
            })
            .map((item: any) => ({
              id: item.id,
              userId: item.userId,
              userEmail: item.userEmail,
              userName: item.userName,
              userRole: item.userRole,
              department: item.department,
              ipAddress: item.ipAddress,
              userAgent: item.userAgent,
              action: item.action,
              resourceType: item.resourceType,
              resourceId: item.resourceId,
              success: item.success,
              endpoint: item.endpoint,
              method: item.method,
              previousState: item.previousState,
              newState: item.newState,
              changedFields: item.changedFields,
              metadata: item.metadata,
              errorMessage: item.errorMessage,
              sessionId: item.sessionId,
              requestBody: item.requestBody,
              requestQuery: item.requestQuery,
              requestParams: item.requestParams,
              timestamp: item.timestamp,
              color: this.getActionColor(item.action)
            }));
          return this.currentHistory;
        } else if (response?.status === 404 || response.length === 0) {
          this.currentHistory = [];
          return this.currentHistory;
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error }) });
        this.currentHistory = [];
      } finally {
        this.loading = false;
      }
    },

    getActionColor(action: string): string {
      const colorMap: Record<string, string> = {
        CREATE: 'primary',
        UPDATE: 'info',
        DELETE: 'error',
        ARCHIVE: 'warning',
        STATUS_CHANGE: 'success',
        ADD_CORRESPONDENCE: 'secondary',
        REMOVE_CORRESPONDENCE: 'error',
        ADD_COMMENT: 'info',
        default: 'grey'
      };
      const color = Object.keys(colorMap).find((key) => action.includes(key))
        ? colorMap[Object.keys(colorMap).find((key) => action.includes(key)) as string]
        : colorMap.default;
      return color;
    },

    getActionDetails(item: HistoryItem): string {
      // Helper function to format values consistently
      const formatValue = (value: any) => {
        if (value === '') return t('verbeterplein.showItem.timeline.details.empty');
        if (value === null || value === undefined) return t('verbeterplein.showItem.timeline.details.empty');

        // Handle boolean values
        if (typeof value === 'boolean') {
          return value ? t('general.yes') : t('general.no');
        }

        if (typeof value === 'object' && value !== null) {
          if (value.Name) return value.Name;
          if (value.ID) return value.ID;
          if (value.id) return value.id;
          return JSON.stringify(value);
        }

        // --- Add date handling ---
        if (typeof value === 'string') {
          // Basic check for ISO 8601 format (adjust regex if needed)
          const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
          const isPotentiallyDate = isoDateRegex.test(value);
          if (isPotentiallyDate) {
            try {
              const date = new Date(value);
              const isValidDate = !isNaN(date.getTime());
              // Check if the date is valid after parsing
              if (isValidDate) {
                // Format date and time according to locale
                // You can customize the options further if needed
                const options: Intl.DateTimeFormatOptions = {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false // Use 24-hour format
                };
                return date.toLocaleString(undefined, options); // Use user's locale
              }
            } catch (e) {
              // Ignore parsing errors, fall through to default return
              console.warn('Could not parse potential date string:', value, e);
            }
          }
        }
        // --- End date handling ---

        return value;
      };

      // Special handling for correspondence actions
      if (item.action.toLowerCase().includes('correspondence')) {
        try {
          if (item.newState) {
            const newState = JSON.parse(item.newState);

            // Check for empty correspondence
            if (newState.CorrespondenceIDs?.IDs === '[]' && item.action.toLowerCase().includes('remove')) {
              return t('verbeterplein.showItem.timeline.details.removed_all');
            }

            const IDs = JSON.parse(newState.CorrespondenceIDs?.IDs);

            if (IDs.length > 0) {
              const fileNames = IDs.map((file: any) => file.Name || file.name).filter(Boolean);

              if (item.action.toLowerCase().includes('add')) {
                return `${t('verbeterplein.showItem.timeline.details.added')}: ${fileNames.join(', ')}`;
              } else if (item.action.toLowerCase().includes('remove')) {
                return `${t('verbeterplein.showItem.timeline.details.removed')}: ${fileNames.join(', ')}`;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing correspondence details:', error);
        }
      }

      // --- New logic: Try parsing changedFields as detailed JSON first ---
      if (item.changedFields) {
        try {
          const changes = JSON.parse(item.changedFields);
          // Check if it's the expected array structure
          if (Array.isArray(changes) && changes.length > 0 && changes[0].key && changes[0].newValue !== undefined) {
            return changes
              .map((change: any) => {
                // Use displayName if available, otherwise fallback to key
                const fieldName = change.displayName || change.key || 'Unknown Field';
                // Format the new value
                const newValueFormatted = formatValue(change.newValue);
                // You might want to add oldValue here if it becomes available in the JSON
                // For now, just showing the field and its new value
                return `${fieldName}: ${newValueFormatted}`;
              })
              .join('\n'); // Join changes with newline
          }
        } catch (e) {
          console.warn('Could not parse changedFields as JSON:', item.changedFields, e);
        }
      }
      if (item.errorMessage) {
        return `${t('verbeterplein.showItem.timeline.details.error')}: ${item.errorMessage}`;
      }

      // Fallback: Try detecting changes between previous and new state
      if (item.previousState && item.newState) {
        try {
          const changes = detectChanges(JSON.parse(item.previousState), JSON.parse(item.newState));
          if (changes.length > 0) {
            return changes
              .filter((change) => {
                return (
                  change.field !== 'UpdatedAt' &&
                  change.field !== 'CreatedAt' &&
                  change.field !== 'id' &&
                  change.oldValue !== change.newValue &&
                  change.oldValue !== null &&
                  change.newValue !== undefined
                );
              })
              .map((change) => {
                const field = change.field.replace(/([A-Z][a-z])/g, ' $1').trim();

                // Use the hoisted formatValue function
                const oldVal = formatValue(change.oldValue);
                const newVal = formatValue(change.newValue);

                return `${field}: ${oldVal} → ${newVal}`;
              })
              .join('\n');
          }
        } catch (error) {
          return t('verbeterplein.showItem.timeline.details.unable_to_parse');
        }
      }
      return '';
    }
  }
});
