// ⤵ ol库
import { getCenter, createEmpty, extend } from "ol/extent";

// ⤵ type
import type { backCenterByFeaturesType } from "../type";

/******************************************************************************************************/

// 返回一组要素的坐标中心点
const backCenterByFeatures: backCenterByFeaturesType = function (features) {
  const extent = createEmpty();
  features.forEach(feature => extend(extent, (feature as any).getGeometry().getExtent()));
  return getCenter(extent);
};
export { backCenterByFeatures };
