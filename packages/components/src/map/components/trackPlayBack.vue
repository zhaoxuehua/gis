<!-- 轨迹回放部分 -->
<template>
  <div class="track-back" @click.stop>
    <div class="title">
      <span>轨迹回放</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="track-back-content">
      <div class="query-box">
        <el-form :inline="true" :model="formData" label-width="80px" :rules="rulesForm" ref="refForm">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker v-model="formData.startTime" type="datetime" placeholder="选择开始时间" style="width: 200px">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker v-model="formData.endTime" type="datetime" placeholder="选择结束时间" style="width: 200px">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="查询模式" prop="selectMode">
            <el-select
              v-model="formData.selectMode"
              clearable
              placeholder="请选择..."
              @change="selectModeChange"
              filterable
              style="width: 200px"
            >
              <el-option
                v-for="(optionItem, idx) in selectModeList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>

          <!-- 查询模式是图形时才有框选模式 -->
          <el-form-item label="框选模式" prop="boxSelectMode" v-if="formData.selectMode == 'shape'">
            <el-radio-group v-model="formData.boxSelectMode">
              <el-radio label="Circle">矩形</el-radio>
              <el-radio label="Polygon">多边形</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 查询模式是面标签类型（选择该类型下的标签） -->
          <el-form-item
            :label="selectLabelTypeName"
            prop="selectLabel"
            v-if="formData.selectMode && formData.selectMode != 'shape'"
          >
            <el-select v-model="formData.selectLabel" clearable placeholder="请选择..." filterable style="width: 200px">
              <el-option
                v-for="(optionItem, idx) in selectLabelList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>

          <!-- 告警 -->
          <el-form-item
            label="告警"
            prop="alarmLevel"
            v-if="formData.selectMode && formData.selectMode != 'shape' && trackSearchId"
          >
            <el-select v-model="formData.alarmLevel" clearable placeholder="请选择..." filterable style="width: 200px">
              <el-option
                v-for="(optionItem, idx) in alarmList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-box">
        <div style="padding-left: 80px; margin-bottom: 20px">
          <el-button type="primary" @click="searchForm()"><Icon src="Search"></Icon>搜索</el-button>
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
          <el-table-column label="名称" prop="name"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <Icon src="Location" :size="14" class="operate-icon" @click="toLocation(scope.row)"></Icon>
              <Icon src="Switch" :size="14" class="operate-icon" @click="trackPlayBack(scope.row)"></Icon>
              <!-- <Icon src="Download" :size="14" class="operate-icon" @click="downloadTrackInfo(scope.row)"></Icon> -->
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container-gis" v-if="table.data?.length">
          <el-pagination
            :background="true"
            v-model:current-page="formData.pageNumber"
            v-model:page-size="formData.pageSize"
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
import { reactive, ref, onMounted, watch, toRefs, Ref } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { handleParam } from "@/utils/common.js";
import { gisTrackList } from "../../api/gis";
import { eventListByObjType } from "../../api/device";
import Icon from "./Icon.vue";

// ⤵ type
import type { VisualMap, TableList, selectModeListType } from "../type";

// ⤵ 辅助函数
import { selectionAddDrawInteraction } from "../hooks/index"; // 框选方法
import { clearSelectionDrawInteraction } from "../hooks/clearSelectionDrawInteraction"; // 清除框选

// 解构props(withDefaults设置props默认值)
const props = withDefaults(defineProps<{ map: VisualMap | null; index: number; isShow?: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const { map, index } = toRefs(props);

// 传递的事件
const emits = defineEmits(["onEditLabel", "onClose"]);

// 关闭轨迹回放
const onClose = () => {
  clearSelectionDrawInteraction(map.value);
  emits("onClose", index.value);
};

// 标签类型
const labelTypeMap = map.value?.get("labelTypeMap") || {};
const labelList: any[] = Object.values(map.value?.get("labelInfoMap"));
const defaultOptions = map.value?.defaultOptions;
const trackSearchId = ref(defaultOptions.value?.trackSearchId);
const trackSearchCode = ref(defaultOptions.value?.trackSearchCode);

/***************************************
              查询表单数据
****************************************/
const refForm: any = ref();
const formData = reactive({
  startTime: moment().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
  endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
  selectMode: "shape", // 查询模式
  boxSelectMode: "", // 框选模式（查询模式是图形时）
  selectLabel: "", // 选择的标签
  alarmLevel: "", // 告警等级（只有配置了外部对象及查询模式不是图形时显示）
  pageNumber: 1,
  pageSize: 10
});

// 弹窗表单验证
let rulesForm: any = {
  startTime: [{ required: true, message: "开始时间不能为空", trigger: ["blur", "change"] }],
  endTime: [{ required: true, message: "结束时间不能为空", trigger: ["blur", "change"] }],
  selectMode: [{ required: true, message: "请选择查询模式", trigger: ["blur", "change"] }],
  boxSelectMode: [{ required: true, message: "请选择框选模式", trigger: ["blur", "change"] }],
  selectLabel: [{ required: true, message: `请选择此类型标签`, trigger: ["blur", "change"] }]
};

let selectModeList: Ref<selectModeListType[]> = ref([
  {
    name: "图形",
    code: "shape"
  }
]); //查询模式
let selectLabelList: Ref<selectModeListType[]> = ref([]); //查询模式
let selectLabelTypeName = ref();
let alarmList: Ref<any[]> = ref([]);

// 查询模式:筛选出标签类型是面的
Object.values(labelTypeMap)?.forEach((obj: any) => {
  // 过滤出标签类型是面的 面 矩形
  if (obj?.dataType == "3" || obj?.dataType == "5") {
    selectModeList.value.push({
      code: obj.code,
      name: obj.name
    });
  }
});

//
watch(
  () => trackSearchId.value,
  async value => {
    if (value) {
      // 筛选出告警列表（根据对象类型获取事件列表）
      const res: { [key: string]: any } = await eventListByObjType(value);
      if (res.code == 200) {
        // 过滤出告警 eventType  "hidden_alarm"  以alarm结尾
        let alarmArr: any[] = [];
        res.data.forEach((item: { [key: string]: any }) => {
          let arr = item.eventType.split("_");
          if (arr && arr?.length && arr.length > 1 && arr[1] == "alarm") {
            alarmArr.push({
              ...item
            });
          }
        });
        console.log(alarmArr);
        alarmList.value = alarmArr;
      } else {
        ElMessage.error("接口异常");
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
);

// 查询模式
const selectModeChange = (value: string) => {
  // 数据reset
  formData.boxSelectMode = "";
  formData.selectLabel = "";
  formData.alarmLevel = "";
  clearSelectionDrawInteraction(map.value);

  // 获取类型name
  let selectType = selectModeList.value.find(item => `${item.code}` == `${value}`);
  selectLabelTypeName.value = selectType?.name;

  // 标签类型下的标签列表
  let labelArr = [
    {
      name: "全部",
      code: "all"
    }
  ];
  labelList.forEach((item: { [key: string]: any }) => {
    if (item?.labelType?.code == value) {
      let data = {
        code: item.code,
        name: item.name,
        id: item.id,
        coordinates: item?.labelData?.coordinates
      };
      labelArr.push(data);
    }
  });
  selectLabelList.value = labelArr;
};

/****************************************
      查询模式 : 框选模式
*****************************************/
watch(
  () => formData.boxSelectMode,
  n => {
    if (!n) {
      return;
    }
    clearSelectionDrawInteraction(map.value);
    selectionAddDrawInteraction(
      map.value,
      n,
      (coordinates: any[]) => {
        console.log("回调。。。", coordinates);
      },
      true
    );
  }
);

/****************************************
 查询模式 : 根据标签类型 => 选择的标签对应的坐标集合
*****************************************/
// function getCoordinatesByLabelType() {
//   console.log(formData.selectLabel);
// }

/****************************************
                  搜索
*****************************************/
const searchForm = function () {
  // getCoordinatesByLabelType();
  table.value.getTableData();
};

/****************************************
            表格
*****************************************/
const toLocation = (row: { [key: string]: any }) => {
  console.log(row, 1);
};
const trackPlayBack = (row: { [key: string]: any }) => {
  console.log(row, 2);
};

// 分页
const handleSizeChange = (val: any) => {
  getPagination({ page: 1, limit: val });
};

const handleCurrentChange = (val: any) => {
  getPagination({ page: val, limit: formData.pageSize });
};

const getPagination = (obj: { page: number; limit: number }) => {
  formData.pageNumber = obj.page;
  formData.pageSize = obj.limit;
  table.value.getTableData();
};

// 获取表格数据
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
        const [queryString, params] = handleParam(formData);
        // 处理请求的传参（查询模式是图形是传的框选范围  查询模式是标签类型时传选择的标签坐标）
        if (params.selectMode == "shape") {
          params.coordinates = [];
        } else {
          // 标签类型（看是全选还是单选）
          if (params.selectLabel == "all") {
            let selectLabelCoordinates: any[] = [];
            selectLabelList.value.forEach((item: { [key: string]: any }) => {
              if (item.code != "all") {
                selectLabelCoordinates.push(item?.coordinates);
              }
            });
            params.coordinates = selectLabelCoordinates;
          } else {
            // 选择一个标签的坐标
            let selectLabelObj = selectLabelList.value.find((item: { [key: string]: any }) => item.code == params.selectLabel);
            params.coordinates = selectLabelObj.coordinates;
          }
          // 如果有外部对象 则传告警
          if (trackSearchCode.value) {
            params.outsideObj = trackSearchCode.value;
          } else {
            delete params.alarmLevel;
          }
        }
        delete params.boxSelectMode;
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
      height: 350px;
      overflow-y: auto;
      .pagination-container-gis {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0;
        margin: 0;
        .el-pagination__sizes {
          margin: 0 0 0 16px !important;
        }
        .pagination-container-gis .el-pagination {
          position: absolute;
          right: 0;
        }
      }
    }
  }
  .operate-icon {
    margin-right: 12px !important;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}
</style>
