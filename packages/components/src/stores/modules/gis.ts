import { defineStore } from "pinia";
import { cloneDeep } from "lodash";
import { ElMessage } from "element-plus";
import piniaPersistConfig from "@/config/piniaPersist";
import { getGisCustomTree } from "@/api/gis.js";

export const useGisStore = defineStore({
  id: "gis",
  state: (): any => ({
    navigationTree: [], // 导航树
    relationMap: {}, // 关联关系
    sourceCode: "",
    isDynamicLine: false, // 线环闪烁维护字段
    imgIndex: 0 // 动画点图片索引
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
          const { children, nodeRelatedModel, id, name, code, associationInfo, nodeType } = element;

          // 由于接口为返回的设备节点没有设备类型信息，需要从父节点获取
          // 如果是设备类型节点，将设备类型id、name传给子节点
          if (nodeRelatedModel.toLocaleLowerCase() === "eam_eqp_equip_type") {
            deviceType = {
              equipType: id,
              equipTypeName: name
            };
          }

          // 如果是设备并且已绘制标签
          if (nodeRelatedModel.toLocaleLowerCase() === "eam_eqp_equip" && associationInfo) {
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
