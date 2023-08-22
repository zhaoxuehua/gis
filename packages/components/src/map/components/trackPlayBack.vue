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
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="选择开始时间"
              style="width: 200px"
              :disabledDate="disabledDateFun"
            >
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="选择结束时间"
              style="width: 200px"
              :disabledDate="disabledDateFun"
            >
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
            v-if="formData.selectMode && formData.selectMode != 'shape' && defaultOptions.trackSearchId"
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

      <!-- table-box -->
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
          <el-table-column label="操作" width="80">
            <template #default="scope">
              <Icon src="Location" :size="14" class="operate-icon" @click="toLocation(scope.row)"></Icon>
              <Icon src="Connection" :size="14" class="operate-icon" @click="trackPlayBack(scope.row)"></Icon>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container-gis" v-if="table.data?.length">
          <el-pagination
            background
            small
            v-model:current-page="formData.pageNumber"
            v-model:page-size="formData.pageSize"
            layout="prev, pager, next"
            :total="table.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, onMounted, watch, toRefs, Ref, computed } from "vue";
import { ElMessage } from "element-plus";
import Icon from "./Icon.vue";
import moment from "moment";

// ⤵ store
import { useTrackListStore } from "../../stores/modules/trackList";

// ⤵ 接口
import { eventListByObjType, getTrackListData, getTrackDataById } from "../../api/device";

// ⤵ type
import type { VisualMap, TableList, selectModeListType } from "../type";

// ⤵ 辅助函数
import { selectionAddDrawInteraction } from "../hooks/index"; // 框选方法
import { clearSelectionDrawInteraction } from "../hooks/clearSelectionDrawInteraction"; // 清除框选
import { toLonLatFN } from "../hooks/toLonLat"; // 坐标转换
import { createdTrackData } from "../hooks/createdTrackData"; // 绘制轨迹
import { labelOnSelect } from "../hooks/index"; // 定位

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

/***************************************
              查询表单数据
****************************************/
const refForm: any = ref();
let coordinateArr: any[] = []; // 坐标点集合
const formData = reactive({
  startTime: moment().subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss"),
  endTime: moment().format("YYYY-MM-DD HH:mm:ss"),
  selectMode: "shape", // 查询模式
  boxSelectMode: "", // 框选模式（查询模式是图形时）
  selectLabel: "", // 选择的标签
  alarmLevel: "", // 告警等级（只有配置了外部对象及查询模式不是图形时显示）
  pageNumber: 1,
  pageSize: 6
});

// 表单验证
let rulesForm: any = {
  startTime: [{ required: true, message: "开始时间不能为空", trigger: ["blur", "change"] }],
  endTime: [{ required: true, message: "结束时间不能为空", trigger: ["blur", "change"] }],
  selectMode: [{ required: true, message: "请选择查询模式", trigger: ["blur", "change"] }],
  // boxSelectMode: [{ required: true, message: "请选择框选模式", trigger: ["blur", "change"] }],
  selectLabel: [{ required: true, message: `请选择此类型标签`, trigger: ["blur", "change"] }]
};

// 时间限制
const disabledDateFun = (time: Date) => {
  if (time.getTime() < new Date().getTime()) {
    return time.getTime() > new Date().getTime() || time.getTime() < new Date().getTime() - 1000 * 3600 * 24 * 14; //时间范围必须是时间戳
  } else {
    return new Date().getTime(); //时间范围必须是时间戳
  }
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

// 地图上的默认参数
const defaultOptions = computed(() => {
  const mapDefaultOptions = map.value?.defaultOptions;
  if (mapDefaultOptions.trackSearchId || mapDefaultOptions.trackSearchId === 0) {
    getAlarmListOptions(mapDefaultOptions.trackSearchId);
  }
  return mapDefaultOptions;
});

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
    } else {
      ElMessage.error("接口异常");
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
    clearSelectionDrawInteraction(map.value);
    selectionAddDrawInteraction(
      map.value,
      n,
      (coordinates: any[]) => {
        coordinates[0].pop();
        coordinateArr = coordinates;
      },
      true
    );
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
  return `[${tempArr.toString()}]`;
}

/****************************************
                  搜索
*****************************************/
const searchForm = function () {
  // 校验必填项
  refForm.value?.validate(async (valid: boolean) => {
    if (valid) {
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
  const store = useTrackListStore();
  getTrackDataById({
    equipCodes: row.code,
    isVisitObject: true,
    isHistory: true,
    beginTime: moment(formData.startTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment(formData.endTime).format("YYYY-MM-DD HH:mm:ss"),
    pageNumber: 1,
    pageSize: 1000000,
    ascDesc: "asc"
  }).then(res => {
    const { code, data } = res;
    if (Number(code) !== 200) {
      ElMessage("获取数据报错");
      return;
    }

    if (!data.items.length) {
      return ElMessage.warning("暂无轨迹数据");
    }

    // 后端数据是倒叙的，此处在转一下
    const transData = data.items.map(val => {
      const aisLocation = val.aisLocation;
      const aisInfo = JSON.parse(aisLocation);
      const params = {
        posInfo: {
          lat: aisInfo.lat,
          lon: aisInfo.lon,
          cog: aisInfo.cog
        },
        titleInfo: {
          name: moment(aisInfo.positionReportTicks).format("YYYY-MM-DD HH:mm:ss")
        },
        labelInfo: {
          time: moment(aisInfo.positionReportTicks).format("YYYY-MM-DD HH:mm:ss"),
          speed: aisInfo.sog,
          unit: "节"
        },
        detailInfo: [
          ["船名", aisInfo.name],
          ["MMSI", aisInfo.mmsi],
          ["宽", aisInfo.width]
        ]
      };
      return params;
    });

    createdTrackData({
      id: row.code,
      name: row.name,
      data: transData
    }).then(res => {
      row.color = res;
      store.addData(row);
    });
  });
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
  data: [],
  getTableData: async () => {
    const regions = getCoordinateArrByLabelType();
    if (!regions.length) {
      return ElMessage.warning("请先设置选区,暂无选区数据！");
    }
    const params = {
      regions,
      beginTime: moment(formData.startTime).format("YYYY-MM-DD HH:mm:ss"),
      endTime: moment(formData.endTime).format("YYYY-MM-DD HH:mm:ss"),
      pageSize: formData.pageSize,
      pageNumber: formData.pageNumber
    };
    if (formData.alarmLevel) {
      (params as any).eventType = formData.alarmLevel;
    }

    // 时间判断(3天的数据)
    if (+moment(formData.endTime) - +moment(formData.startTime) > 4 * 24 * 60 * 60 * 1000) {
      return ElMessage.warning("查询不能超过3天数据");
    }
    if (+moment(formData.endTime) < +moment(formData.startTime)) {
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
      table.value.data = data.items;
      table.value.total = data.totalNum;
      if (!data.items.length) {
        return ElMessage.warning("暂无数据");
      }
    } catch (error) {
      console.log(error);
    }
  }
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.track-back {
  display: flex;
  flex-direction: column;
  width: 320px;
  min-height: 500px;
  max-height: 700px;

  // height: 700px;
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
    padding: 20px;
  }
  .operate-icon {
    margin-right: 12px !important;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}
</style>
