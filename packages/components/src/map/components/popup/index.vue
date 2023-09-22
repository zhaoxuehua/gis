<template>
  <div class="map-popup" ref="popupRef">
    <div :class="['popup-box', state.isRelationBody ? 'popup-custom-box' : '']" v-if="props?.data?.featureCode">
      <div class="map-popup-header">
        <span v-if="state.isRelationBody">{{ dialogTitle || configInfo?.label || "标签信息" }} </span>
        <span v-else>{{ "标签信息" }} </span>
        <Icon src="Close" :size="14" @click="onClosePopup" class="icon"></Icon>
      </div>
      <div class="map-popup-body" v-if="!state.isRelationBody">
        <div class="content">
          <span>名称：{{ props?.data?.featureName || "" }}</span>
          <span>编码：{{ props?.data?.featureCode || "" }}</span>
        </div>
      </div>
      <div v-else class="map-popup-body map-attr-data">
        <el-scrollbar>
          <ul class="static-data" v-if="attrData.staticData.length">
            <li v-for="item in attrData.staticData" :key="item.code" class="list-item">
              <span class="label">{{ item.name + "：" }}</span>
              <span class="value">{{ item.value }}</span>
            </li>
          </ul>
          <div class="monitor-sequence-data" v-if="attrData.monitorSequenceData.length">
            <ul class="list">
              <li class="list-item">
                <span class="label">属性名称</span>
                <span class="label">属性值</span>
                <span class="label">采集时间</span>
              </li>
              <li v-for="item in attrData.monitorSequenceData" :key="item.code" class="list-item">
                <span class="label">{{ item.name }}{{ item.unit ? `(${item.unit})` : "" }}</span>
                <span class="value" :style="{ color: BUTTON_COLOR_MAP[item.monitorState] }">{{ item.value }}</span>
                <span class="time">{{ item.time }}</span>
              </li>
            </ul>
          </div>
          <div v-if="attrData.monitorLineAttr.length">
            <lineChart
              class="monitor-curve-data"
              v-for="item in Object.keys(state.countCharts).length || 1"
              :key="item"
              ref="lineChartRef"
            ></lineChart>
          </div>
          <jsonBody
            class="monitor-jsonbody-data"
            :jsonbodyData="attrData.monitorJSONbodyData"
            :jsonbodyMap="attrData.monitorJSONbodyMap"
          ></jsonBody>
          <div class="link-config">
            <el-button v-for="btn in attrData.linkData" :key="btn.name" type="primary" @click="onAction(btn.buttonType)">{{
              btn.name
            }}</el-button>
            <el-button v-if="attrData.hasFocusBtn" type="primary" @click="handleFocus">{{ focusMap[focusType] }}</el-button>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
  <el-dialog v-model="state.dialogVisible" title="轨迹查询" width="560px" append-to-body>
    <el-date-picker
      v-model="state.dateTimes"
      type="datetimerange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD HH:mm:ss"
      popper-class="canvas-date-picker"
      style="width: 400px !important"
    >
    </el-date-picker>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="onTrack">查询</el-button>
        <el-button @click="onTrackClose">取消</el-button>
      </div>
    </template>
  </el-dialog>
  <AddRemarkDialog ref="addRemarkRef"></AddRemarkDialog>
  <AlarmListDialog ref="alarmListRef"></AlarmListDialog>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, watch } from "vue";
import Icon from "../Icon.vue";
import { getEquipData, lineRealTimeCurveApi, getEquipDetail } from "../../../api/device";
import dayjs from "dayjs";
import lineChart from "../lineChart.vue";
import jsonBody from "./jsonBody.vue";
import { ElMessage } from "element-plus";
import { addAttentionApi, getAttentionList, deleteDialogAttentionApi } from "../../../api/gis.js";
import type { VisualMap } from "../../type";
import { useJSONBody } from "../../hooks/useJSONBody";
import { getTrackDataByIdFn } from "../../hooks/getTrackDataById"; // 获取单个轨迹数据
import { labelOnSelect } from "../../hooks/index";
import AddRemarkDialog from "./addRemarkDialog.vue";
import AlarmListDialog from "./alarmListDialog.vue";
import { BUTTON_COLOR_MAP } from "../../../constant/index";

// import { chartData, attrconfigData } from "./popupmock";

const props = withDefaults(defineProps<{ map: VisualMap | null; data: { [key: string]: any } }>(), {
  data: () => ({}),
  map: () => null
});

const emits = defineEmits(["onClose", "scada", "view", "track"]);
const popupRef = ref<InstanceType<typeof HTMLElement>>();

const onClosePopup = () => {
  emits("onClose");
};

const addRemarkRef = ref();
const alarmListRef = ref();
const dialogTitle = ref("");
const getDOMElement = () => {
  return popupRef.value;
};

const { configInfo, staticAttr, linkData, monitorSeqAttr, monitorLineAttr, monitorJSONbodyMap, getBindAttr } = useJSONBody();

// 左键配置信息
const attrData: any = reactive({
  // 静态属性数据
  staticData: [],
  monitorSequenceData: [], // 监测散点数据
  monitorLineAttr: [], //监测线性属性code
  monitorJSONbodyData: [], // 监测结构体数据
  linkData: [], // 链接按钮后端数据
  hasFocusBtn: false, // 关注（取消关注）
  monitorJSONbodyMap: {}
});

// 左键选择的设备信息
const equipInfo: any = ref({
  equipType: 0,
  code: "",
  isRealTimeData: false,
  associationInfo: {},
  realObjectTypeCode: "" // 实时查询对象code（只有关注使用，关注只针对实时数据对象）
});

const state = reactive({
  isRelationBody: false, // 是否是关联设备
  currentTime: "", // 当前时间
  countCharts: {}, // 图表集合
  dialogVisible: false, // 轨迹时间选择弹窗
  dateTimes: [] as any
});

// 获取设备数据
const getDataFromAttr = (equipCodes: string, attributes: string) => {
  let param: any = {
    equipCodes, // 设备编码集合
    attributes,
    isHistory: false, // 是否是历史数据 , 实时数据查询最近一条记录
    isLineData: false, // 是否线性数据--数据类型
    dataTime: state.currentTime, //数据时间，针对具体时间
    tenantId: JSON.parse(window.localStorage.getItem("udp-user") || "{}")?.loginTenant // 租户
  };
  if (equipInfo.value?.realObjectTypeCode) {
    param.equipType = equipInfo.value?.realObjectTypeCode;
  }
  return new Promise(async (resolve, reject) => {
    const res: any = await getEquipData(param);
    if (res.code === 200) {
      resolve(res);
    } else {
      reject(res);
    }
  });
};

// 通过设备id获取设备类型id
const getEquipType = async (id: number) => {
  const res: any = await getEquipDetail(id);
  if (res.code === 200) {
    equipInfo.value.equipType = res.data.equipType;
  }
};

const lineChartRef = ref();

// 获取左键配置信息
const getLabelDialogConfigInfo = async (relationMap: any) => {
  //init data
  attrData.staticData = [];
  attrData.monitorSequenceData = [];
  attrData.monitorLineAttr = [];
  attrData.monitorJSONbodyData = [];
  attrData.linkData = [];
  attrData.monitorJSONbodyMap = {};

  if (!Object.keys(relationMap || {}).length) {
    state.isRelationBody = false;
    return;
  }
  state.isRelationBody = true;

  dialogTitle.value = relationMap?.name || "";

  state.currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const { isRealTimeData = false } = relationMap || {};
  equipInfo.value = relationMap;
  // 获取设备类型id（非实时数据需要获取设备类型id）
  if (!isRealTimeData && relationMap?.model.toLocaleLowerCase() === "eam_eqp_equip") {
    await getEquipType(equipInfo.value.id);
  }

  // 获取绑定的属性
  await getBindAttr({
    equipType: equipInfo.value.equipType, // 类型id
    objectTypeCode: equipInfo.value?.realObjectTypeCode, // 实时数据类型code(传了代表是实时数据，后端需要自己看是否外部对象)
    equipCode: equipInfo.value?.code
  });

  attrData.hasFocusBtn = !!linkData.value.find((item: any) => item.buttonType === 3); // 关注
  if (attrData.hasFocusBtn) {
    attrData.linkData = linkData.value.filter((item: any) => item.buttonType !== 3); // 按钮链接除关注
    getFocusStatus();
  } else {
    attrData.linkData = linkData.value;
  }

  attrData.monitorLineAttr = monitorLineAttr.value;
  attrData.monitorJSONbodyMap = monitorJSONbodyMap.value;
  // 获取静态属性数据 监测散点/结构体数据
  const res: any = await getDataFromAttr(
    String(equipInfo.value.code),
    staticAttr.value.concat(monitorSeqAttr.value, Object.keys(monitorJSONbodyMap.value)).join(",")
  );
  if (res.code === 200) {
    const data = res.data.items?.[0];
    let telemetryData = data?.telemetry || []; //监测的
    let descriptionsData = data?.descriptions || []; //静态的
    attrData.staticData = descriptionsData;
    attrData.monitorSequenceData = []; // 监测散点的
    attrData.monitorJSONbodyData = []; // 监测结构体的
    telemetryData.forEach((item: any) => {
      if (monitorSeqAttr.value.includes(item.code)) {
        attrData.monitorSequenceData.push(item);
      }
      if (Object.keys(monitorJSONbodyMap.value).includes(item.code)) {
        attrData.monitorJSONbodyData.push(item);
      }
    });
  }
  // 获取监测线性数据
  getMonitorLine();
};

// 获取监测线性数据
const getMonitorLine = async () => {
  if (!attrData.monitorLineAttr.length) return;
  const lineRes: any = await lineRealTimeCurveApi({
    equipCode: equipInfo.value.code,
    attributes: attrData.monitorLineAttr.join(",")
  });
  if (lineRes.code === 200) {
    let data = lineRes.data;
    // let data = chartData.data;
    const countCharts = data.curves.reduce((pre: any, cur: any) => {
      pre[cur.yaxis] = pre[cur.yaxis] ? pre[cur.yaxis].concat(cur) : [cur];
      return pre;
    }, {});
    state.countCharts = countCharts;
    nextTick(() => {
      Object.keys(countCharts).forEach((key, index) => {
        lineChartRef.value[index].setOption({
          xAxisType: "category", //x轴类型  默认'category'
          xAxisUnit: countCharts[key][0].xaxis || "时间",
          yAxisUnit: countCharts[key][0].yaxis,
          color: countCharts[key].map((item: any) => item.color),
          data: countCharts[key].map((item: any) => {
            return {
              name: item.time + " " + item.name,
              data: item.values
            };
          })
        });
      });
    });
  }
};

// 不同动作所做的事情（3关注单独挪出去处理了）
const onAction = (actionType: number) => {
  const actionMap: { [key: number]: any } = {
    1: "scada", // 进入组态
    2: "view" // 全景
  };
  if (actionType === 4) {
    // 4  轨迹
    state.dialogVisible = true;
  } else if (actionType === 5) {
    // 5 备注
    addRemarkRef.value?.openDialog({
      ...equipInfo.value
    });
  } else if (actionType === 6) {
    // 6 定位（基础引擎有关联关系的实时数据对象的定位）
    labelOnSelect(props?.map, props?.data?.featureCode, false, equipInfo.value?.isRealTimeData);
  } else if (actionType === 7) {
    // 7 告警
    alarmListRef?.value?.openDialog({ equipCode: equipInfo.value?.code });
  } else {
    let option = {
      ...equipInfo.value,
      equip: {
        id: equipInfo.value.associationInfo.assetId,
        model: equipInfo.value.associationInfo.assetModel,
        name: equipInfo.value.name
      }
    };
    emits(actionMap[actionType], actionMap[actionType], option);
  }
};

const onTrack = () => {
  getTrackDataByIdFn({
    code: equipInfo.value.code,
    name: equipInfo.value.name,
    objectTypeCode: equipInfo.value?.realObjectTypeCode, // 实时数据对象类型
    beginTime: state.dateTimes[0],
    endTime: state.dateTimes[1]
  });
  onTrackClose();
};
const onTrackClose = () => {
  state.dialogVisible = false;
};

const focusType = ref(1);
const focusMap: { [key: string]: string } = {
  1: "关注",
  2: "取消关注"
};

const getFocusStatus = async () => {
  const res: any = await getAttentionList(
    {
      objectCode: equipInfo.value.code,
      objectTypeCode: equipInfo.value.realObjectTypeCode
    },
    {
      params: {
        pageSize: 1,
        pageNumber: 100000
      }
    }
  );
  if (res.code === 200) {
    focusType.value = res.data.items.length ? 2 : 1; // 关注还是取消关注
  }
};

const handleFocus = () => {
  if (focusType.value === 1) {
    onFocus();
  }
  if (focusType.value === 2) {
    cancelFocus();
  }
};

// 关注
const onFocus = async () => {
  const res: any = await addAttentionApi({
    objectCode: equipInfo.value.code,
    objectTypeCode: equipInfo.value.realObjectTypeCode
  });
  if (res.code === 200) {
    ElMessage.success("关注成功");
    focusType.value = 2;
  }
};
// 取消关注
const cancelFocus = async () => {
  const res: any = await deleteDialogAttentionApi({
    objectCode: equipInfo.value.code,
    objectType: equipInfo.value.realObjectTypeCode
  });
  if (res.code === 200) {
    ElMessage.success("取消关注成功");
    focusType.value = 1;
  }
};

watch(
  () => props.data.featureCode,
  () => {
    getLabelDialogConfigInfo(props.data.relationMap);
  }
);

defineExpose({
  getDOMElement
});
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
