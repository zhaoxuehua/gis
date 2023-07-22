<!-- 选择树节点是面类型节点：根据已绘制线的坐标信息及缓冲距离生成一个缓冲面 -->
<template>
  <div class="quick-create-main">
    <div class="side-tree">
      <div class="search-bar">
        <el-input placeholder="输入关键字进行过滤" v-model="state.filterText" clearable @keyup.enter="treeSearch"> </el-input>
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
        <el-col :span="6" class="right-align">
          <!-- 选中树节点有标签配置存在  且选择了列表点数据 -->
          <el-button type="primary" @click="onDraw" :disabled="!currentTarget.gisLabelConfig || table.data.length === 0"
            >生成标签</el-button
          >
          <!-- 删除的是左侧选中目标节点数据（针对绘制的面删除） -->
          <el-button type="primary" @click="onDelete" :disabled="!currentTarget.coordinates">删除标签</el-button>
        </el-col>
      </el-row>
      <div class="main-content-list">
        <div style="margin-bottom: 20px">
          <el-button type="primary" @click="onOpenDialog">选择设备</el-button>
        </div>
        <el-table
          :data="table.data"
          class="layer-config-table"
          v-loading="table.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 32 + 'px' }"
          :cell-style="{ padding: '0px' }"
          @selection-change="table.onSelectionChange"
          stripe
          border
        >
          <el-table-column label="设备名称" prop="name"></el-table-column>
          <el-table-column label="设备编码" prop="code"></el-table-column>
          <el-table-column label="GIS标签信息" prop="labelData" show-overflow-tooltip>
            <template #default="scope">
              {{ JSON.stringify(scope.row.labelData) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <!-- <el-button type="primary" link @click="onUp(scope.row)">上移</el-button>
              <el-button type="primary" link @click="onDown(scope.row)">下移</el-button>
              <el-button type="primary" link @click="onRemove(scope.row)">删除</el-button> -->
              <el-link class="my-el-link" type="primary" :underline="false" @click="onUp(scope.row)">上移</el-link>
              <el-link class="my-el-link" type="primary" :underline="false" @click="onDown(scope.row)">下移</el-link>
              <el-link class="my-el-link" type="primary" :underline="false" @click="onRemove(scope.row)">删除</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <!-- 选择设备弹框给列表增加线选项 -->
    <el-dialog
      title="选择设备"
      v-model="dialogVisible"
      width="1150px"
      :close-on-click-modal="false"
      append-to-body
      :destroy-on-close="true"
    >
      <SelectDeviceToCreatePolygonDialog @on-confirm="onDialogConfirm" :type="props?.type"></SelectDeviceToCreatePolygonDialog>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch, onMounted, ref } from "vue";
import * as turf from "@turf/turf";
import { getTreeData } from "@/api/device";
import { getLabelInfoByEquipId, getEquipListByLine, addLabelSingle, deleteLabelSingle } from "@/api/gis.js";
import { ElMessage, ElTree, ElMessageBox } from "element-plus";
import type { TableList } from "../type";
import SelectDeviceToCreatePolygonDialog from "./selectDeviceToCreatePolygonDialog.vue";
import { MAP_DATA_TYPE } from "../hooks/createGeometry";
import { transformLabelType } from "../hooks/index";

const props = withDefaults(defineProps<{ type: string; distance?: any }>(), {
  type: "",
  distance: 0
});
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

// 树节点点击事件
const handleNodeClick = (data: any) => {
  table.value.data = [];
  table.value.total = 0;
  const { model, tuple, name } = data;
  query.value.lineId = tuple;
  // 是否为设备
  if (model.toLocaleLowerCase() === "eam_eqp_equip") {
    currentTarget.value = {
      name,
      assetId: tuple,
      assetModel: model,
      associationType: 5
    };
    fetchPolygonInfo(tuple);
  } else {
    currentTarget.value = {};
    ElMessage.warning("请选择设备节点");
  }
};

// 根据选中的设备节点获取配置、绘制信息
const fetchPolygonInfo = async (id: number) => {
  const res: { [key: string]: any } = await getLabelInfoByEquipId([id]);
  if (res?.data) {
    const { gisLabelInfo, gisLabelConfig } = res.data[0];
    // 已绘制标签信息（currentTarget中添加gisLabelInfo信息）
    if (gisLabelInfo) {
      const { id, code, name, labelData, refLayerId, labelTypeId } = gisLabelInfo;
      const { coordinates } = JSON.parse(labelData);
      currentTarget.value = { ...currentTarget.value, id, code, name, coordinates, layer: refLayerId, type: labelTypeId };
    } else {
      currentTarget.value = { ...currentTarget.value, id: null, code: null, coordinates: null, layer: null, type: null };
    }
    // 标签配置信息（（currentTarget中添加gisLabelConfig信息））
    if (gisLabelConfig) {
      if (gisLabelConfig.dataType === "3") {
        // 面
        currentTarget.value.gisLabelConfig = gisLabelConfig;
      } else {
        ElMessage.warning("请选择面类型节点");
      }
    } else {
      ElMessage.warning("请先配置标签类型");
    }

    // 获取生成面的线节点信息
    table.value.getTableData();
  }
};

onMounted(() => {
  getTreeData(state.treeCode).then(
    (res: any) => {
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
  lineId: 0,
  equipName: ""
});

const currentTarget = ref<{ [key: string]: any }>({});
const dialogVisible = ref<boolean>(false); // 选择设备弹框

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await getEquipListByLine(query.value.lineId);
    if (res.code == 200) {
      if (res.data?.parts) {
        table.value.data = res.data.parts?.sort(function (a: any, b: any) {
          return a.sequence - b.sequence;
        });
      } else {
        table.value.data = [];
      }
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    table.value.ids = selection.map((item: any) => item.id);
  },
  onEdit: () => {}
});

// 生成标签按钮事件
const onDraw = () => {
  ElMessageBox.confirm("确定要生成标签吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      drawHandler();
    })
    .catch(() => {});
};

// 删除标签按钮事件
const onDelete = () => {
  ElMessageBox.confirm("确定删除标签吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      deleteHandler();
    })
    .catch(() => {});
};

// 生成标签：根据线坐标及缓冲距离生成缓冲面
const drawHandler = () => {
  const { id, assetId, code, name, assetModel, associationType, layer, type, gisLabelConfig } = currentTarget.value;
  // 面（线数组组合） [[[],[]]]
  const coordinates: any[] = [];
  let result = {
    id,
    assetId: String(assetId),
    code,
    name,
    assetModel,
    associationType,
    layer,
    type,
    parts: table.value.data.map(item => {
      return { objectId: item.objectId, sequence: item.sequence };
    }),
    labelData: ""
  };

  if (table.value.data.length < 1) {
    ElMessage.warning("请至少选择1个设备");
    return;
  }

  table.value.data.forEach(item => {
    const labelData = JSON.parse(item.labelData);
    coordinates.push(labelData.coordinates);
  });

  // 缓冲单面的坐标数据处理
  let bufferDistance = Number(props.distance);
  if (!bufferDistance) {
    ElMessage.warning("请设置缓冲距离");
    return;
  }

  // 创建一个空的缓冲要素集合
  let bufferFeatures: any = [];
  // 遍历每条线并执行缓冲操作
  coordinates.forEach(function (coords) {
    let line = turf.lineString(coords);
    let bufferedLine = turf.buffer(line, bufferDistance, { units: "meters" });
    bufferFeatures.push(bufferedLine);
  });

  let mergedPolygon: any;
  if (bufferFeatures.length === 1) {
    mergedPolygon = turf.getCoords(bufferFeatures[0]); // 将单条线转换为多边形
  } else if (bufferFeatures.length > 1) {
    let unionedFeature: any = turf.union(bufferFeatures[0], bufferFeatures[1]); // 合并前两个要素
    // 循环合并剩余的要素
    for (let i = 2; i < bufferFeatures.length; i++) {
      let mergedResult = turf.union(unionedFeature, bufferFeatures[i]);
      unionedFeature = mergedResult;
    }
    mergedPolygon = unionedFeature;
  }
  let polygonCoordinates: any;
  if (mergedPolygon) {
    // 提取多边形的坐标数据
    polygonCoordinates = turf.getCoords(mergedPolygon);
  }
  let styleData = transformLabelType(gisLabelConfig);

  // 要保存的标签数据，包括地理信息和图形信息
  let labelData = {
    coordinates: polygonCoordinates,
    style: {
      type: styleData.type,
      fill: styleData.fill,
      stroke: styleData.stroke,
      lineVector: styleData.lineVector,
      text: {}
    },
    isDefaultDisplayLabelName: gisLabelConfig.isDefaultDisplayLabelName
  };

  // 如果需要显示标注
  if (gisLabelConfig.isDefaultDisplayLabelName) {
    labelData.style.text = styleData.text;
  }

  // 如果已经绘制过
  if (id) {
    result.labelData = JSON.stringify(labelData);
  } else {
    let type = gisLabelConfig.dataType;
    if (["1", "2", "3", "4", "5", "6", "7"].includes(type)) {
      type = MAP_DATA_TYPE[type]?.value;
    }
    result = Object.assign(result, {
      code: "GIS" + type + +new Date(),
      layer: gisLabelConfig.layerConfigId,
      type: gisLabelConfig.id,
      labelData: JSON.stringify(labelData)
    });
  }

  addLabelSingle(result).then(
    () => {
      ElMessage.success("创建成功");
      fetchPolygonInfo(assetId);
    },
    error => {
      console.warn(error);
      ElMessage.error("创建失败");
    }
  );
};

// 删除标签(面)  当前树节点面有坐标数据的coordinates才可删除
const deleteHandler = () => {
  const { id, assetId } = currentTarget.value;
  deleteLabelSingle(id).then(
    () => {
      fetchPolygonInfo(assetId);
      ElMessage.success("删除成功");
    },
    err => {
      console.warn(err);
      ElMessage.error("删除失败");
    }
  );
};

// 打开选择设备弹窗
const onOpenDialog = () => {
  dialogVisible.value = true;
};

// 关闭选择设备弹窗
const onDialogClose = () => {
  dialogVisible.value = false;
};

// 计算sequence，并排序
const calcSequence = function () {
  table.value.data = table.value.data
    .map((item, index) => {
      item.sequence = index;
      return item;
    })
    .sort((a, b) => a.sequence - b.sequence);
};

// 上移
const onUp = (item: any) => {
  const currentIndex = table.value.data.findIndex(element => element.assetId === item.assetId);
  if (currentIndex === 0) {
    ElMessage.warning("不能再往上移了");
    return;
  }
  const currentItem = table.value.data.splice(currentIndex, 1)[0];
  table.value.data.splice(currentIndex - 1, 0, currentItem);
  calcSequence();
};

// 下移
const onDown = (item: any) => {
  const currentIndex = table.value.data.findIndex(element => element.assetId === item.assetId);
  if (currentIndex === table.value.data.length - 1) {
    ElMessage.warning("不能再往下移了");
    return;
  }
  const currentItem = table.value.data.splice(currentIndex, 1)[0];
  table.value.data.splice(currentIndex + 1, 0, currentItem);
  calcSequence();
};

// 删除
const onRemove = (item: any) => {
  const currentIndex = table.value.data.findIndex(element => element.assetId === item.assetId);
  table.value.data.splice(currentIndex, 1);
  calcSequence();
};

// 选择设备确认
const onDialogConfirm = (selection: Array<any>) => {
  // 关闭弹窗
  onDialogClose();
  // 将选择的设备与已有列表数据合并
  selection.forEach(item => {
    const { id, code, name, gisLabelInfo } = item;
    const exist = table.value.data.some(element => {
      if (element.assetId === id) {
        return true;
      }
      return false;
    });
    // 选择的弹框列表数据在列表中未存在
    if (!exist) {
      table.value.data.push({
        assetId: id,
        code,
        name,
        objectId: gisLabelInfo.id,
        labelData: gisLabelInfo.labelData
      });
      calcSequence();
    }
  });
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
      height: calc(100% - 72px);
      padding: 0 10px;
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
      .right-align {
        display: flex;
        justify-content: flex-end;
      }
    }
    .main-content-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
  }
  .layer-config-table {
    height: calc(100% - 60px);
    .my-el-link {
      margin-right: 12px !important;
    }
  }
}
</style>
