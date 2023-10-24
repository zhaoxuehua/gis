<template>
  <div class="trackListBox" v-show="isShowHide">
    <div class="map-popup">
      <div class="popup-box">
        <div class="map-popup-header">
          <span>轨迹列表 </span>
          <Icon src="Close" :size="14" class="icon" @click="close"></Icon>
        </div>
        <div class="map-popup-body">
          <el-table
            :data="tableData"
            class="track-table"
            highlight-current-row
            empty-text="暂无数据"
            :row-style="{ height: 32 + 'px' }"
            :cell-style="{ padding: '0px' }"
            stripe
            border
          >
            <el-table-column :label="keywordConfig?.code || '编码'">
              <template #default="scope">
                <span :style="{ color: scope.row.color }">{{ scope.row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="keywordConfig?.name || '名称'">
              <template #default="scope">
                <span :style="{ color: scope.row.color }">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <span class="between">
                  <Icon
                    src="View"
                    :size="14"
                    :style="{ color: scope.row.color }"
                    v-if="scope.row.viewHide"
                    @click="viewHide(scope.row)"
                    title="隐藏"
                  ></Icon>
                  <Icon
                    src="Hide"
                    :size="14"
                    :style="{ color: scope.row.color }"
                    v-else
                    @click="viewHide(scope.row)"
                    title="查看"
                  ></Icon>
                  <Icon
                    src="Location"
                    :size="14"
                    :style="{ color: scope.row.color }"
                    @click="toLocation(scope.row)"
                    title="定位"
                  ></Icon>
                  <Icon
                    src="DeleteFilled"
                    :size="14"
                    :style="{ color: scope.row.color }"
                    @click="deleteRow(scope.row, scope.$index)"
                    title="删除"
                  ></Icon>
                  <Icon
                    src="More"
                    :size="14"
                    :style="{ color: scope.row.color }"
                    @click="onDetail(scope.row)"
                    title="详情"
                  ></Icon>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 轨迹列表详情 -->
    <el-dialog v-model="state.dialogVisible" title="轨迹详情" width="800px" append-to-body>
      <el-table
        :data="state.data"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 32 + 'px' }"
        :cell-style="{ padding: '0px' }"
        max-height="360"
        stripe
        border
        class="track-scrollable-table"
      >
        <template v-for="(item, index) in state.columns" :key="index">
          <el-table-column :label="`${Object.values(item)?.[0]}`" :prop="Object.keys(item)?.[0]" :min-width="150">
            <template v-if="['position'].includes(Object.keys(item)[0])" #default="scope">
              <span>
                {{ scope?.row.position ? moment(scope?.row.position).format("YYYY-MM-DD HH:mm:ss") : "" }}
              </span>
            </template>
          </el-table-column>
        </template>
      </el-table>

      <div v-if="state?.data?.length">
        <el-pagination
          :background="true"
          v-model:current-page="state.pageNumber"
          v-model:page-size="state.pageSize"
          :page-sizes="[10, 20, 30, 50, 100]"
          layout="total, prev, pager, next, sizes"
          :total="state.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, reactive } from "vue";
import moment from "moment";
import Icon from "./Icon.vue";

// ⤵ store
import { useTrackListStore } from "../../stores/modules/trackList";
import { useGisStore } from "../../stores/modules/gis";

// ⤵ 辅助函数
import { labelOnSelect } from "../hooks"; // 定位
import { showHideTrackData, delTrackData, showHideLayer } from "../hooks/createdTrackData"; // 显示隐藏|删除轨迹

// 表格数据
const isShowHide = ref(false);
const tableData = ref<any>([]);
const store = useTrackListStore();
tableData.value = store.data;
const gisStore = useGisStore();

// 关键词配置
const keywordConfig = computed(() => {
  return gisStore?.keywordConfig;
});

/****************************轨迹详情列表相关***********************************************/
const state = reactive({
  dialogVisible: false,
  allData: [],
  data: [], // 列表数据
  total: 0,
  columns: [],
  pageNumber: 1,
  pageSize: 10
});

const getPagination = (obj: any) => {
  state.pageNumber = obj.page;
  state.pageSize = obj.limit;
  const startIndex = (state.pageNumber - 1) * state.pageSize;
  const endIndex = startIndex + state.pageSize;
  state.data = state.allData.slice(startIndex, endIndex);
};

const handleSizeChange = (val: any) => {
  getPagination({ page: 1, limit: val });
};

const handleCurrentChange = (val: any) => {
  getPagination({ page: val, limit: state.pageSize });
};

// 详情
const onDetail = (row: { [key: string]: any }) => {
  state.dialogVisible = true;
  state.pageSize = 10;
  state.pageNumber = 1;
  state.columns = row?.trackDetailHeaderList || [];
  state.allData = row?.trackDetailListData || [];
  state.total = row?.trackDetailListData?.length || 0;
  state.data = state.allData.slice(0, state.pageSize);
};

/****************************轨迹详情列表相关*********************************************/

// 显示眼睛(显示隐藏轨迹)
const viewHide = (row: any) => {
  row.viewHide = !row.viewHide;
  showHideTrackData(row.code, row.viewHide);
};

// 定位
const toLocation = (row: { [key: string]: any }) => {
  const mapCase = gisStore.mapCase;
  labelOnSelect(mapCase, row.code, false, true);
};

// 关闭(数据置空)
const close = () => {
  tableData.value.forEach((v: any) => {
    delTrackData(v.code);
  });
  tableData.value.splice(0, tableData.value.length);
};

// 删除
const deleteRow = (row: { [key: string]: any }, index: number) => {
  delTrackData(row.code);
  tableData.value.splice(index, 1);
};

// 监测数据个数据（控制列表的显示隐藏及隐藏实时数据图层）
watch(
  () => tableData.value.length,
  n => {
    isShowHide.value = n !== 0;
    n == 0 && showHideLayer(true);
  }
);
</script>

<style lang="scss" scoped>
.trackListBox {
  position: absolute;
  top: 60px;
  right: 15px;
  z-index: 10;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
  .popup-box {
    width: 340px;
    .map-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 20px;
      background-color: #f7f7fa;
      span {
        font-size: 16px;
      }
    }
    .map-popup-body {
      padding: 20px;
      font-size: 14px;
    }
    .between {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 0 10px;
      color: var(--el-color-primary);
      i {
        cursor: pointer;
      }
    }
  }
  .track-scrollable-table .el-table__header-wrapper {
    overflow-x: auto;
    white-space: nowrap;
  }
}
:deep(.el-pagination) {
  padding: 0;
  .el-pagination__sizes {
    margin-right: 0 !important;
    margin-left: 16px !important;
  }
}
</style>
