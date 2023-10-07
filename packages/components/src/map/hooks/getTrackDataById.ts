import { ElMessage } from "element-plus";
import moment from "moment";

// ⤵ store
import { useTrackListStore } from "../../stores/modules/trackList";

// ⤵ 接口
import { getEquipData, getTrackDataFieldMap } from "../../api/device";

// ⤵ 辅助函数
import { createdTrackData } from "../hooks/createdTrackData"; // 绘制轨迹

// ⤵ type
import type { getTrackDataByIdFnParamType, anyObjectType } from "../type";

const getTrackDataByIdFn = async (row: getTrackDataByIdFnParamType) => {
  const store = useTrackListStore();
  if (store.data?.length >= 5) {
    return ElMessage.warning("轨迹列表最多5条");
  }
  // 获取轨迹数据
  const trackResult: any = await getEquipData({
    equipCodes: row.code,
    equipType: row?.objectTypeCode,
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
  if (!trackResult.data?.items?.length) {
    return ElMessage.warning("暂无轨迹数据");
  }

  // 获取(动态字段，用于获取映射数字据， 其中"equipName", "equipCode", "position",是写死的，剩余的为动态的字段)
  const staticArr = ["equipName", "equipCode", "position"];
  // 过滤出监测属性名AISDATA（用于查询枚举[{}]）
  const attributeCode = Object.keys(trackResult.data.items[0]).filter(v => !staticArr.includes(v))[0] || "";
  const fieldMapResult = await getTrackDataFieldMap({ attributeCode });
  if (Number(fieldMapResult.code) !== 200) {
    return ElMessage.error("获取数据报错");
  }

  const fieldMap: any = {}; // 将[{sog:''}]转为map格式{sog:''}
  (fieldMapResult.data || []).forEach((val: any) => {
    let key = Object.keys(val)[0];
    fieldMap[key] = val[key];
  });
  const trackDetailListData: any[] = []; // 轨迹列表的详情时用
  const transData = trackResult.data.items.map((val: any) => {
    const aisLocation = val?.[attributeCode]; // 监测属性 eg AISDATA
    const aisInfo = JSON.parse(aisLocation);
    trackDetailListData.push({
      ...aisInfo,
      position: val.position
    }); // 监测属性{}
    const detailInfo: anyObjectType[] = [];
    Object.entries(fieldMap).forEach(v => {
      const [key, name] = v;
      detailInfo.push([name, aisInfo[key]]);
    });

    const params = {
      // 位置信息 经度 纬度 角度
      posInfo: {
        lat: aisInfo.lat,
        lon: aisInfo.lon,
        cog: aisInfo.cog // 尾船角度使用
      },
      titleInfo: {
        name: val.position // 轨迹圆圈鼠标经过时显示
      },
      labelInfo: {
        time: val.position, // 看是实现绘制还是虚线绘制（经过位置的时间）
        speed: aisInfo.sog // 判断是加速还是减速
      },
      detailInfo: detailInfo // 鼠标经过轨迹圆或者尾船时显示[['目标经度'：119],[],[]]
    };
    return params;
  });

  let trackDetailHeaderList = (fieldMapResult.data || []).concat({ position: "时间" }); // 轨迹详情表头
  createdTrackData({
    id: row.code,
    name: row.name,
    objectTypeCode: row?.objectTypeCode, // 实时数据对象类型
    data: transData
  }).then(res => {
    row.color = res;
    row.trackDetailHeaderList = trackDetailHeaderList;
    row.trackDetailListData = trackDetailListData;
    store.addData(row); // 轨迹列表5条
  });
};

export { getTrackDataByIdFn };
