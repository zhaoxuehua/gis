// 图层
import request from "@/api";

// 设备类型list
export function deviceTypeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equipType/list${queryString}`, params);
}
