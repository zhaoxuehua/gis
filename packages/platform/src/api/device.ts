import request from "@/api";

// 设备自定义树列表接口
export function customTreeList(queryString: string, params: object) {
  return request.post(`/api/equipment-service/view/custom/tree/list${queryString}`, params);
}

// 获取配置绑定属性列表-监测属性列表(传设备类型id)---设备类型还是外部对象类型
export function getBindAttributeMonitor(params: number, isVisitObject: boolean) {
  return request.get(
    `/api/equipment-service/equip/${isVisitObject ? "visitObjectType" : "equipType"}/getBindAttribute/monitor/${params}`
  );
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

// 文件上传秒传判断
export function uploadCheckChunkFile(fileHash: any, chunks: number) {
  return request.get(`/api/adm-service/checkFile?fileHash=${fileHash}&chunks=${chunks}`);
}
export function uploadChunkFile(params: any, config: object) {
  return request.post(`/api/adm-service/upload`, params, config);
}
export function getChunkFileUrl(fileHash: string) {
  return request.get(`/api/adm-service/getFileUrl?fileHash=${fileHash}`);
}
