<!-- 按面创建点：选择已绘制的面，在选择需要添加的设备点，需要刷新 -->
<template>
  <div class="quick-create-main">
    <div class="side-tree">
      <div class="search-bar">
        <el-input
          placeholder="输入关键字进行过滤"
          v-model="state.filterText"
          clearable
          @keyup.enter="treeSearch"
          class="navigation-tree-content-filter"
        >
        </el-input>
      </div>
      <div class="tree-content">
        <el-tree
          :data="treeData"
          :props="state.defaultProps"
          @node-click="handleNodeClick"
          :filter-node-method="filterNode"
          ref="treeRef"
        >
        </el-tree>
      </div>
    </div>
    <div class="main-content">
      <el-row class="action-bar">
        <el-col :span="8">
          <label>当前选中对象：</label>
          <span class="target-info" :title="currentTarget.name">{{ currentTarget.name }}</span>
        </el-col>
        <el-col :span="10">
          <label>选中对象坐标：</label>
          <span class="target-info" :title="JSON.stringify(currentTarget.coordinates)">
            {{ currentTarget.coordinates }}
          </span>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="onDraw" :disabled="!currentTarget.coordinates || table.ids.length === 0"
            >快速绘制</el-button
          >
          <el-button type="primary" @click="onDelete" :disabled="table.ids.length === 0">快速删除</el-button>
        </el-col>
      </el-row>
      <div class="main-content-list">
        <el-table
          :data="table.data"
          class="layer-config-table"
          v-loading="table.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 32 + 'px' }"
          :cell-style="{ padding: '0px' }"
          @selection-change="table.onSelectionChange"
        >
          <el-table-column type="selection" :selectable="selectable"></el-table-column>
          <el-table-column label="设备名称" prop="name"></el-table-column>
          <el-table-column label="设备编码" prop="code"></el-table-column>
          <el-table-column label="GIS标签信息" prop="gisLabelInfo" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.gisLabelInfo }}
            </template>
          </el-table-column>
          <el-table-column label="GIS标签类型" prop="gisLabelConfig">
            <template #default="scope">
              {{ scope.row.gisLabelConfig ? scope.row.gisLabelConfig.name : "未配置" }}
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          v-if="table.data?.length"
          :total="table.total"
          v-model:page="query.pageNo"
          v-model:limit="query.pageSize"
          @pagination="query.getPagination"
        ></Pagination>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, watch, onMounted, ref } from "vue";
import { getTreeData } from "@/api/device";
import { getLabelInfoByEquipId, getEquipListByNodeCode, addLabelBatch, deleteLabelBatch } from "@/api/gis.js";
import { ElMessage, ElTree, ElMessageBox } from "element-plus";
import Feature from "ol/Feature";
import { Polygon } from "ol/geom";
import { point as turfPoint, polygon as turfPolygon, randomPosition, booleanPointInPolygon } from "@turf/turf";
import type { TableList } from "../type";
import { transformLabelType } from "../hooks/index";
import { MAP_DATA_TYPE } from "../hooks/createGeometry";

const state = reactive({
  defaultProps: {
    children: "progenies",
    label: "name"
  },
  filterText: "",
  treeCode: "tunneltree"
});

// 树实例
const treeRef = ref();
// 树数据
const treeData = ref<Array<any>>([]);
// 树节点点击事件(只能是设备节点点击获取列表)
const handleNodeClick = (data: any) => {
  query.value.pageNo = 1;
  table.value.data = [];
  table.value.total = 0;
  const { model, tuple, code } = data;
  query.value.nodeCode = code; // 点击节点的code
  // 是否为设备
  if (model.toLocaleLowerCase() === "eam_eqp_equip") {
    // 获取该设备已绘制的标签信息（例如分区00001）
    getLabelInfoByEquipId([tuple]).then(
      (res: any) => {
        if (res.code == 200 && res.data) {
          const { gisLabelInfo } = res.data[0];
          if (gisLabelInfo) {
            // gis绘制信息
            const { code, name, labelData } = gisLabelInfo;
            const { coordinates, style } = JSON.parse(labelData);
            if (style?.type === "Polygon" || style?.type === "3") {
              // 只能是面的信息
              currentTarget.value = {
                code,
                name,
                coordinates
              };
              table.value.getTableData();
            } else {
              currentTarget.value = {};
              ElMessage.warning("请选择面类型的节点");
            }
          } else {
            currentTarget.value = {};
          }
        } else {
          currentTarget.value = {};
        }
      },
      (err: any) => {
        currentTarget.value = {};
        console.error(err);
        ElMessage.error("接口异常");
      }
    );
  } else {
    ElMessage.warning("请选择设备节点");
  }
};

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
};

const treeSearch = () => {
  treeRef.value.filter(state.filterText);
};

watch(
  () => state.filterText,
  val => {
    treeRef.value.filter(val);
  }
);

onMounted(() => {
  getTreeData(state.treeCode).then(
    (res: { [key: string]: any }) => {
      if (res.code === 200 && res.data) {
        treeData.value = res.data;
      } else {
        console.error(res.msg);
        ElMessage.error("接口异常");
      }
    },
    (err: any) => {
      console.error(err);
      ElMessage.error("接口异常");
    }
  );
});

// 查询条件
const query = ref<{ [key: string]: any }>({
  nodeCode: "", // 点击树节点的code
  equipName: "",
  pageNo: 1,
  pageSize: 10,
  getPagination: (obj: any) => {
    query.value.pageNo = obj.page;
    query.value.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const currentTarget = ref<{ [key: string]: any }>({}); // 当前选中左侧树是设备节点且是面的信息（选中对象及坐标）

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await getEquipListByNodeCode({
      treeCode: state.treeCode,
      nodeCode: query.value.nodeCode,
      pageNo: query.value.pageNo,
      pageSize: query.value.pageSize
    });
    if (res.data.items) {
      table.value.data = res.data.items;
      table.value.total = res.data.totalNum;
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    table.value.ids = selection.map((item: { [key: string]: any }) => item.id);
  },
  onEdit: () => {}
});

// 快速绘制按钮事件
const onDraw = () => {
  ElMessageBox.confirm("确定要快速绘制吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      drawHandler();
    })
    .catch(() => {});
};

// 批量删除按钮事件
const onDelete = () => {
  ElMessageBox.confirm("确定删除选择的标签吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      deleteHandler();
    })
    .catch(() => {});
};

// 批量绘制（根据面的坐标绘制面位置下选中点的标签）
const drawHandler = () => {
  if (currentTarget.value.coordinates && table.value.ids.length !== 0) {
    // 过滤选择列表中未绘制的点类型的数据(无gisLabelInfo)
    const equipList = table.value.data.filter(function (item) {
      return (
        table.value.ids.includes(item.id) &&
        !item.gisLabelInfo &&
        item.gisLabelConfig &&
        (item.gisLabelConfig.dataType === "Point" || item.gisLabelConfig.dataType === "1")
      );
    });
    if (equipList.length === 0) {
      ElMessage.warning("选择的设备均已绘制或未找到对应的标签配置");
      return;
    }

    // 多边形区域
    const polygon = new Feature({
      geometry: new Polygon(currentTarget.value.coordinates)
    });

    const polyGoem = polygon.getGeometry();
    if (!polyGoem) return;
    // 获取多边形的包围盒
    const extent = polyGoem.getExtent();
    const count = equipList.length;
    const points: any[] = []; // 点坐标数组
    while (points.length < count) {
      //随机生成包围盒范围内的点
      const position = randomPosition([extent[0], extent[1], extent[2], extent[3]]);
      const pt = turfPoint(position);

      const polygonCoordinates = polyGoem.getCoordinates();
      const py = turfPolygon(polygonCoordinates);
      // 判断随机点是否在多边形内
      if (booleanPointInPolygon(pt, py)) {
        points.push(position);
      }
    }

    // 生成接口所需的数据结构
    const result = equipList.map(function (item, index) {
      const { id, name, gisLabelConfig } = item;
      const labelData = createLabelData(gisLabelConfig, points[index]); // 标签类型及点坐标
      let type = gisLabelConfig.dataType;
      if (["1", "2", "3", "4", "5", "6", "7"].includes(type)) {
        type = MAP_DATA_TYPE[type]?.value;
      }
      const labelCode = "GIS" + type + +new Date() + "_" + index;
      return {
        assetId: String(id),
        assetModel: "EAM_EQP_EQUIP",
        code: labelCode,
        name: name, // 标签名称
        associationType: 5,
        layer: gisLabelConfig.layerConfigId,
        type: gisLabelConfig.id,
        labelData: JSON.stringify(labelData) // 标签数据
      };
    });
    if (result.length === 0) return;
    addLabelBatch(result).then(
      () => {
        ElMessage.success("创建成功");
        table.value.getTableData();
      },
      error => {
        console.warn(error);
        ElMessage.error("创建失败");
      }
    );
  }
};

// 批量删除标签
const deleteHandler = () => {
  // 过滤出已选择点的已绘制标签信息(存在gisLabelInfo)
  const labelIds = table.value.data
    .filter(item => {
      return table.value.ids.includes(item.id) && item.gisLabelInfo;
    })
    .map(item => item.gisLabelInfo.id);

  if (labelIds.length === 0) {
    ElMessage.warning("请选择已绘制标签的记录");
    return;
  }

  deleteLabelBatch(labelIds).then(
    () => {
      ElMessage.success("删除成功");
      table.value.getTableData();
    },
    error => {
      console.warn(error);
      ElMessage.error("删除失败");
    }
  );
};

// 生成标签数据，返回labelData字段需要的内容
const createLabelData = (featureType: any, featureCoordinates: any) => {
  let styleData = transformLabelType(featureType);
  let radius = 10; // 圆的半径， 默认10
  // 要保存的标签数据，包括地理信息和图形信息
  let labelData: any = {
    coordinates: featureCoordinates,
    radius: radius,
    style: { type: styleData.type },
    isDefaultDisplayLabelName: featureType.isDefaultDisplayLabelName
  };

  // 根据图形类型组装需要的style样式
  if (featureType.dataType === "Point" || featureType.dataType === "1") {
    Object.assign(labelData.style, {
      icon: styleData.icon
    });
  } else if (featureType.dataType === "Text" || featureType.dataType === "6") {
    Object.assign(labelData.style, {
      text: styleData.text
    });
  } else {
    Object.assign(labelData.style, {
      fill: styleData.fill,
      stroke: styleData.stroke,
      lineVector: styleData.lineVector
    });
  }

  // 如果需要显示标注
  if (featureType.isDefaultDisplayLabelName && featureType.dataType !== "Text" && featureType.dataType !== "6") {
    labelData.style.text = styleData.text;
  }

  return labelData;
};
// 列表可选项需是配置了标签相关信息且是点类型
const selectable = (row: any) => {
  return row.gisLabelConfig && (row.gisLabelConfig.dataType === "Point" || row.gisLabelConfig.dataType === "1");
};
</script>

<style lang="scss" scoped>
.quick-create-main {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 100%;
  .side-tree {
    width: 250px;
    border-right: #dadee5 solid 1px;
    .search-bar {
      padding: 20px;
    }
    .tree-content {
      height: calc(100% - 70px);
      overflow: auto;
    }
  }
  .main-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    .action-bar {
      align-items: center;
      padding: 20px;
      border-bottom: #dadee5 solid 1px;
      label {
        display: inline-block;
      }
      .target-info {
        display: inline-block;
        width: 160px;
        height: 36px;
        overflow: hidden;
        line-height: 36px;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }
    .main-content-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
  }
  .layer-config-table {
    height: calc(100% - 50px);
  }
}
</style>
