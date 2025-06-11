interface ChangeResult {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Compares two objects and returns only the fields that have changed
 * @param oldData The original preventief object
 * @param newData The new preventief object to compare against
 * @returns Array of changes, containing only the fields that are different
 */
export function detectChanges(oldData: Record<string, any>, newData: Record<string, any>): ChangeResult[] {
  const changes: ChangeResult[] = [];
  const keys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];

  for (const key of keys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if both values are undefined or null
    if (oldValue === undefined && newValue === undefined) continue;
    if (oldValue === null && newValue === null) continue;

    // Compare values
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      // Handle arrays - compare stringified versions to detect changes in nested objects
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        const oldJson = JSON.stringify(oldValue);
        const newJson = JSON.stringify(newValue);
        if (oldJson !== newJson) {
          changes.push({
            field: key,
            oldValue,
            newValue
          });
        }
      }
      // Handle nested objects
      else if (oldValue !== null && newValue !== null) {
        const nestedChanges = detectChanges(oldValue, newValue);
        if (nestedChanges.length > 0) {
          changes.push({
            field: key,
            oldValue,
            newValue
          });
        }
      }
      // Handle null cases
      else if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue,
          newValue
        });
      }
    }
    // Handle primitive values
    else if (oldValue !== newValue) {
      changes.push({
        field: key,
        oldValue,
        newValue
      });
    }
  }
  return changes;
}
