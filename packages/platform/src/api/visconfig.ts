import request from "@/api";

// 图层
// 新增图层
export function addLayer(params: object) {
  return request.post(`/api/gis-service/equip/layerConfig`, params);
}
// 修改图层
export function editLayer(params: object) {
  return request.put(`/api/gis-service/equip/layerConfig`, params);
}
// 获取图层列表
export function getLayerList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/layerConfig/list${queryString}`, params);
}
// 删除图层前检查是否引用
export function deleteLayerCheck(params: any) {
  return request.get(`/api/gis-service/equip/layerConfig/check/${params.join(",")}`);
}
// 删除图层
export function deleteLayer(params: any) {
  return request.delete(`/api/gis-service/equip/layerConfig/${params.join(",")}`);
}

// 地图参数
// 获取地图参数列表
export function getMapParamsList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/mapParams/config/list${queryString}`, params);
}
// 获取地图参数详情
export function getMapParamsDetail(params: string | number) {
  return request.get(`/api/gis-service/equip/mapParams/config/getById/${params}`);
}
// 删除地图参数前检查是否引用
export function deleteMapParamsCheck(params: any) {
  return request.get(`/api/gis-service/equip/mapParams/config/check/${params.join(",")}`);
}
// 删除地图参数
export function deleteMapParams(params: any) {
  return request.delete(`/api/gis-service/equip/mapParams/config/${params.join(",")}`);
}
// 新增地图参数
export function addMapParams(params: object) {
  return request.post(`/api/gis-service/equip/mapParams/config`, params);
}
// 修改地图参数
export function editMapParams(params: object) {
  return request.put(`/api/gis-service/equip/mapParams/config`, params);
}

// 标签类型
// 获取标签类型列表
export function getLabelTypeList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/gisLabel/type/list${queryString}`, params);
}
// 删除标签类型前检查是否引用
export function deleteLabelTypeCheck(params: any) {
  return request.get(`/api/gis-service/equip/gisLabel/type/check/${params.join(",")}`);
}
// 删除标签类型
export function deleteLabelType(params: any) {
  return request.delete(`/api/gis-service/equip/gisLabel/type/${params.join(",")}`);
}
// 新增标签类型
export function addLabelType(params: object) {
  return request.post(`/api/gis-service/equip/gisLabel/type`, params);
}
// 修改标签类型
export function editLabelType(params: object) {
  return request.put(`/api/gis-service/equip/gisLabel/type`, params);
}
// 获取标签数据类型
export function getLabelDataType() {
  return request.get(`/api/gis-service/equip/gisLabel/type/selects`);
}

// 获取标签类型详情
export function getLabelTypeDetail(params: string | number) {
  return request.get(`/api/gis-service/equip/gisLabel/type/getById/${params}`);
}

// 标签
// 获取标签列表
export function getLabelList(queryString: string, params: object) {
  return request.post(`/api/gis-service/equip/gisLabelInfo/list${queryString}`, params);
}
// 删除标签前检查是否引用
export function deleteLabelCheck(params: any) {
  return request.get(`/api/gis-service/equip/gisLabelInfo/check/${params.join(",")}`);
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
// 删除图例
export function deleteLegendConfig(params: any) {
  return request.delete(`/api/gis-service/equip/legend/config/${params}`);
}
// 添加图例
export function addLegend(params: object) {
  return request.post(`/api/gis-service/equip/legend/config`, params);
}
// 编辑图例
export function editLegend(params: object) {
  return request.put(`/api/gis-service/equip/legend/config`, params);
}
// 上传图片接口
export function upLoadImage(params: any) {
  return request.post(`/api/gis-service/minio/file/upload/picture`, params);
}
