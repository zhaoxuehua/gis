// 图层
import request from "@/api";

// 设备类型list
export function deviceTypeList(queryString: string, params: object) {
  return request.post(`/backend1/equip/equipType/list${queryString}`, params);
}
