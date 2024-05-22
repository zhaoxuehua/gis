import request from "@/api";

// 获取地图参数详情(可以根据code id )
export function getMapParamsDetail(params: string | number, idId: boolean) {
  return request.get(`/api/gis-service/equip/mapParams/config/detail?${idId ? "id" : "code"}=${params}`);
}

// 获取设备告警列表
export function getEquipAlarmList(params: string | number, idId: boolean) {
  return request.get(`/api/gis-service/labelAlarm?${idId ? "appId" : "appCode"}=${params}`);
}

// 获取线性设备的米标位置
export function getLineEquipMeterPosition(code: string, lon: number, lat: number) {
  return request.get(`/api/gis-service/positionConversion/${code}/${lon}/${lat}`);
}

// 标签
// 获取标签列表
export function getLabelList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/gisLabelInfo/list${queryString}`, params);
}
// 删除标签
export function deleteLabel(params: any) {
  return request.delete(`/api/gis-service/equip/gisLabelInfo/${params.join(",")}`);
}
// 新增标签
export function addLabel(params: object) {
  return request.post(`/api/gis-service/equip/gisLabelInfo`, params);
}
// 修改标签
export function editLabel(params: object) {
  return request.put(`/api/gis-service/equip/gisLabelInfo`, params);
}

// 图例
// 查询图例列表
export function getLegendConfigList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/legend/config/list${queryString}`, params);
}
