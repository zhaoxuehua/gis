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
          <el-form-item label="开始时间" prop="beginTime">
            <el-date-picker
              v-model="formData.beginTime"
              type="datetime"
              placeholder="选择开始时间"
              class="w_220"
              :disabledDate="disabledDateFun"
            >
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              class="w_220"
              :disabledDate="disabledDateFun"
            >
            </el-date-picker>
          </el-form-item>
          <el-form-item label="查询对象" required>
            <el-select v-model="formData.objectTypeId" placeholder="请选择..." class="w_220">
              <el-option v-for="(item, idx) in realtimeDataList" :key="idx" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="查询模式" prop="selectMode">
            <el-select
              v-model="formData.selectMode"
              clearable
              placeholder="请选择..."
              @change="selectModeChange"
              filterable
              class="w_220"
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
            v-if="!['shape', 'mmsi'].includes(formData.selectMode) && formData.selectMode"
          >
            <el-select v-model="formData.selectLabel" clearable placeholder="请选择..." filterable class="w_220">
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
            v-if="!['shape', 'mmsi'].includes(formData.selectMode) && formData.selectMode && formData?.objectTypeId"
          >
            <el-select v-model="formData.alarmLevel" clearable placeholder="请选择..." filterable class="w_220">
              <el-option
                v-for="(optionItem, idx) in alarmList"
                :key="idx"
                :label="optionItem.name"
                :value="optionItem.code"
              ></el-option>
            </el-select>
          </el-form-item>

          <!-- mmsi -->
          <el-form-item :label="keywordConfigCodeName" prop="mmsi" v-if="['mmsi'].includes(formData.selectMode)">
            <el-input v-model="formData.mmsi" class="w_220"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- table-box -->
      <div class="table-box">
        <div style="padding-left: 80px; margin-bottom: 20px">
          <el-button type="primary" @click="searchForm()"> <Icon src="Search"></Icon>搜索 </el-button>
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
          <el-table-column :label="keywordConfig?.code || '编码'" prop="code" :min-width="90"></el-table-column>
          <el-table-column :label="keywordConfig?.name || '名称'" prop="name" :min-width="110"></el-table-column>
          <el-table-column label="操作" width="70">
            <template #default="scope">
              <Icon
                src="Location"
                :size="14"
                class="operate-icon"
                style="margin-right: 12px"
                @click="toLocation(scope.row)"
                title="定位"
              ></Icon>
              <Icon src="Connection" :size="14" class="operate-icon" @click="trackPlayBack(scope.row)" title="轨迹"></Icon>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="table.data?.length">
          <paginationCom
            small
            :pager-count="5"
            :total="table.total"
            layout="prev, pager, next"
            v-model:page="formData.pageNumber"
            v-model:limit="formData.pageSize"
            @pagination="getPagination"
          >
          </paginationCom>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, onMounted, watch, toRefs, computed } from "vue";
import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import Icon from "./Icon.vue";
import moment from "moment";
import paginationCom from "./paginationCom.vue";

// ⤵ 接口
import { eventListByObjType, getTrackListData } from "../../api/device";

// ⤵ type
import type { VisualMap, TableList, selectModeListType } from "../type";
import { useGisStore } from "../../stores/modules/gis";

// ⤵ 辅助函数
import { selectionAddDrawInteraction } from "../hooks/index"; // 框选方法
import { clearSelectionDrawInteraction } from "../hooks/clearSelectionDrawInteraction"; // 清除框选
import { toLonLatFN } from "../hooks/toLonLat"; // 坐标转换
import { labelOnSelect } from "../hooks/index"; // 定位
import { getTrackDataByIdFn } from "../hooks/getTrackDataById"; // 获取单个轨迹数据
import { disabledDateFun } from "../hooks/validateFun";

// 解构props(withDefaults设置props默认值)
const props = withDefaults(defineProps<{ map: VisualMap | null; index: number; isShow?: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const { map, index } = toRefs(props);
const gisStore = useGisStore();

// 传递的事件
const emits = defineEmits(["onEditLabel", "onClose"]);

// 实时查询对象类型列表
const realtimeDataList = computed(() => {
  return gisStore?.realtimeDataList || [];
});

// 关键词配置
const keywordConfig = computed(() => {
  return gisStore?.keywordConfig;
});

// 关闭轨迹回放
const onClose = () => {
  clearSelectionDrawInteraction(map.value);
  emits("onClose", index.value);
};

// 标签类型
const labelTypeMap = map.value?.get("labelTypeMap") || {};
const labelList: any[] = Object.values(map.value?.get("labelInfoMap") || {});

/***************************************
              查询表单数据
****************************************/
const refForm: any = ref();
let coordinateArr: any[] = []; // 坐标点集合
const formData = reactive({
  beginTime: moment().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
  endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
  objectTypeId: realtimeDataList.value?.length ? realtimeDataList.value[0]?.id : undefined, // 查询对象初始值
  selectMode: "shape", // 查询模式
  boxSelectMode: "", // 框选模式（查询模式是框选时）
  selectLabel: "", // 选择的标签
  alarmLevel: "", // 告警等级（只有配置了外部对象及查询模式不是图形时显示）
  mmsi: "",
  pageNumber: 1,
  pageSize: 6
});
let keywordConfigCodeName = keywordConfig.value["code"] || "编码";

// 表单验证
let rulesForm: any = {
  beginTime: [{ required: true, message: "开始时间不能为空", trigger: ["blur", "change"] }],
  endTime: [{ required: true, message: "结束时间不能为空", trigger: ["blur", "change"] }],
  selectMode: [{ required: true, message: "请选择查询模式", trigger: ["blur", "change"] }],
  selectLabel: [{ required: true, message: `请选择此类型标签`, trigger: ["blur", "change"] }],
  objectTypeId: [{ required: true, message: "查询对象不能为空", trigger: ["blur", "change"] }],
  mmsi: [{ required: true, message: `${keywordConfigCodeName}不能为空`, trigger: ["blur", "change"] }]
};

let selectModeList: Ref<selectModeListType[]> = ref([
  {
    name: "框选",
    code: "shape"
  },
  {
    name: keywordConfigCodeName,
    code: "mmsi"
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
      name: `按${obj.name}查询`,
      labelName: obj.name
    });
  }
});

const selectModeChange = (value: string) => {
  // 数据reset
  formData.boxSelectMode = "";
  formData.selectLabel = "";
  formData.alarmLevel = "";
  formData.mmsi = "";
  clearSelectionDrawInteraction(map.value);

  // 获取类型name
  let selectType = selectModeList.value.find(item => `${item.code}` == `${value}`);
  selectLabelTypeName.value = selectType?.labelName;

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

// 获取告警options
async function getAlarmListOptions(id: number) {
  try {
    const { code, data } = await eventListByObjType(id);
    if (Number(code) == 200) {
      // 过滤出告警 eventType  "hidden_alarm"  以alarm结尾
      (data as []).forEach((item: { [key: string]: any }) => {
        let arr = item.eventType.split("_");
        if (arr && arr?.length && arr.length > 1 && arr[1] == "alarm") {
          alarmList.value.push({
            ...item
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

/****************************************
      查询模式 : 框选模式
*****************************************/
watch(
  () => formData.boxSelectMode,
  n => {
    if (!n) {
      return;
    }
    selectionAddDrawInteraction(
      map.value,
      n,
      (coordinates: any[]) => {
        coordinates?.[0]?.pop();
        coordinateArr = coordinates;
      },
      true,
      () => {
        // 框选overlay关闭的回调
        formData.boxSelectMode = "";
      }
    );
  }
);

// 根据实时对象id(查询对象)请求告警列表
watch(
  () => formData.objectTypeId,
  n => {
    formData.mmsi = "";
    if (!n) {
      alarmList.value = [];
    } else {
      getAlarmListOptions(n);
    }
  },
  {
    immediate: true,
    deep: true
  }
);

/****************************************
      查询模式 : 标签类型模式
*****************************************/
function getCoordinateArrByLabelType() {
  let tempArr: any[] = [];
  let target: any[] = [];
  if (formData.selectMode == "shape") {
    if (!coordinateArr.length) {
      return [];
    }
    // 框选模式,直接返回
    coordinateArr[0].forEach((item: number[]) => {
      tempArr.push(`(${toLonLatFN(item).join()})`);
    });
    tempArr = [tempArr];
  } else if (formData.selectLabel === "all") {
    // 如果选的全部，收集该类型下所有数据
    target = selectLabelList.value.filter(val => val.code !== "all");
  } else {
    // 单个
    target = selectLabelList.value.filter(val => val.code === formData.selectLabel);
  }
  target.forEach(val => {
    if (val.coordinates) {
      const mapData = val.coordinates[0].map((j: number[]) => `(${j.join()})`);
      tempArr.push(`[${mapData.toString()}]`);
    }
  });

  return tempArr;
}

/****************************************
                  搜索
*****************************************/
const searchForm = function () {
  // 校验必填项
  refForm.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 校验是框选时地图上有框选区域才可以搜索(搜索校验，翻页不校验)
      if (formData.selectMode == "shape" && !formData.boxSelectMode) {
        return ElMessage.warning("请框选查询区域！");
      }
      formData.pageNumber = 1;
      formData.pageSize = 6;
      table.value.getTableData();
    }
  });
};

/****************************************
            表格
*****************************************/
// 定位
const toLocation = (row: { [key: string]: any }) => {
  labelOnSelect(map.value, row.code, false, true);
};

// 轨迹回放
const trackPlayBack = (row: { [key: string]: any }) => {
  getTrackDataByIdFn({
    code: row.code,
    name: row.name,
    objectTypeCode: row?.visitObjectTypeCode || row?.equipTypeCode, // 实时数据对象类型
    beginTime: moment(formData.beginTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment(formData.endTime).format("YYYY-MM-DD HH:mm:ss")
  });
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
  data: [],
  getTableData: async () => {
    const regions = getCoordinateArrByLabelType();

    if (!regions.length && !formData.mmsi) {
      return ElMessage.warning("请先设置选区,暂无选区数据！");
    }

    const params = {
      regions,
      beginTime: moment(formData.beginTime).format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment(formData.endTime).format("YYYY-MM-DD HH:mm:ss"),
      equipType: realtimeDataList.value?.find((item: any) => item.id == formData.objectTypeId)?.code, // 查询对象code
      pageSize: formData.pageSize,
      pageNumber: formData.pageNumber
    };

    if (formData.selectMode === "mmsi") {
      (params as any).mmsi = formData.mmsi;
    }

    if (formData.alarmLevel) {
      (params as any).eventType = formData.alarmLevel;
    }
    if (!formData.objectTypeId) {
      return ElMessage.warning("查询对象不能为空！");
    }

    // 时间判断(3天的数据)
    if (+moment(formData.endTime) - +moment(formData.beginTime) > 3 * 24 * 60 * 60 * 1000) {
      return ElMessage.warning("查询不能超过3天数据");
    }
    if (+moment(formData.endTime) < +moment(formData.beginTime)) {
      return ElMessage.warning("开始时间不能小于结束时间");
    }

    try {
      const { code, data } = await getTrackListData(params);
      if (Number(code) !== 200) {
        return ElMessage.error("接口请求错误");
      }
      // 清除绘制区域
      formData.boxSelectMode = "";
      clearSelectionDrawInteraction(map.value);
      table.value.data = data?.items || [];
      table.value.total = data?.totalNum;
      if (!data?.items?.length) {
        return ElMessage.warning("暂无数据");
      }
    } catch (error) {
      // 报错时清除选框及数据
      formData.boxSelectMode = "";
      clearSelectionDrawInteraction(map.value);
      coordinateArr = [];
      table.value.data = [];
      table.value.total = 0;
      console.log(error);
    }
  }
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.w_220 {
  width: 220px;
}
.track-back {
  display: flex;
  flex-direction: column;
  width: 340px;
  min-height: 500px;
  max-height: 750px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 60px;
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
    padding: 20px;
    overflow-y: auto;
  }
  .operate-icon {
    color: var(--el-color-primary);
    cursor: pointer;
  }
}
</style>
