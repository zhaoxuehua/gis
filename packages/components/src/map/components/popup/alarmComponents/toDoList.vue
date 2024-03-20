<!-- 待处理事件 -->
<template>
  <div>
    <el-dialog
      title="待处理事件"
      v-model="state.open"
      width="1150px"
      :close-on-click-modal="false"
      @close="onClose"
      :destroy-on-close="true"
      append-to-body
    >
      <div>
        <el-form :model="query.params">
          <el-row :gutter="20" :span="24">
            <el-col :span="14">
              <el-form-item label="时间：">
                <el-date-picker
                  v-model="query.params.datetime"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  :shortcuts="state?.shortcuts"
                  @change="querySearch"
                  style="width: 400px !important; margin-right: 20px"
                >
                </el-date-picker>
                <el-button type="primary" @click="querySearch"> 搜索 </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="to-do-list-option">
        <el-button :disabled="!table.ids.length" @click="onBatchProcessing('part')">批量处理</el-button>
        <el-button type="primary" @click="onBatchProcessing('all')">全部处理</el-button>
      </div>

      <el-table
        border
        stripe
        :data="table.data"
        class="monitor-todo-list-table"
        v-loading="table.loading"
        highlight-current-row
        @selection-change="table.onSelectionChange"
        height="300px"
      >
        <el-table-column type="selection"></el-table-column>

        <el-table-column label="事件时间" prop="monitorTime"></el-table-column>
        <el-table-column label="事件等级" prop="eventLevelName"></el-table-column>
        <el-table-column label="事件类型" prop="eventTypeName"></el-table-column>
        <el-table-column label="事件子类型" prop="eventSubTypeName"></el-table-column>
        <el-table-column label="事件设备" prop="equipName"></el-table-column>
        <el-table-column label="设备位置" prop="equipLocation"></el-table-column>
        <el-table-column label="事件描述" prop="desc"></el-table-column>
        <el-table-column label="处理状态" prop="processStateName"></el-table-column>
        <el-table-column prop="path" label="操作" class-name="small-padding fixed-width">
          <template #default="scope">
            <div class="monitor-alarm-table-option">
              <div title="单个处理" class="footer-item-icon-only" @click="table.onEdit(scope.row, 'deal')">
                <i :class="`iconfont select-icon-style icon-bell`" class="deal-icon"></i>
              </div>
              <div
                :title="scope.row?.existEventVideo == undefined || scope.row?.existEventVideo ? '视频' : '视频归档中'"
                class="footer-item-icon-only"
                @click="
                  scope.row?.existEventVideo == undefined || scope.row?.existEventVideo ? table.onEdit(scope.row, 'video') : null
                "
              >
                <i
                  :class="[
                    `iconfont select-icon-style icon-video`,
                    { 'disabled-icon': scope.row?.existEventVideo !== undefined ? !scope.row?.existEventVideo : false }
                  ]"
                  v-if="scope.row.videoNum > 0"
                ></i>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="table.data?.length">
        <paginationCom
          :total="table.total"
          v-model:page="query.params.pageNumber"
          v-model:limit="query.params.pageSize"
          @pagination="query.getPagination"
        >
        </paginationCom>
      </div>

      <SingleDeal ref="singleDealRef" @success-handle="successHandle"></SingleDeal>
      <BatchProcessing ref="batchProcessingRef" @success-batch="successBatch"></BatchProcessing>
      <VideoDialog ref="videoDialogRef"></VideoDialog>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { handleParam } from "@/utils/common.js";
import SingleDeal from "./singleDeal.vue";
import BatchProcessing from "./batchProcessing.vue";
import { SHOUT_CUTS } from "./componentConstant";
import { eventList } from "../../../../api/device";
import VideoDialog from "./videoDialog.vue";
import paginationCom from "../../paginationCom.vue";

const emits = defineEmits(["successHandle", "successBatch"]);
const state = reactive({
  open: false,
  shortcuts: SHOUT_CUTS,
  row: null
});

const singleDealRef = ref();
const batchProcessingRef = ref();
const videoDialogRef = ref();

// 查询条件
const defaultParams = JSON.stringify({
  processState: "1,2",
  orderByColumn: "",
  isAsc: "",
  pageNumber: 1,
  pageSize: 10
});

const query = ref({
  params: JSON.parse(defaultParams),
  getPagination: (obj: any) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const querySearch = () => {
  query.value.params.pageNumber = 1;
  query.value.onQuery();
};

const table = ref({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    let params = JSON.parse(JSON.stringify(query.value.params));
    const res: any = await eventList(...(handleParam(params) as [string, object]));

    table.value.data = res.data.items;
    table.value.total = res.data.totalNum;
    table.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    table.value.ids = selection.map((item: any) => item.mid);
  },
  onEdit: (row: any, type: any) => {
    if (type == "deal") {
      singleDealRef.value.openDialog(row);
    } else if (type == "video") {
      videoDialogRef.value.openDialog(row);
    }
  }
});

const openDialog = (row: any) => {
  if (row) {
    state.row = row;
    query.value.params.equipCode = row.equip;
    query.value.params.eventCode = row.event;
    table.value.getTableData();
  }

  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onBatchProcessing = (type: any) => {
  batchProcessingRef.value.openDialog(type, table.value.ids, null, "dialog", state.row);
};

const successHandle = () => {
  table.value.getTableData();
  emits("successHandle");
};

const successBatch = () => {
  table.value.getTableData();
  emits("successBatch");
};

defineExpose({
  openDialog
});
</script>

<style lang="scss">
.to-do-list-option {
  display: flex;
  margin-bottom: 20px;
}
</style>

<style lang="scss" scoped>
.monitor-todo-list-table .monitor-alarm-table-option {
  display: flex;
  align-items: center;
  height: 100%;
}
.monitor-todo-list-table i {
  font-size: 20px;
  color: var(--el-color-primary);
}
.monitor-todo-list-table .deal-icon {
  margin-right: 20px;
}
.disabled-icon {
  pointer-events: none; /* 禁用鼠标事件 */
  cursor: not-allowed; /* 可以改变鼠标样式 */
  opacity: 0.5; /* 可以添加其他样式来表示禁用状态 */
}
</style>
