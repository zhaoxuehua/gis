import { defineStore } from "pinia";
import { cloneDeep } from "lodash";
import { ElMessage } from "element-plus";
import piniaPersistConfig from "@/config/piniaPersist";
import { getGisCustomTree, getCollectRelation } from "../../api/gis";
import type { VisualMap } from "../../map/type";

const trackColor = ["#c70a0a", "#1d9000", "#00289c", "#aa0a72", "#007eb3", "#5310d6", "#cb5e01", "#d10087", "#8e7604", "#971ae8"];
export const useGisStore = defineStore({
  id: "gis",
  state: (): any => ({
    navigationTree: [], // 导航树
    relationMap: {}, // 关联关系{标签code:{设备对象数据}}
    relationMapKeyIsEquipCode: {}, // 关联关系{设备code:标签code}
    mapIdentificationConfig: { mapParams: "", isId: false }, // 应用场景id/code及是否是id
    isDynamicLine: false, // 线环闪烁维护字段
    imgIndex: 0, // 动画点图片索引
    isEdit: false, // 地图编辑
    isShowEditLabel: false, // 编辑标签弹框
    realtimeDataList: [], // 实时数据配置list
    realtimeDataCountList: [], // 实时数据count统计(不放在realtimeDataList中是因为他其实是常量好多地方依赖，变更它的话会导致其他依赖触发渲染)
    keywordConfig: {}, // 关键词配置
    simulateAlarmTimer: null, // 报警要素样式切换定时器
    mapCase: {}, // 地图实例
    trackColor: trackColor, // 轨迹回放的颜色
    mouseRightClickCoordinate: "", // 鼠标右击时坐标信息  经度,纬度
    isShowTrackBackList: false
  }),
  actions: {
    // 导航树及关联关系
    fetchNavigationTree() {
      getGisCustomTree(this.mapIdentificationConfig?.mapParams, this.mapIdentificationConfig?.isId).then(
        (res: any) => {
          if (res.code === 200 && res.data) {
            const { treeNodeVOList = [] } = res.data;
            const navigationTree = cloneDeep(formatTree(treeNodeVOList));
            this.navigationTree = navigationTree;
          } else {
            ElMessage.error("接口异常");
          }
        },
        (err: any) => {
          console.warn(err);
        }
      );
    },

    // 获取设备与标签的关联关系
    fetchCollectRelation() {
      getCollectRelation(this.mapIdentificationConfig?.mapParams, this.mapIdentificationConfig?.isId).then(
        (res: any) => {
          if (res.code === 200 && res?.data) {
            let mapKeyIsFeatureCode: any = {};
            let mapKeyIsEquipCode: any = {};
            res.data?.forEach((item: { [key: string]: any }) => {
              mapKeyIsFeatureCode[item?.associationInfo?.associationObjectCode] = {
                ...item
              };
              mapKeyIsEquipCode[item?.code] = item?.associationInfo?.associationObjectCode;
            });
            this.relationMap = mapKeyIsFeatureCode || {};
            this.relationMapKeyIsEquipCode = mapKeyIsEquipCode || {};
          } else {
            ElMessage.error("接口异常");
          }
        },
        (err: any) => {
          console.warn(err);
        }
      );
    },

    // 存储应用场景的编码或id
    setMapIdentification({ mapParams, isId }: { mapParams: string | number; isId: boolean }) {
      this.mapIdentificationConfig = { mapParams: mapParams, isId: isId };
    },
    setIsDynamicLine(isDynamicLine: boolean) {
      this.isDynamicLine = isDynamicLine;
    },
    setImgIndex(imgIndex: number) {
      this.imgIndex = imgIndex;
    },
    setIsEdit(isEdit: boolean) {
      this.isEdit = isEdit;
    },
    setIsShowEditLabel(isShowEditLabel: boolean) {
      this.isShowEditLabel = isShowEditLabel;
    },
    setIsShowTrackBackList(isShow: boolean) {
      this.isShowTrackBackList = isShow;
    },
    setSimulateAlarmTimer(timer: any) {
      this.simulateAlarmTimer = timer;
    },

    setKeywordConfig(keywordConfig: { [key: string]: any }) {
      this.keywordConfig = keywordConfig || {};
    },
    setRealtimeDataList(realtimeDataList: any[]) {
      this.realtimeDataList = realtimeDataList;
    },

    // 实时数据统计数组
    setRealtimeDataCountList(realtimeDataCountList: any = []) {
      this.realtimeDataCountList = realtimeDataCountList;
    },
    // 根据实时数据code更新对应的实时数据数量
    updateRealtimeDataCountList(code: string, count: number) {
      let objectToUpdate = this.realtimeDataCountList.find((obj: { [key: string]: any }) => obj?.code == code);
      if (objectToUpdate) {
        objectToUpdate.count = count;
      }
    },

    // 设置导航树数据及关联关系为空
    setNavTreeAndRelation() {
      this.navigationTree = [];
      this.relationMap = {};
      this.relationMapKeyIsEquipCode = {};
    },
    // 设置地图实例
    setMapCase(data: VisualMap) {
      this.mapCase = data;
      this.mapCase.set("tackListMap", {});
    },

    // 设置(当关闭轨迹列表、轨迹列表数据为空、刷新时)
    setTrackColor() {
      this.trackColor = trackColor;
    },
    updateTrackColor(color: string, type: string) {
      if (type == "delete") {
        this.trackColor = this.trackColor?.filter((item: string) => item != color);
      }
      if (type == "add") {
        this.trackColor.push(color);
      }
    },
    setMouseRightClickCoordinate(coordinateStr: string) {
      this.mouseRightClickCoordinate = coordinateStr;
    }
  },
  persist: piniaPersistConfig("gis")
});

// 格式化树数据，按order进行排序
const formatTree = (tree: any[]) => {
  tree?.sort(function (a: any, b: any) {
    const param1 = a.order;
    const param2 = b.order;
    return param1 - param2;
  });
  tree?.forEach(function (item: any) {
    if (item.children && item.children.length > 0) {
      formatTree(item.children);
    } else {
      item.children = null;
    }
  });
  return tree;
};
