import request from "@/api";

// 设备类型树
export function equipTypeTreeApi() {
  return request.get(`/api/equipment-service/equip/gis/tree`);
}

// 查看配置属性
export function labelDetailAttr(equipTypeId: number, currentType: string) {
  return request.get(`/api/gis-service-zhk/equip/gisLabelPopupInfo/getAll/${equipTypeId}/${currentType}`);
}

// 查看当前设备类型未绑定的静态属性
export function getUnBindStaticAttrApi(params: object, queryString: object) {
  return request.post(`/api/gis-service-zhk/equip/gisLabelPopupInfo/getUnbindAttribute/description`, params, {
    ...queryString
  });
}

// 查看当前设备类型未绑定的监测属性
export function getUnBindMonitorAttrApi(params: object, queryString: object) {
  return request.post(`/api/gis-service-zhk/equip/gisLabelPopupInfo/getUnbindAttribute/monitor`, params, {
    ...queryString
  });
}

// 查看当前设备类型未绑定的链接配置
export function getUnBindLinkApi(equipTypeId: number, currentType: string) {
  return request.get(`/api/gis-service-zhk/equip/gisLabelPopupInfo/getUnbindlinkConfig/${equipTypeId}/${currentType}`);
}

// 绑定属性
export function bindAttrApi(params: object) {
  return request.post(`/api/gis-service-zhk/equip/gisLabelPopupInfo/addBindAttribute`, params);
}

// 绑定link
export function bindLinkApi({ equipTypeId, currentType, buttons }: any) {
  return request.post(`/api/gis-service-zhk/equip/gisLabelPopupInfo/addLinkConfig/${equipTypeId}/${currentType}/${buttons}`);
}

// 修改title
export function updateLabel(params: object) {
  return request.put(`/api/gis-service-zhk/equip/gisLabelPopupInfo/label`, params);
}

// 修改结构体
export function updateJSONBody(params: any) {
  return request.post(`/api/gis-service-zhk/equip/gisLabelPopupInfo/setAttributeJsonConfig`, params);
}

// 删除绑定的属性
export function deleteBindAttrApi({ equipTypeId, currentType, attributeId }: any) {
  return request.delete(
    `/api/gis-service-zhk/equip/gisLabelPopupInfo/DeleteBindAttribute/${equipTypeId}/${currentType}/${attributeId}`
  );
}

// 删除绑定的属性
export function deleteLinkApi({ equipTypeId, currentType, buttonType }: any) {
  return request.delete(
    `/api/gis-service-zhk/equip/gisLabelPopupInfo/deleteLinkConfig/${equipTypeId}/${currentType}/${buttonType}`
  );
}

// 获取所有可选结构体
export function getAllJSONbodyApi(attributeId: number) {
  return request.get(`/api/equipment-service/equip/attribute/jsonConfig/${attributeId}`);
}
