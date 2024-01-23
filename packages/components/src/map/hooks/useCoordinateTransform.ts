import { toLonLat } from "ol/proj";

// 坐标转成120.15类似格式
const toLonLatFN = (arg: number[]) => {
  return toLonLat(arg);
};

export { toLonLatFN };
