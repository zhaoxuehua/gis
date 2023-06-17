// 图层
import request from "@/api";

// 设备类型list
export function deviceTypeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equipType/list${queryString}`, params);
}

// 关联对象配置查询接口
// 设备管理-静态属性列表(绑定的静态属性)
export function bindStaticAttributes(params: any) {
  return request.get(`/api/equipment-service/equip/equip/description/${params.join("/")}`);
}
