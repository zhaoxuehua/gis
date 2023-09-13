import { defineStore } from "pinia";
import { cloneDeep } from "lodash";
import { ElMessage } from "element-plus";
import piniaPersistConfig from "@/config/piniaPersist";
import { getGisCustomTree } from "../../api/gis";
import type { VisualMap } from "../../map/type";

export const useGisStore = defineStore({
  id: "gis",
  state: (): any => ({
    navigationTree: [], // 导航树
    relationMap: {}, // 关联关系
    sourceCode: "",
    isDynamicLine: false, // 线环闪烁维护字段
    imgIndex: 0, // 动画点图片索引
    isEdit: false, // 地图编辑
    isShowEditLabel: false, // 编辑标签弹框
    keywordConfig: {}, // 关键词配置
    simulateAlarmTimer: null, // 报警要素样式切换定时器
    mapCase: {}, // 地图实例
    trackColor: ["#c70a0a", "#007eb3", "#971ae8", "#cb5e01", "#00289c", "#d10087", "#5310d6", "#1d9000", "#8e7604", "#aa0a72"] // 轨迹回放的颜色
  }),
  actions: {
    // 导航树及关联关系
    fetchNavigationTree() {
      getGisCustomTree(this.sourceCode).then(
        (res: any) => {
          if (res.code === 200 && res.data) {
            const { treeNodeVOList } = res.data;
            const navigationTree = cloneDeep(formatTree(treeNodeVOList));
            this.navigationTree = navigationTree;
            const relationMap = collectRelation(treeNodeVOList);
            this.relationMap = relationMap;
          } else {
            ElMessage.error("接口异常");
          }
        },
        (err: any) => {
          console.warn(err);
        }
      );
    },
    // 存储导航树的sourceCode
    setSourceCode(sourceCode: string = "") {
      this.sourceCode = sourceCode;
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
    setSimulateAlarmTimer(timer: any) {
      this.simulateAlarmTimer = timer;
    },

    setKeywordConfig(keywordConfig: { [key: string]: any }) {
      this.keywordConfig = keywordConfig;
    },

    // 设置导航树数据及关联关系为空
    setNavTreeAndRelation() {
      this.navigationTree = [];
      this.relationMap = {};
    },
    // 设置地图实例
    setMapCase(data: VisualMap) {
      this.mapCase = data;
      this.mapCase.set("tackListMap", {});
    }
  },
  persist: piniaPersistConfig("gis")
});

// 格式化树数据，按order进行排序
const formatTree = (tree: any[]) => {
  tree.sort(function (a: any, b: any) {
    const param1 = a.order;
    const param2 = b.order;
    return param1 - param2;
  });
  tree.forEach(function (item: any) {
    if (item.children && item.children.length > 0) {
      formatTree(item.children);
    } else {
      item.children = null;
    }
  });
  return tree;
};

// 提取绑定关系
const collectRelation = (nodes: any[]) => {
  // 递归
  const collectBindRelation = (function () {
    const result: { [key: string]: any } = {};
    return function collect(tree: any[], equipType: { equipType: number; equipTypeName: string } | null) {
      if (Array.isArray(tree) && tree.length > 0) {
        tree.forEach(function (element) {
          let deviceType = null;
          const { children, nodeRelatedModel, id, name, code, associationInfo, nodeType, equipNodeFlag } = element;

          // 由于接口为返回的设备节点没有设备类型信息，需要从父节点获取
          // 如果是设备类型节点，将设备类型id、name传给子节点(如果不是设备树不塞)
          if (nodeRelatedModel?.toLocaleLowerCase() === "eam_eqp_equip_type") {
            deviceType = {
              equipType: id,
              equipTypeName: name
            };
          }

          // 如果是设备并且已绘制标签
          if (equipNodeFlag && associationInfo) {
            result[associationInfo.associationObjectCode] = {
              id,
              name,
              code,
              associationInfo,
              nodeType,
              model: nodeRelatedModel,
              ...equipType
            };
          }

          if (Array.isArray(children) && children.length > 0) {
            collect(children, deviceType);
          }
        });
      }
      return result;
    };
  })();
  return collectBindRelation(nodes, null);
};
