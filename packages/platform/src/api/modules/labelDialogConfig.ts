import request from "@/api";

// 设备类型树
export function equipTypeTreeApi() {
  return request.get(`/api/gis-service/equip/gis/tree`);
}

// 查看配置属性
export function labelDetailAttr(equipTypeId: number, currentType: string) {
  return request.get(`/api/gis-service/equip/gisLabelPopupInfo/getAll/${equipTypeId}/${currentType}`);
}

// 查看当前设备类型未绑定的静态属性
export function getUnBindStaticAttrApi(params: object) {
  return request.post(`/api/gis-service/equip/gisLabelPopupInfo/getUnbindAttribute/description`, params);
}

// 查看当前设备类型未绑定的监测属性
export function getUnBindMonitorAttrApi(params: object) {
  return request.post(`/api/gis-service/equip/gisLabelPopupInfo/getUnbindAttribute/monitor`, params);
}

// 查看当前设备类型未绑定的链接配置
export function getUnBindLinkApi(equipTypeId: number, currentType: string) {
  return request.get(`/api/gis-service/equip/gisLabelPopupInfo/getUnbindlinkConfig/${equipTypeId}/${currentType}`);
}

// 绑定属性
export function bindAttrApi(params: object) {
  return request.post(`/api/gis-service/equip/gisLabelPopupInfo/addBindAttribute`, params);
}

// 修改title
export function updateLabel(label: string) {
  return request.put(`/api/gis-service/equip/gisLabelPopupInfo/label/${label}`);
}

// 删除绑定的属性
export function deleteBindAttrApi({ equipTypeId, currentType, attributeId }: any) {
  return request.delete(
    `/api/gis-service/equip/gisLabelPopupInfo/DeleteBindAttribute/${equipTypeId}/${currentType}/${attributeId}`
  );
}
