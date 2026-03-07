import type { CustomizationKey } from '@/types/customization';

/**
 * Encodes a customization key into a string format for storage
 * Format: {datasetId}:{columnName}:{encodedGroupValue}
 */
export function encodeKey(key: CustomizationKey): string {
  const { datasetId, columnName, groupValue } = key;
  
  // Handle null/undefined values with a special placeholder
  const encodedValue = groupValue === null || groupValue === undefined
    ? '__NULL__'
    : encodeURIComponent(String(groupValue));
  
  return `${datasetId}:${columnName}:${encodedValue}`;
}

/**
 * Decodes a string key back into a CustomizationKey object
 */
export function decodeKey(encoded: string): CustomizationKey {
  const parts = encoded.split(':');
  
  if (parts.length < 3) {
    throw new Error(`Invalid encoded key format: ${encoded}`);
  }
  
  const datasetId = parts[0];
  const columnName = parts[1];
  // Handle case where group value contains colons
  const encodedValue = parts.slice(2).join(':');
  
  const groupValue = encodedValue === '__NULL__'
    ? null
    : decodeURIComponent(encodedValue);
  
  return { datasetId, columnName, groupValue };
}

/**
 * Validates that a customization key has all required fields
 */
export function validateKey(key: CustomizationKey): boolean {
  return Boolean(
    key.datasetId &&
    key.columnName &&
    (key.groupValue !== undefined)
  );
}
