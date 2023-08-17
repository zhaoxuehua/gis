<!-- 轨迹回放部分 -->
<template>
  <div class="track-back" @click.stop>
    <div class="title">
      <span>轨迹回放</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="track-back-content">
      <div class="query-box">
        <el-form :inline="true" :model="query.params" label-width="80px" :rules="state.rulesForm" ref="refForm">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="query.params.startTime" type="datetime" placeholder="选择开始时间" style="width: 200px">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="query.params.endTime" type="datetime" placeholder="选择结束时间" style="width: 200px">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="查询模式" prop="selectMode">
            <el-select
              v-model="query.params.selectMode"
              clearable
              placeholder="请选择..."
              @change="selectModeChange"
              filterable
              style="width: 200px"
            >
              <el-option
                v-for="(optionItem, idx) in state.selectModeList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>

          <!-- 查询模式是图形时才有框选模式 -->
          <el-form-item label="框选模式" prop="boxSelectMode" v-if="query.params.selectMode == 'shape'">
            <el-radio-group v-model="query.params.boxSelectMode">
              <el-radio label="Circle">矩形</el-radio>
              <el-radio label="Polygon">多边形</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 查询模式是面标签类型（选择该类型下的标签） -->
          <el-form-item
            :label="state.selectLabelTypeName"
            prop="selectLabel"
            v-if="query.params.selectMode && query.params.selectMode != 'shape'"
          >
            <el-select v-model="query.params.selectLabel" clearable placeholder="请选择..." filterable style="width: 200px">
              <el-option
                v-for="(optionItem, idx) in state.selectLabelList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-box">
        <div style="margin-bottom: 20px">
          <el-button type="primary" @click="query.onQuery"><Icon src="Search"></Icon>搜索</el-button>
        </div>
        <el-table
          :data="table.data"
          class="track-table"
          v-loading="table.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 32 + 'px' }"
          :cell-style="{ padding: '0px' }"
          stripe
          border
        >
          <el-table-column label="编码" prop="code"></el-table-column>
          <el-table-column label="名称" prop="name"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <Icon src="Location" :size="14" class="operate-icon" @click="toLocation(scope.row)"></Icon>
              <Icon src="Switch" :size="14" class="operate-icon" @click="trackPlayBack(scope.row)"></Icon>
              <Icon src="Download" :size="14" class="operate-icon" @click="downloadTrackInfo(scope.row)"></Icon>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container-gis" v-if="table.data?.length">
          <el-pagination
            :background="true"
            v-model:current-page="query.params.pageNumber"
            v-model:page-size="query.params.pageSize"
            :page-sizes="[10, 20, 30, 50]"
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
import { reactive, ref, onMounted, watch, toRefs, computed } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { handleParam } from "@/utils/common.js";
import { gisTrackList } from "../../api/gis";
import type { VisualMap, TableList } from "../type";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number; isShow?: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const emits = defineEmits(["onEditLabel", "onClose"]);
const { map, isShow, index } = toRefs(props);

// 关闭轨迹回放
const onClose = () => {
  emits("onClose", index.value);
};

const state: { selectModeList: any[]; selectLabelList: any[]; selectLabelTypeName: string; rulesForm: any } = reactive({
  selectModeList: [], // 查询模式列表
  selectLabelList: [],
  selectLabelTypeName: "",
  // 弹窗表单验证
  rulesForm: {
    startTime: [{ required: true, message: "开始时间不能为空", trigger: ["blur", "change"] }],
    endTime: [{ required: true, message: "结束时间不能为空", trigger: ["blur", "change"] }],
    selectMode: [{ required: true, message: "请选择查询模式", trigger: ["blur", "change"] }],
    boxSelectMode: [{ required: true, message: "请选择框选模式", trigger: ["blur", "change"] }],
    selectLabel: [{ required: true, message: `请选择此类型标签`, trigger: ["blur", "change"] }]
  }
});
const refForm: any = ref();

const query = ref({
  params: {
    startTime: moment().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
    selectMode: "shape", // 查询模式
    boxSelectMode: "", // 框选模式（查询模式是图形时）
    selectLabel: "all", // 选择的标签
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
  query.value.getPagination({ page: query.value.params.pageNumber, limit: val });
};

const handleCurrentChange = (val: any) => {
  query.value.getPagination({ page: val, limit: query.value.params.pageSize });
};

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [{}],
  getTableData: async () => {
    // 校验必填项
    refForm.value?.validate(async (valid: any) => {
      if (valid) {
        table.value.loading = true;
        const [queryString, params] = handleParam(query.value.params);
        // 处理请求的传参（查询模式是图形是传的框选范围  查询模式是标签类型时传选择的标签坐标）
        if (params.selectMode == "shape") {
          params.range = [];
        } else {
          // 标签类型（看是全选还是单选）
          if (params.selectLabel == "all") {
            let selectLabelCoordinates: any[] = [];
            state.selectLabelList.forEach((item: { [key: string]: any }) => {
              if (item.code != "all") {
                selectLabelCoordinates.push(item?.coordinates);
              }
            });
            params.coordinates = selectLabelCoordinates;
          } else {
            // 选择一个标签的坐标
            let selectLabelObj = state.selectLabelList.find((item: { [key: string]: any }) => item.code == params.selectLabel);
            params.coordinates = selectLabelObj.coordinates;
          }
        }

        const res: { [key: string]: any } = await gisTrackList(queryString, params);
        if (res.items) {
          table.value.data = res.items || [];
          table.value.total = res.totalNum;
        } else {
          ElMessage.error("接口异常");
        }
        table.value.loading = false;
      }
    });
  }
});

const selectModeChange = (value: string) => {
  // 获取类型name
  let selectType: { [key: string]: any } = state.selectModeList.find(
    (item: { [key: string]: any }) => `${item.code}` == `${value}`
  );
  state.selectLabelTypeName = selectType?.name;
  // 标签类型下的标签列表
  let labelArr: any[] = [
    {
      name: "全部",
      code: "all"
    }
  ];
  labelList.value.forEach((item: { [key: string]: any }) => {
    if (item?.labelType?.code == value) {
      labelArr.push({
        code: item.code,
        name: item.name,
        id: item.id,
        coordinates: item?.labelData?.coordinates
      });
    }
  });
  state.selectLabelList = labelArr;
  console.log(selectType, labelList, 766666655);
};

const toLocation = (row: { [key: string]: any }) => {
  console.log(row, 1);
};
const trackPlayBack = (row: { [key: string]: any }) => {
  console.log(row, 2);
};
const downloadTrackInfo = (row: { [key: string]: any }) => {
  console.log(row, 3);
};

const labelTypeMap = map.value?.get("labelTypeMap") || {};
// 标签类型
const labelList: any = computed(() => {
  let labelTypeMap = map.value?.get("labelInfoMap") || {};
  return Object.values(labelTypeMap);
});

// 筛选出标签类型是面的
watch(
  () => isShow.value,
  isShowVal => {
    if (isShowVal) {
      // 筛选出标签类型是面的
      let labelTypeArr: any = [
        {
          name: "图形",
          code: "shape"
        }
      ];
      Object.values(labelTypeMap)?.forEach((obj: any) => {
        // 过滤出标签类型是面的 面 圆 矩形
        if (obj?.dataType == "3" || obj?.dataType == "4" || obj?.dataType == "5") {
          labelTypeArr.push({
            code: obj.code,
            name: obj.name
          });
        }
      });
      state.selectModeList = labelTypeArr;
      console.log(labelTypeMap, 7666555);
    } else {
      console.log(1);
    }
  },
  {
    immediate: true,
    deep: true
  }
);

onMounted(() => {});
</script>

<style lang="scss" scoped>
.track-back {
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 700px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    padding: 0 20px;
    background-color: #f7f7fa;
    span {
      font-size: 16px;
    }
    .icon {
      cursor: pointer;
    }
  }
  .track-back-content {
    height: calc(100% - 60px);
    padding: 0 20px;

    // 查询块
    .query-box {
      margin-top: 20px;
    }

    // 表格块
    .table-box {
      height: 400px;
      overflow-y: auto;
    }
  }
  .operate-icon {
    margin-right: 12px !important;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}
</style>
