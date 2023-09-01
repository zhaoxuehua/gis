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
            <el-table-column label="名称">
              <template #default="scope">
                <span :style="{ color: scope.row.color }">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <span class="between">
                  <Icon src="View" :size="14" class="operate-icon" v-if="scope.row.viewHide" @click="viewHide(scope.row)"></Icon>
                  <Icon src="Hide" :size="14" class="operate-icon" v-else @click="viewHide(scope.row)"></Icon>
                  <Icon src="Location" :size="14" class="operate-icon" @click="toLocation(scope.row)"></Icon>
                  <Icon src="DeleteFilled" :size="14" class="operate-icon" @click="deleteRow(scope.row, scope.$index)"></Icon>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
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

// 显示眼睛(显示隐藏轨迹)
const viewHide = (row: any) => {
  row.viewHide = !row.viewHide;
  showHideTrackData(row.code, row.viewHide);
};

// 定位
const toLocation = (row: { [key: string]: any }) => {
  const gisStore = useGisStore();
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

// 监测数据个数据
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
  top: 70px;
  right: 20px;
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
}
</style>
