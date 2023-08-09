export interface ColumnItem {
  type?: string;
  label?: string;
  prop?: string;
  scope?: string;
  width?: number;
  render?: (param: any) => any;
  [key: string]: any;
}
export interface Pagination {
  total?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
  pageSizes?: number[];
  layout?: string;
  background?: boolean;
  autoScroll?: boolean;
  hidden?: boolean;
  style?: string | object;
}
