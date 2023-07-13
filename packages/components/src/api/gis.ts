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

// 获取生成面的线路设备点信息
export function getEquipListByPolygon(id: number) {
  return request.get(`/api/gis-service/equip/2DGis/label/line/getByAssert/${id}`);
}
