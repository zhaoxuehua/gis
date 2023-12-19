<template>
  <div>
    <el-dialog
      title="告警列表"
      v-model="state.open"
      width="1440px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <div style="margin-bottom: 20px">
        <el-button :disabled="!table.ids.length" @click="onBatchProcessing" v-if="!(Number(type) == 2)">批量处理</el-button>
        <el-button type="primary" @click="onBatchAllProcessing" v-if="!(Number(type) == 2)">全部处理</el-button>
      </div>
      <el-table
        :data="table.data"
        v-loading="table.loading"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 32 + 'px' }"
        :cell-style="{ padding: '0px' }"
        @selection-change="table.onSelectionChange"
        height="360"
        stripe
        border
      >
        <el-table-column type="selection"></el-table-column>
        <el-table-column label="事件编码" prop="eventCode">
          <template #default="scope">
            {{ scope.row.event }}
          </template>
        </el-table-column>
        <el-table-column label="事件名称" prop="eventName"></el-table-column>
        <el-table-column label="事件时间" prop="monitorTime"></el-table-column>
        <el-table-column label="事件等级" prop="eventLevelName"></el-table-column>
        <el-table-column label="事件类型" prop="eventTypeName"></el-table-column>
        <el-table-column label="事件子类型" prop="eventSubTypeName"></el-table-column>
        <el-table-column label="事件设备" prop="equipName"></el-table-column>
        <el-table-column label="设备位置" prop="equipLocation"></el-table-column>
        <el-table-column label="事件描述" prop="desc"></el-table-column>
        <el-table-column label="处理状态" prop="processStateName"></el-table-column>
        <el-table-column label="知晓情况" prop="awarenessStateName"></el-table-column>
        <el-table-column prop="path" label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="monitor-alarm-table-operate">
              <div title="待处理事件" class="footer-item-icon-operate" @click.stop="table.onEdit(scope.row, 'todo')">
                <el-badge :value="scope.row.alarmNum" :max="99" class="monitor-alarm-table-badage-operate">
                  <Icon src="BellFilled" :size="20"></Icon>
                </el-badge>
              </div>
              <div title="知晓标记" class="footer-item-icon-operate" @click.stop="table.onEdit(scope.row, 'mark')">
                <Icon src="Grid" :size="20" type="primary"></Icon>
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
    </el-dialog>
    <!-- 批量处理 -->
    <BatchProcessing ref="batchProcessingRef" @success-batch="successOpt"></BatchProcessing>
    <AwarenessMark ref="awarenessMarkRef" @success-opt="successOpt"></AwarenessMark>
    <ToDoList ref="toDoListRef" @success-handle="successOpt" @success-batch="successOpt"></ToDoList>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { handleParam } from "@/utils/common.js";
import { eventList } from "../../../api/device";
import type { TableList } from "../../type";
import BatchProcessing from "./alarmComponents/batchProcessing.vue";
import AwarenessMark from "./alarmComponents/awarenessMark.vue";
import ToDoList from "./alarmComponents/toDoList.vue";
import Icon from "../Icon.vue";
import paginationCom from "../paginationCom.vue";

const batchProcessingRef = ref();
const awarenessMarkRef = ref();
const toDoListRef = ref();
const state = reactive({
  open: false
});

const extendInfo = ref([]);
const type: any = ref(1); // 实时

const query = ref({
  params: {
    equipCode: "", // 设备编码
    processState: "1,2", // 未处理 已处理
    eventType: "alarm", // 事件类型告警
    distinct: true, // 外面表格
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

const openDialog = (row?: { [key: string]: any }) => {
  query.value.params.equipCode = row?.equipCode;
  table.value.getTableData();
  state.open = true;
};
const onClose = () => {
  state.open = false;
};

const table = ref<TableList & { onEdit: Function }>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const [queryString, params] = handleParam(query.value.params);
    const res: { [key: string]: any } = await eventList(queryString, params);
    if (res.code == 200) {
      table.value.data = res.data?.items;
      table.value.total = res.data?.totalNum;
      extendInfo.value = res.data?.extendInfo || [];
    }
    table.value.loading = false;
  },

  onSelectionChange: (selection: any) => {
    table.value.ids = selection.map((item: any) => item.mid);
  },
  onEdit: (row: { [key: string]: any }, type: string) => {
    if (type == "mark") {
      // 知晓标记
      awarenessMarkRef.value.openDialog(row);
    } else if (type == "todo") {
      // 待处理事件
      toDoListRef.value.openDialog(row);
    }
  }
});

// 批量处理
const onBatchProcessing = () => {
  batchProcessingRef.value.openDialog("part", table.value.ids, null, "table");
};

// 全部处理
const onBatchAllProcessing = () => {
  if (table?.value?.data && table.value.data?.length) {
    batchProcessingRef.value.openDialog("all", table.value.ids, extendInfo.value, "table");
  } else {
    ElMessage.warning("列表中无记录");
  }
};

// 子弹框确认操作
const successOpt = () => {
  table.value.getTableData();
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.monitor-alarm-table-operate {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 40px;
  color: var(--el-color-primary);
}
.monitor-alarm-table-badage-operate {
  display: flex;
  align-items: center;
  margin-right: 30px;
}
.footer-item-icon-operate {
  display: flex;
  align-items: center;
}
.footer-item-icon-operate:hover {
  cursor: pointer;
  transition: 0s;
}
</style>
