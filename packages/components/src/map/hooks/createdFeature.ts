import { Feature } from "ol";
import type { createdFeatureType } from "../type";
const createdFeature: createdFeatureType = function (data) {
  return new Feature({
    name: data?.name, // 标签名字
    geometry: data?.geometry,
    extendsData: data?.extendsData
  });
};

export { createdFeature };
