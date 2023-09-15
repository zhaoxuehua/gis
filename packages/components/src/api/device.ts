import request from "@/api";
// ⤵ type
import type {
  trackDataByIdParamsType,
  trackDataByIdResponseType,
  trackListDataParamsType,
  trackListDataResponseType,
  getTrackDataFieldMapType,
  getTrackDataFieldMapResponseType,
  getLayerListParamsType
} from "./interface";

// 轨迹回放(列表)
export function getTrackListData(params: trackListDataParamsType) {
  return request.post<trackListDataResponseType>(`/api/adm-service/view/common/getObjectByRegion`, params);
}

// 轨迹回放(单个详情数据,每次请求前，需要查询轨迹列表数据，有没有超过5条数据，超过提示)
export function getTrackDataById(params: trackDataByIdParamsType) {
  return request.post<trackDataByIdResponseType>(`/api/adm-service/view/common/getEquipData`, params);
}

// 轨迹返沪数据的中文映射字段
export function getTrackDataFieldMap(params: getTrackDataFieldMapType) {
  return request.get<getTrackDataFieldMapResponseType>(`/api/gis-service/equip/gisLabelPopupInfo/getSavedJsonConfig`, params);
}

// 快速创建
export function getTreeData(params: any) {
  return request.get(`/api/equipment-service/view/custom/tree/get/${params}`);
}

// 快速创建选择设备弹框(创建线)
export function deviceEquipList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equip/list${queryString}`, params);
}

export function eventListByObjType(id: number | string) {
  return request.get(`/api/equipment-service/equip/visitObject/events/${id}`);
}

// 白名单
// 获取白名单列表
export function getWhiteList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/object/whitelist/list${queryString}`, params);
}

// 编辑白名单
export function whiteListAdd(params: object) {
  return request.post(`/api/equipment-service/object/whitelist`, params);
}
export function whiteListEdit(params: object) {
  return request.put(`/api/equipment-service/object/whitelist`, params);
}

// 删除白名单
export function whiteListDelete(id: number) {
  return request.delete(`/api/equipment-service/object/whitelist/remove/${id}`);
}

// 获取水深
export function getDepthWater(params: object) {
  return request.post(`/api/equipment-service/object/whitelist`, params);
}

// 获取外部对象详情
export function getVisitObjectDetail(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/visitObject/list${queryString}`, params);
}

// 添加备注（给外部对象左击弹框增加编辑备注的功能）
export function editVisitObject(params: object) {
  return request.put(`/api/equipment-service/equip/visitObject`, params);
}

// 左键弹窗 获取设备数据
export function getEquipData(params: object) {
  return request.post(`/api/adm-service/view/common/getEquipData`, params);
}

// 左键弹窗 获取设备详情 拿到设备类型id
export function getEquipDetail(id: number) {
  return request.get(`/api/equipment-service/equip/equip/getById/${id}`);
}

// 左键弹窗 获取设备信息
// export function getEquipInfo(params: object) {
//   return request.post(`/api/adm-service/view/common/getEquipInfo`, params);
// }

// 左键弹窗 线性实时曲线
export function lineRealTimeCurveApi(params: object) {
  return request.post(`/api/adm-service/view/lineData/realtime/curve`, params);
}

// 查看左键弹窗配置的属性
export function labelDetailAttr(equipTypeId: number, currentType: string, equipCode: string) {
  return request.get(`/api/gis-service/equip/gisLabelPopupInfo/getAll/${equipTypeId}/${currentType}?equipCode=${equipCode}`);
}

// 获取图层列表
export function getLayerList(params: getLayerListParamsType) {
  return request.post<trackListDataResponseType>(
    `/api/gis-service/equip/layerConfig/list?pageSize=${params.pageSize}&pageNumber=${params.pageNumber}`,
    {
      name: ""
    }
  );
}

// 告警接口
// 获取告警列表
export function eventList(queryString: string, params: object) {
  return request.post(`/api/adm-service/view/events${queryString}`, params);
}
// 知晓标记
export function eventAwareness(params: any) {
  return request.post(`/api/adm-service/view/event/awareness`, params);
}
// 知晓详情
export function eventAwarenessDetail(params: any) {
  return request.get(`/api/adm-service/view/event/awareness/${params}`);
}
// 去处理
export function eventProcessBatch(params: any) {
  return request.post(`/api/adm-service/view/event/process/batch`, params);
}
// 处理方式option
export function getHandleTypeOption() {
  return request.get(`/api/adm-service/view/event/handleType`);
}
// 事件性质option
export function getNatureOption() {
  return request.get(`/api/adm-service/view/event/nature`);
}
// 全部处理
export function handleAll(params: any) {
  return request.post(`/api/adm-service/view/event/process/all`, params);
}
// 处理记录list
export function eventProcesses(id: string, queryString: string) {
  return request.get(`/api/adm-service/view/event/processes/${id}${queryString}`);
}
// 实时事件-视频-左边列表
export function cameraList(params: any) {
  return request.get(`/api/adm-service/view/event/videos/${params}`);
}
