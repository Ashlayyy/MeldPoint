import { Request } from 'express';

/**
 * Represents a key-value pair for tracking changes
 */
export interface ChangeKeyValue {
  key: string;
  value: any;
}

/**
 * Enhanced change record with metadata for structured logging
 */
export interface StructuredChange {
  key: string; // Field key/name
  newValue: any; // New value after change
  oldValue?: any; // Previous value before change (if available)
  displayName: string; // Snake_case display name for i18n
  type: string; // Data type (string, number, boolean, date, object, array)
  category: string; // Group/category this field belongs to
}

/**
 * Convert field name to snake_case for i18n compatibility
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/\.?([A-Z]+)/g, (_, match) => '_' + match.toLowerCase())
    .replace(/^_/, '')
    .toLowerCase();
}

/**
 * Determine the type of a value for type information
 */
function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';

  return typeof value;
}

/**
 * Get the appropriate data source based on request method
 */
function getRequestDataSource(req: Request): any {
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    return req.body;
  } else {
    return {
      ...req.params,
      ...req.query
    };
  }
}

/**
 * Format a value for structured representation
 */
function formatValueForStructured(value: any): any {
  if (value === null) return null;

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value;
    } else if (value instanceof Date) {
      return value.toISOString();
    } else {
      return value;
    }
  }

  return value;
}

/**
 * Extract changes from a request and format as structured records with metadata
 */
export function extractStructuredChanges(req: Request): StructuredChange[] {
  const dataSource = getRequestDataSource(req);

  if (Object?.keys(dataSource).length === 0) {
    return [];
  }

  return Object.entries(dataSource)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({
      key,
      newValue: formatValueForStructured(value),
      displayName: toSnakeCase(key),
      type: getValueType(value),
      category: 'general'
    }));
}

const EXCLUDED_FIELDS = ['meldingId', 'correctiefId', 'preventiefId', 'limit', 'id'];

/**
 * Extract resource-specific changes and format as structured records with metadata
 */
export function extractResourceStructuredChanges(req: Request, resourceType: string): StructuredChange[] {
  const dataSource = getRequestDataSource(req);

  if (!dataSource || Object?.keys(dataSource).length === 0) {
    return [];
  }

  return Object.entries(dataSource)
    .filter(([key, value]) => value !== undefined && !EXCLUDED_FIELDS.includes(key))
    .map(([key, value]) => ({
      key,
      newValue: formatValueForStructured(value),
      displayName: `${resourceType.toLowerCase()}_${toSnakeCase(key)}`,
      type: getValueType(value),
      category: resourceType.toLowerCase()
    }));
}

/**
 * Extract changes between two states and format as structured records with metadata
 */
export function extractStructuredStateChanges(
  previousState: any,
  newState: any,
  resourceType?: string
): StructuredChange[] {
  if (!previousState || !newState) return [];

  const changes: StructuredChange[] = [];
  const allKeys = new Set([...Object?.keys(previousState), ...Object?.keys(newState)]);

  Array.from(allKeys).forEach((key) => {
    const prevValue = previousState[key];
    const newValue = newState[key];

    // Skip internal fields and common metadata
    if (key.endsWith('ID') || key.endsWith('IDs') || key === 'id' || key === 'CreatedAt' || key === 'UpdatedAt') {
      return;
    }

    // If values differ or key only exists in one object
    if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
      const prefix = resourceType ? `${resourceType.toLowerCase()}_` : '';
      changes.push({
        key,
        oldValue: formatValueForStructured(prevValue),
        newValue: formatValueForStructured(newValue),
        displayName: `${prefix}${toSnakeCase(key)}`,
        type: getValueType(newValue || prevValue),
        category: resourceType?.toLowerCase() || 'general'
      });
    }
  });

  return changes;
}
