// Types for dataset-agnostic group customization

export interface CustomizationKey {
  datasetId: string;
  columnName: string;
  groupValue: string | null;
}

export interface Customization {
  key: CustomizationKey;
  color?: string;
  label?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomizationInput {
  color?: string;
  label?: string;
  metadata?: string;
}
