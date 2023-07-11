import request from "@/api";

// 快速创建
export function getTreeData(params: any) {
  return request.get(`/api/equipment-service/view/custom/tree/get/${params}`);
}

// 快速创建选择设备弹框
export function deviceEquipList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/equip/equip/list${queryString}`, params);
}
