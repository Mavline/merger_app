export type TableRow = Record<string, any>;

export interface GroupInfo {
  level: number;
  group: number[];
  hidden: boolean;
  parent?: number;
  header?: string;
}

export interface FileData {
  name: string;
  content: TableRow[];
}

export interface SheetData {
  name: string;
  data: TableRow[];
}

// Новые типы для вертикального слияния
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
