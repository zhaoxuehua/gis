import { TableColumn } from "element-plus/lib/el-table";
export type TableList = {
  loading: boolean;
  total: number;
  ids: Array<number>;
  data: Array<any>;
  getTableData: Function;
  onSelectionChange: Function;
  onEdit: Function;
  columns?: Array<{ [key: string]: any }>;
};

// 标签类型
export type LabelType = {
  id?: number | null;
  code: string;
  name: string;
  layerConfigId: number | string;
  attribute: { [key: string]: any } | null;
  attributeId: number;
  equipType: { [key: string]: any } | null;
  equipTypeId: number;
  isDefaultDisplayLabelName: boolean;
  factor: string | null;
  labelLegendImagePath: string | null;
  labelLegendImageAllPath: string | null;
  dataType: string;
  displayScale: number;
  pellucidity: number;
  labelTypeImagePath: any;
  // labelTypeImageAllPath: string | null;
  lineWidth: number;
  lineType: string;
  lineColor: string;
  polygonColor: string;
  lineVectorPath: string;
  lineVectorWidth: number;
  lineVectorHeight: number;
  lineVectorProportion: number;
  content: string;
  fontType: string;
  isBold: boolean;
  fontColor: string;
  fontSize: number;
  borderWidth: number;
  borderColor: string;
  backGroundColor: string;
  iconUrl?: string;
};

// 标签信息
export type LabelInfoData = {
  id?: number;
  code: string;
  name: string;
  labelData: LabelData;
  labelType: { [key: string]: any };
  labelTypeId: number;
  refLayer: { [key: string]: any };
  refLayerId: number;
};

// 表格列排序
export interface SortChangeEvent {
  prop: string;
  order: "ascending" | "descending";
  columns: TableColumn[];
  column: TableColumn;
}
