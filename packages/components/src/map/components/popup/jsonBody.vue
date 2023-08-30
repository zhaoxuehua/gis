<template>
  <div class="monitor-jsonbody-data">
    <div v-for="(table, index) in tableBodyData" :key="table.code">
      <template v-if="table.data.length">
        <div class="title-box">
          <div class="title">{{ table.name }}</div>
          <el-button
            v-if="table.tile && table.data.length"
            type="primary"
            :disabled="table.currentDescIndex === 0"
            @click="onSwitch('prev', table)"
            >上一条</el-button
          >
          <el-button
            v-if="table.tile && table.data.length"
            type="primary"
            :disabled="table.currentDescIndex === table.data.length - 1"
            @click="onSwitch('next', table)"
            >下一条</el-button
          >
        </div>
        <div class="desc-box" v-if="table.tile">
          <div v-for="(data, dataIndex) in table.data" :key="dataIndex">
            <el-descriptions class="desc-list" title="" :column="2" :border="true" v-show="table.currentDescIndex === dataIndex">
              <el-descriptions-item
                v-for="column in table.columns"
                :key="column.prop"
                :label="column.label"
                class-name="desc-item"
                label-class-name="desc-label-item"
              >
                {{ data[column.prop] }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        <Table
          v-else
          :data="table.pageData"
          :columns="table.columns"
          layout="total, prev, pager, next"
          :class="['json-body-table', table.data.length ? '' : 'no-data-table', table.data.length >= 5 ? 'data-table' : '']"
          :pagination="table.data.length ? table.pagination : false"
          @page-current-change="val => handleCurrentChange(val, index)"
        ></Table>
      </template>
      <template v-else>
        <div class="title">{{ table.name }}</div>
        <el-empty description="无数据" :image-size="100" />
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup name="jsonBody">
import { watch } from "vue";
// import { jsonbodyData, jsonbodyMap } from "./popupmock";
import Table from "../Table/index.vue";
import { useJSONBody } from "../../hooks/useJSONBody";

const props = defineProps({
  jsonbodyData: Array<any>,
  jsonbodyMap: Object
});

const { tableBodyData, handleBodyValue } = useJSONBody();

const handleCurrentChange = (val: number, index: number) => {
  const current = tableBodyData.value[index];
  current.pagination.page = val;
  current.pageData = current.data.slice(
    (current.pagination.page - 1) * current.pagination.pageSize,
    current.pagination.page * current.pagination.pageSize
  );
};
const onSwitch = (type: string, table: any) => {
  if (type === "prev") {
    table.currentDescIndex--;
  }
  if (type === "next") {
    table.currentDescIndex++;
  }
};
watch(
  () => props.jsonbodyData,
  () => {
    handleBodyValue(props.jsonbodyData!, props.jsonbodyMap);
  }
);
</script>
<style lang="scss" scoped>
.json-body-table {
  margin-top: 10px;
}
.no-data-table,
.data-table {
  height: 244px;
}
.monitor-jsonbody-data {
  margin-top: 10px;
  .title-box {
    display: flex;
    align-items: center;
    margin-top: 10px;
    .title {
      margin-right: auto;
    }
  }
  .title {
    font-weight: bold;
  }
  .desc-list {
    flex-shrink: 0;
    width: 100%;
    margin-top: 10px;
  }
  ::v-deep(.desc-item) {
    font-size: 14px;
  }
  ::v-deep(.desc-label-item) {
    width: 100px;
    font-size: 14px;
    white-space: nowrap;
  }
}
</style>
