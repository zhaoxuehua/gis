import request from "@/api";

// 需要轨迹回放的标签类型 => 该标签类型上有，对应轨迹layer的id
export const getTrackTypeInfo = (params: any) => {
  return request.get(`/api/gis-service/equip/gisLabel/type/getByVisitObjectType/` + params.code);
};

// 轨迹layer信息 => 用来将轨迹数据绘制该layer上
export const getTrackLayerInfo = (params: any) => {
  return request.get(`/api/gis-service/equip/layerConfig/getById/${params.id}`);
};
