import request from "@/api";

// 设备自定义树列表接口
export function customTreeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/view/custom/tree/list${queryString}`, params);
}

// 获取配置绑定属性列表-监测属性列表(传设备类型id)
export function getBindAttributeMonitor(params: number) {
  return request.get(`/api/equipment-service/equip/equipType/getBindAttribute/monitor/${params}`);
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
