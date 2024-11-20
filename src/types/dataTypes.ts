export type TableRow = Record<string, any>;

export interface GroupInfo {
  level: number;
  group: number[];
  hidden: boolean;
  parent?: number;
} 