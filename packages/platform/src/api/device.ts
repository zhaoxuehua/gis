// 图层
import request from "@/api";

// 外部对象类型列表
export function objTypeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/visitObjectType/list${queryString}`, params);
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
