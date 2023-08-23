import { ElMessage } from "element-plus";
import moment from "moment";

// ⤵ store
import { useTrackListStore } from "../../stores/modules/trackList";

// ⤵ 接口
import { getTrackDataById, getTrackDataFieldMap } from "../../api/device";

// ⤵ 辅助函数
import { createdTrackData } from "../hooks/createdTrackData"; // 绘制轨迹

// ⤵ type
import type { getTrackDataByIdFnParamType, anyObjectType } from "../type";

const getTrackDataByIdFn = async (row: getTrackDataByIdFnParamType) => {
  const store = useTrackListStore();
  const trackResult = await getTrackDataById({
    equipCodes: row.code,
    isVisitObject: true,
    isHistory: true,
    beginTime: moment(row.beginTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment(row.endTime).format("YYYY-MM-DD HH:mm:ss"),
    pageNumber: 1,
    pageSize: 1000000,
    ascDesc: "asc"
  });

  if (Number(trackResult.code) !== 200) {
    return ElMessage.error("获取数据报错");
  }
  if (!trackResult.data.items.length) {
    return ElMessage.warning("暂无轨迹数据");
  }

  // 获取(动态字段，用于获取映射数字据， 其中"equipName", "equipCode", "position",是写死的，剩余的为动态的字段)
  const staticArr = ["equipName", "equipCode", "position"];
  const attributeCode = Object.keys(trackResult.data.items[0]).filter(v => !staticArr.includes(v))[0] || "";
  const fieldMapResult = await getTrackDataFieldMap({ attributeCode });
  if (Number(fieldMapResult.code) !== 200) {
    return ElMessage.error("获取数据报错");
  }

  const fieldMap: any = {};
  (fieldMapResult.data || []).forEach((val: any) => {
    let key = Object.keys(val)[0];
    fieldMap[key] = val[key];
  });
  const transData = trackResult.data.items.map(val => {
    const aisLocation = val.aisLocation;
    const aisInfo = JSON.parse(aisLocation);
    const detailInfo: anyObjectType[] = [];
    Object.entries(fieldMap).forEach(v => {
      const [key, name] = v;
      detailInfo.push([name, aisInfo[key]]);
    });

    const params = {
      posInfo: {
        lat: aisInfo.lat,
        lon: aisInfo.lon,
        cog: aisInfo.cog
      },
      titleInfo: {
        name: moment(aisInfo.positionReportTicks).format("YYYY-MM-DD HH:mm:ss")
      },
      labelInfo: {
        time: moment(aisInfo.positionReportTicks).format("YYYY-MM-DD HH:mm:ss"),
        speed: aisInfo.sog
      },
      detailInfo: detailInfo
    };
    return params;
  });
  createdTrackData({
    id: row.code,
    name: row.name,
    data: transData
  }).then(res => {
    row.color = res;
    store.addData(row);
  });
};

export { getTrackDataByIdFn };
