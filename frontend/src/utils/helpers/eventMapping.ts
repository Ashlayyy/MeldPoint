/**
 * Maps raw API event type strings to standardized translation keys.
 * Based on the keys defined in locales under `verbeterplein.showItem.engagement.eventTypes`.
 *
 * @param rawType - The raw event type string from the API (e.g., 'GET_TIMELINE', 'CREATE_REPORT', 'UPDATE_COMMENT').
 * @returns The corresponding translation key ('view', 'create', 'update', 'comment', 'other').
 */
export function mapEventTypeToKey(rawType: string): string {
  const lowerType = rawType.toLowerCase();
  console.log(lowerType);
  const mapping: { [key: string]: string } = {
    get_system_logs: 'view',
    get_single_report: 'view',
    get_single_report_by_volgnummer: 'open_url',
    get_single_correctief: 'view',
    get_single_preventief: 'check_pdca',
    create_report: 'create',
    create_preventief: 'create_preventief',
    update_report: 'update',
    update_correctief: 'update',
    update_preventief: 'update_preventief'
  };

  return mapping[lowerType] ?? 'other';
}
