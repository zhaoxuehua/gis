import request from "@/api";

// 导航树(场景编码)
export function getGisCustomTree(params: string | number, idId: boolean) {
  return request.get(`/api/gis-service/equip/getGisEquipCategoryAndEquipTypeCustomTree?${idId ? "appId" : "appCode"}=${params}`);
}

// 根据设备id查找已绘制的标签信息
// ids：数组
export function getLabelInfoByEquipId(ids: Array<string | number>) {
  return request.get(`/api/gis-service/equip/2DGis/equipBinding/${ids.join(",")}`);
}

// 删除关联关系
export function deleteAssociation(params: any) {
  return request.delete(`/api/gis-service/equip/equipAssociationMiddleInfo/${params.join(",")}`);
}

// 新增关联关系
export function addAssociation(params: any) {
  return request.post(`/api/gis-service/equip/equipAssociationMiddleInfo`, params);
}

// 根据树节点编码获取所属设备列表
export function getEquipListByNodeCode(params?: {
  pageSize: number;
  pageNo: number;
  equipName?: any;
  nodeCode: string;
  treeCode: string;
}) {
  return request.post(`/api/gis-service/equip/2DGis/expressBinding`, params);
}

// 批量创建标签（快速创建——按面创建点）
export function addLabelBatch(params: Array<any>) {
  return request.post(`/api/gis-service/equip/2DGis/label/list/save`, params);
}

// 批量删除标签（快速创建——按面创建点）
export function deleteLabelBatch(ids: Array<string | number>) {
  return request.get(`/api/gis-service/equip/2DGis/label/delete/batch/${ids.join(",")}`);
}

// 创建单个标签（快速创建——按点创建线  快速创建生成面）
export function addLabelSingle(params: object) {
  return request.post(`/api/gis-service/equip/2DGis/label/save`, params);
}

// 删除单个标签（快速创建——按点创建线  快速创建 删除面）
export function deleteLabelSingle(id: number) {
  return request.get(`/api/gis-service/equip/2DGis/label/delete/${id}`);
}

// 获取生成线路的设备点信息
export function getEquipListByLine(id: number) {
  return request.get(`/api/gis-service/equip/2DGis/label/line/getByAssert/${id}`);
}
// 快速绘制（创建面设备弹框列表）
export function gisDeviceEquipList(queryString: string, params: object) {
  return request.get(`/api/gis-service/equip/2DGis/label/equip${queryString}`, params);
}

// 轨迹回放
export function gisTrackList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/2DGis/label/equip${queryString}`, params);
}

// 点击关注
export function addAttentionApi(params: object) {
  return request.post(`/api/equipment-service/object/attentionList`, params);
}

// 关注列表
export function getAttentionList(params: object, queryString: object) {
  return request.post(`/api/equipment-service/object/attentionList/list`, params, {
    ...queryString
  });
}
// 取消关注
export function deleteAttentionApi(ids: string) {
  return request.delete(`/api/equipment-service/object/attentionList/remove/${ids}`);
}

// 弹窗里面的取消关注
export function deleteDialogAttentionApi({ objectCode, objectType }: any) {
  return request.delete(`/api/equipment-service/object/attentionList/remove/${objectCode}/${objectType}`);
}

// 实时数据
// 获取实时数据所属的标签类型信息
export function getRealLabelTypeInfo(code: string, params: any) {
  return request.get(`/api/gis-service/equip/gisLabel/type/getByVisitObjectType/${code}`, params);
}
// 获取实时数据设备类型信息
export function getRealEquipTypeInfo(code: string, params: any) {
  return request.get(`/api/equipment-service/equip/visitObjectType/getByCode/${code}`, params);
}
// 获取实时列表数据  equip/equip/getRealtimeData/
export function getRealDataList(code: string, params: any) {
  return request.get(`/api/equipment-service/equip/visitObject/getAliveObject/${code}`, params, {
    noLoading: true
  });
}

// 轨迹
// 轨迹layer信息 => 用来将轨迹数据绘制该layer上
export const getTrackLayerInfo = (params: any) => {
  return request.get(`/api/gis-service/equip/layerConfig/getById/${params.id}`);
};
