<!-- 选择树节点是线类型节点（根据选择已绘制设备的点生成） -->
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
          <!-- 选中标签配置存在且选择了列表点数据 -->
          <el-button type="primary" @click="beforeOnDraw" :disabled="!currentTarget.gisLabelConfig || table.data.length === 0"
            >生成标签</el-button
          >
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
              <el-link class="my-el-link" type="primary" :underline="false" @click="onUp(scope.row)">上移</el-link>
              <el-link class="my-el-link" type="primary" :underline="false" @click="onDown(scope.row)">下移</el-link>
              <el-link class="my-el-link" type="primary" :underline="false" @click="onRemove(scope.row)">删除</el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <!-- 选择设备弹框给列表增加选项 -->
    <el-dialog
      title="选择设备"
      v-model="dialogVisible"
      width="1150px"
      :close-on-click-modal="false"
      append-to-body
      :destroy-on-close="true"
    >
      <SelectDeviceDialog @on-confirm="onDialogConfirm"></SelectDeviceDialog>
    </el-dialog>
    <StyleDialog ref="styleDialogRef" @success-add="editStyleConfirm"></StyleDialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch, onMounted, ref } from "vue";
import { getTreeData } from "../../api/device";
import { getLabelInfoByEquipId, getEquipListByLine, addLabelSingle, deleteLabelSingle } from "../../api/gis";
import { ElMessage, ElTree, ElMessageBox } from "element-plus";
import type { TableList } from "../type";
import SelectDeviceDialog from "./selectDeviceDialog.vue";
import StyleDialog from "./styleDialog.vue";
import { MAP_DATA_TYPE } from "../hooks/createGeometry";
import { transformLabelType } from "../hooks/index";

const state = reactive({
  defaultProps: {
    children: "progenies",
    label: "name"
  },
  filterText: "",
  treeCode: "drawLineTree"
});

const styleDialogRef = ref();
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
    fetchLineInfo(tuple);
  } else {
    currentTarget.value = {};
    ElMessage.warning("请选择设备节点");
  }
};

const fetchLineInfo = async (id: number) => {
  // 获取该设备已绘制的标签信息
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
      if (gisLabelConfig.dataType === "2") {
        // 线
        currentTarget.value.gisLabelConfig = gisLabelConfig;
        // 存储一份线本身的配置样式（线色、线宽、线型）
        let { lineWidth, lineColor, lineType } = gisLabelConfig;
        originPolygonStyle.value = { lineWidth, lineColor, lineType };
      } else {
        ElMessage.warning("请选择线类型节点");
      }
    } else {
      ElMessage.warning("请先配置标签类型");
    }

    // 获取生成线路的设备点信息
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
const originPolygonStyle = ref<{ [key: string]: any }>({});
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

// 生成标签前更改样式弹框
const beforeOnDraw = () => {
  if (table.value.data.length < 2) {
    ElMessage.warning("请至少选择2个设备");
    return;
  }
  // 初始化样式信息
  styleDialogRef.value?.openDialog(originPolygonStyle.value, "drawLine");
};

// 更改绘制面的样式并进行绘制
const editStyleConfirm = (styleObj: { [key: string]: any }) => {
  let { gisLabelConfig = {} } = currentTarget.value;
  let { lineWidth, lineColor, lineType } = styleObj; // 面填充色 线宽 线色 线型
  gisLabelConfig.lineWidth = lineWidth;
  gisLabelConfig.lineColor = lineColor;
  gisLabelConfig.lineType = lineType;
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

// 生成标签
const drawHandler = () => {
  const { id, assetId, code, name, assetModel, associationType, layer, type, gisLabelConfig } = currentTarget.value;
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

  table.value.data.forEach(item => {
    const labelData = JSON.parse(item.labelData);
    coordinates.push(labelData.coordinates);
  });

  let styleData = transformLabelType(gisLabelConfig);

  // 要保存的标签数据，包括地理信息和图形信息
  let labelData = {
    coordinates,
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
      ElMessage.success("绘制成功");
      fetchLineInfo(assetId);
    },
    error => {
      console.warn(error);
      ElMessage.error("绘制失败");
    }
  );
};

// 删除标签(线)
const deleteHandler = () => {
  const { id, assetId } = currentTarget.value;
  deleteLabelSingle(id).then(
    () => {
      fetchLineInfo(assetId);
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

// 计算sequence，并排序
const calcSequence = function () {
  table.value.data = table.value.data
    .map((item, index) => {
      item.sequence = index;
      return item;
    })
    .sort((a, b) => a.sequence - b.sequence);
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
    }
    .main-content-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    .right-align {
      display: flex;
      justify-content: flex-end;
    }
  }
  .layer-config-table {
    height: calc(100% - 60px);
    overflow-y: auto !important;
    .my-el-link {
      margin-right: 12px !important;
    }
  }
}
</style>
