// 图层
import request from "@/api";

// 设备类型list
export function deviceTypeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equipType/list${queryString}`, params);
}

// 根据设备类型获取属性列表
export function getBindAttributeByEquipType(params: string | number) {
  return request.get(`/api/equipment-service/equip/equip/description/getByType/${params}/true`);
}

// 关联对象配置查询接口
// 查询动态表单数据
export function queryDynamicForm(params: any) {
  return request.get(`/api/equipment-service/equip/equip/description/${params.join("/")}`);
}
// 关联对象（动态表格列表数据的获取）
export function dynamicTableList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equip/list${queryString}`, params);
}

// 快速创建
export function getTreeData(params: any) {
  return request.get(`/api/equipment-service/view/custom/tree/get/${params}`);
}

export function deviceEquipList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equip/list${queryString}`, params);
}

export function objTypeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/visitObjectType/list${queryString}`, params);
}
