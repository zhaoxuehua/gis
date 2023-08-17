import request from "@/api";

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

// 左键弹窗 获取设备数据
export function getEquipData(params: object) {
  return request.post(`/api/adm-service/view/common/getEquipData`, params);
}

// 左键弹窗 获取设备信息
export function getEquipInfo(params: object) {
  return request.post(`/api/adm-service/view/common/getEquipInfo`, params);
}

// 左键弹窗 线性实时曲线
export function lineRealTimeCurveApi(params: object) {
  return request.post(`/api/adm-service/view/lineData/realtime/curve`, params);
}

// 左键弹窗 查看配置属性
export function labelDetailAttr(equipTypeId: number, currentType: string) {
  return request.get(`/api/gis-service-zhk/equip/gisLabelPopupInfo/getAll/${equipTypeId}/${currentType}`);
}
