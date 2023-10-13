<!-- 根据提前录入的坐标信息gisCoord 可以为点类型的设备批量绘制 -->
<!-- 获取设备列表=>获取设备对应的标签配置及绘制信息塞入表格数据 -->
<!-- 可选逻辑：配置过标签类型&&是点&&有录入坐标 -->
<!-- 删除：过滤gisLabelInfo -->
<!-- 绘制： 选择的都会重新绘制-->
<template>
  <div class="quick-create-main">
    <div class="main-content">
      <el-form :model="query.params">
        <el-row :gutter="20" class="action-bar">
          <el-col :span="10">
            <el-form-item label="设备名称" style="float: left; margin-right: 15px; margin-bottom: 0">
              <el-input
                class="action-search"
                placeholder="请输入..."
                v-model="query.params.name"
                clearable
                @keyup.enter.stop="querySearch"
                @clear="querySearch"
                style="width: 200px"
              ></el-input>
            </el-form-item>
            <el-button type="primary" @click="querySearch"><Icon src="Search"></Icon>搜索</el-button>
          </el-col>
          <el-col :span="14" class="right-align">
            <el-button type="primary" @click="onDraw" :disabled="table.chooseList.length === 0">批量生成标签</el-button>
            <el-button type="primary" @click="onDelete" :disabled="table.chooseList.length === 0">快速删除</el-button>
          </el-col>
        </el-row>
      </el-form>

      <div class="main-content-list">
        <el-table
          class="layer-config-table"
          :data="table.data"
          v-loading="table.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 32 + 'px' }"
          :cell-style="{ padding: '0px' }"
          @selection-change="table.onSelectionChange"
          stripe
          border
        >
          <el-table-column type="selection" :selectable="selectable"></el-table-column>
          <el-table-column label="设备编码" prop="code"></el-table-column>
          <el-table-column label="设备名称" width="200">
            <template #default="scope">
              {{ scope.row.name }}
            </template>
          </el-table-column>
          <el-table-column label="设备类型" prop="equipTypeName"></el-table-column>
          <el-table-column label="启用状态" prop="enable" width="80">
            <template #default="scope">
              {{ scope.row.enable ? "启用" : "禁用" }}
            </template>
          </el-table-column>
          <el-table-column label="GIS标签信息" prop="gisLabelInfo" show-overflow-tooltip>
            <template #default="scope">
              {{ JSON.stringify(scope.row.gisLabelInfo) }}
            </template>
          </el-table-column>
          <el-table-column label="GIS坐标" prop="gisCoord" show-overflow-tooltip></el-table-column>
        </el-table>
        <div v-if="table.data?.length">
          <el-pagination
            :background="true"
            v-model:current-page="query.params.pageNumber"
            v-model:page-size="query.params.pageSize"
            :page-sizes="[10, 20, 30, 50, 100]"
            layout="total, prev, pager, next, sizes"
            :total="table.total"
            :small="true"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { cloneDeep } from "lodash";
import { handleParam } from "@/utils/common.js";
import { getAssetDeviceEquipList } from "../../api/device";
import { getLabelInfoByEquipId, addLabelBatch, deleteLabelBatch } from "../../api/gis.js";
import Icon from "./Icon.vue";
import type { TableList } from "../type";
import { MAP_DATA_TYPE } from "../hooks/createGeometry";
import { transformLabelType } from "../hooks/index";

const query = ref({
  params: {
    name: "",
    orderByColumn: "",
    isAsc: "",
    pageNumber: 1,
    pageSize: 10
  },
  getPagination: (obj: any) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});
const handleSizeChange = (val: any) => {
  query.value.getPagination({ page: 1, limit: val });
};

const handleCurrentChange = (val: any) => {
  query.value.getPagination({ page: val, limit: query.value.params.pageSize });
};

const table = ref<TableList & { chooseList: any[] }>({
  loading: false,
  total: 0,
  ids: [],
  chooseList: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const [queryString, params] = handleParam(query.value.params);
    const res: { [key: string]: any } = await getAssetDeviceEquipList(queryString, params);

    if (res && res.items) {
      const equipList = cloneDeep(res.items); // 当前页的数据
      const chooseList = equipList.map((item: { [key: string]: any }) => item.id);
      if (chooseList && chooseList.length) {
        // 获取该设备已绘制的标签信息
        const response: { [key: string]: any } = await getLabelInfoByEquipId(chooseList);
        if (response?.data) {
          response.data.forEach((item: any) => {
            equipList.some((equip: { [key: string]: any }) => {
              if (equip.id === item.id) {
                if (item.gisLabelConfig) {
                  equip.gisLabelConfig = item.gisLabelConfig;
                }
                equip.gisLabelInfo = item.gisLabelInfo;

                return true;
              }
              return false;
            });
          });
        }
      }
      table.value.data = equipList;
      table.value.total = res.totalNum;
    } else {
      table.value.data = [];
      table.value.total = 0;
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    table.value.chooseList = selection;
  },
  onEdit: () => {}
});

const querySearch = () => {
  query.value.params.pageNumber = 1;
  query.value.onQuery();
};

// 快速绘制按钮事件
const onDraw = () => {
  ElMessageBox.confirm("确定要批量生成标签吗？", "提示", {
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

// 批量绘制点
const drawHandler = () => {
  // 生成接口所需的数据结构
  const result = table.value.chooseList
    // 过滤选择列表中未绘制的(无gisLabelInfo)
    .filter(item => {
      return !item.gisLabelInfo && item.gisLabelConfig;
    })
    .map((item, index) => {
      const { id, name, gisLabelConfig } = item;
      const lonLat = item.gisCoord.split(",");
      if (name) {
        gisLabelConfig.name = name;
      }
      const labelData = createLabelData(gisLabelConfig, lonLat);
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
  if (result?.length === 0) {
    ElMessage.warning("选择的设备均已绘制或未找到对应的标签配置");
    return;
  }

  addLabelBatch(result).then(
    () => {
      ElMessage.success("绘制成功");
      table.value.getTableData();
    },
    error => {
      console.warn(error);
      ElMessage.error("绘制失败");
    }
  );
};

// 批量删除
const deleteHandler = () => {
  // 过滤出选择列表已绘制的标签进行删除
  const labelIds = table.value.chooseList
    .filter(item => {
      return item.gisLabelInfo; // 删除时过滤出有标签信息的进行删除
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

const selectable = (row: any) => {
  return row.gisLabelConfig && (row.gisLabelConfig.dataType === "Point" || row.gisLabelConfig.dataType == "1") && row.gisCoord;
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.quick-create-main {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 100%;
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
    height: calc(100% - 50px);
    overflow-y: auto !important;
  }
}
</style>
