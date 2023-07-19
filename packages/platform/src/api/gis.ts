import request from "@/api";

// 导航树
export function getGisCustomTree(params: string | number) {
  return request.get(`/api/gis-service/equip/getGisEquipCategoryAndEquipTypeCustomTree?sourceCode=${params}`);
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

// 获取生成线路的设备点信息
export function getEquipListByLine(id: number) {
  return request.get(`/api/gis-service/equip/2DGis/label/line/getByAssert/${id}`);
}
// 创建单个标签（快速创建——按点创建线）
export function addLabelSingle(params: object) {
  return request.post(`/api/gis-service/equip/2DGis/label/save`, params);
}

// 删除单个标签（快速创建——按点创建线）
export function deleteLabelSingle(id: number) {
  return request.get(`/api/gis-service/equip/2DGis/label/delete/${id}`);
}

// 白名单
// 获取白名单列表
export function getWhiteList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equip/list${queryString}`, params);
}

// 编辑白名单
export function whiteListEdit(params: object) {
  return request.put(`/api/equipment-service/equip/equip`, params);
}

// 新增白名单
export function whiteListAdd(params: object) {
  return request.post(`/api/equipment-service/equip/equip`, params);
}

// 删除白名单
export function whiteListDelete(id: number) {
  return request.delete(`/api/equipment-service/equip/equip/${id}`);
}
