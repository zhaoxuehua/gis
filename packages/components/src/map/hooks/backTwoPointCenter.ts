// ⤵ ol库
import { boundingExtent, getCenter } from "ol/extent";

/******************************************************************************************************/

const backTwoPointCenter = function (coordinates: [number[], number[]]) {
  const extent = boundingExtent(coordinates);
  const center = getCenter(extent);
  return center;
};

export { backTwoPointCenter };
