import { TableRow } from '../../types/dataTypes';

export interface VerticalMergeFile {
  id: string;
  name: string;
  originalName: string;
  data: TableRow[];
  headers: string[];
}

export interface VerticalMergeState {
  files: VerticalMergeFile[];
  mergedData: TableRow[] | null;
  headers: string[];
}

export type { TableRow };
