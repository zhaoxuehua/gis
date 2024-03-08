import request from "@/api";

// 导航树(场景编码)
export function getGisCustomTree(params: string | number, isId: boolean) {
  return request.get(`/api/gis-service/equip/getGisEquipCategoryAndEquipTypeCustomTree?${isId ? "appId" : "appCode"}=${params}`);
}

// 设备与标签的关联关系
export function getCollectRelation(params: string | number, isId: boolean) {
  return request.get(`/api/gis-service/equip/getEquipAndLabel?${isId ? "appId" : "appCode"}=${params}`);
}

// 设置中心点
export function setMapCenter(params: object) {
  return request.put(`/api/gis-service/equip/mapParams/config/changeCenter`, params);
}

// 根据设备id查找已绘制的标签信息
// ids：数组
export function getLabelInfoByEquipId(ids: Array<string | number>) {
  return request.get(`/api/gis-service/equip/2DGis/equipBinding/${ids.join(",")}`);
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
  return request.get(`/api/gis-service/equip/gisLabel/type/getByObjectType/${code}`, params);
}
// 获取实时列表数据
export function getRealDataList(code: string, params: any) {
  return request.get(`/api/equipment-service/equip/equip/getRealtimeData/type/${code}`, params, {
    noLoading: true
  });
}

// 导入模块封装
// 下载模板
export function downloadTemplate(params: any) {
  return request.post(`/api/gis-service/excel/import/exportHeader`, params);
}

// 上传excel获取表格表头
export function upLoadFileGetTableColumnData(params: any) {
  return request.post(`/api/gis-service/excel/import/getExcelHead`, params);
}

// 上传excel获取表格数据
export function upLoadFileGetTableData(params: any) {
  return request.post(`/api/gis-service/excel/import/loadExcelData`, params);
}

// 切换预览pageSize
export function getTableDataByChangePageSize(params: any) {
  return request.post(`/api/gis-service/excel/import/changePageSize`, params);
}

// 切换预览pageNumber
export function getTableDataByChangePageNumber(params: any) {
  return request.post(`/api/gis-service/excel/import/changePageNum`, params);
}

// 编辑excel行数据（删除、修改(校验及翻页时需要调用)）
export function editFileExcelTableData(params: any) {
  return request.post(`/api/gis-service/excel/import/changePageData`, params);
}

// 校验
export function checkFile(params: any) {
  return request.post(`/api/gis-service/excel/import/validData`, params);
}

// 确认导入
export function confirmImport(params: any) {
  return request.post(`/api/gis-service/excel/import/importData`, params);
}

// 取消
export function cancelImport(params: any) {
  return request.post(`/api/gis-service/excel/import/cancelImport`, params);
}

// 数据导出
export function tableDataExport(params: any) {
  return request.post(`/api/gis-service/excel/import/export`, params);
}
