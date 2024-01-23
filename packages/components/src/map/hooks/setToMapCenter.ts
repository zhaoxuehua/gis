// ⤵ ol库
import { fromLonLat, toLonLat } from "ol/proj";

// ⤵ Store
import { useGisStore } from "../../stores/modules/gis";

// ⤵ type
import type { setToMapCenterType, VisualMap } from "../type";

/******************************************************************************************************/

// 回到地图中心点（地图去往lon lat中心位置）
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
    centerCoArr = fromLonLat([Number(lon), Number(lat)]);
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

// 获取中心点
const getMapPositionCenter = function (map: VisualMap) {
  if (!map) return null;
  let centerCor = getMapCenter(map); // {0:122,1:333}
  let [x, y] = toLonLat([centerCor?.[0], centerCor?.[1]]); // 将地图投影坐标转为经纬度  3857=>4326
  let centerX = handleCutZero(x?.toFixed(6) + "");
  let centerY = handleCutZero(y?.toFixed(6) + "");
  return { centerX, centerY };
};

// 根据获取当前地图所在位置处的中心
const getMapCenter = function (map: VisualMap) {
  let view = map?.getView();
  return view?.getCenter();
};

// 小数去掉尾部 0（为什么要写去掉尾部0）
const handleCutZero = function (num: string) {
  let newStr = num;
  let len = num.length - num?.indexOf(".") - 1;
  if (num.indexOf(".") > -1) {
    for (let i = len; i > 0; i--) {
      if (newStr.lastIndexOf("0") > -1 && newStr.substr(newStr.length - 1, 1) === "0") {
        let k = newStr.lastIndexOf("0");
        if (newStr.charAt(k - 1) == ".") {
          return newStr.substring(0, k - 1);
        } else {
          newStr = newStr.substring(0, k);
        }
      } else {
        return newStr;
      }
    }
  }
  return num;
};

export { setToMapCenter, getMapCenter, getMapPositionCenter, handleCutZero };
