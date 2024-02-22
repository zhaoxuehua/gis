import { Style } from "ol/style";

type getInitMapExportDataType = (map: any) => void;

// 创建船函数
interface shipParamsType {
  lat: number;
  lon: number;
  name: string;
  isDefaultDisplayLabelName?: boolean;
  type?: string;
  color: string[];
  showHeadline?: boolean;
  angle: number;
  code: any;
  sog: number;
  monitorTime: number;
  person: any;
}

interface shipStyCashType {
  [key: string]: Style;
}

// 塞入基础引擎的搜索数据
interface searchShipType {
  code: string | number;
  lat: number;
  lon: number;
  dataType: string | number;
  name: string;
  equipType: number;
  labelTypeId: number;
  isRealTimeData: boolean;
  layerCode: string;
  realObjectTypeCode?: string;
}
type searchShipDataType = searchShipType[];

interface shipColorParams {
  monitorTime: number;
  colorIndex?: number | undefined;
  status: string;
  styleObject?: string;
  isAttention?: boolean;
  isWhiteList?: boolean;
}

export type { getInitMapExportDataType, shipParamsType, shipStyCashType, searchShipDataType, shipColorParams };
