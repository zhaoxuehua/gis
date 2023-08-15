// ⤵ ol库
import * as olProj from "ol/proj";

// ⤵ Store
import { useGisStore } from "../../stores/modules/gis";

// ⤵ type
import type { setToMapCenterType } from "../type";

/******************************************************************************************************/

const setToMapCenter = function ({ lon, lat, zoom, duration, callBack }: setToMapCenterType) {
  if (!lon || !lat) {
    return;
  }
  const gisStore = useGisStore();
  const mapCase = gisStore.mapCase;
  const view = mapCase.getView();
  const fn = typeof callBack == "function" ? callBack : null;
  let centerCoArr = null;

  if (lon > 180 || lat > 180) {
    // 不需要转了
    centerCoArr = [lon, lat];
  } else {
    centerCoArr = olProj.fromLonLat([Number(lon), Number(lat)]);
  }

  if (zoom) {
    view.animate({ center: centerCoArr }, { zoom: zoom }, { duration: duration }, function () {
      fn && fn();
    });
  } else {
    view.animate({ center: centerCoArr }, function () {
      fn && fn();
    });
  }
};
export { setToMapCenter };
