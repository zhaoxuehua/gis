<template>
  <div class="map-popup" ref="popupRef">
    <div :class="['popup-box', state.isRelationBody ? 'popup-custom-box' : '']" v-if="props?.data?.featureCode">
      <div class="map-popup-header">
        <span>{{ configInfo?.label || "标签信息" }} </span>
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
              <span class="label">{{ item.name }}</span>
              <span class="value">{{ item.value }}</span>
            </li>
          </ul>
          <div class="monitor-sequence-data" v-if="attrData.monitorSequenceData.length">
            <ul class="list">
              <li v-for="item in attrData.monitorSequenceData" :key="item.code" class="list-item">
                <span class="label">{{ item.name }}{{ item.unit ? `(${item.unit})` : "" }}</span>
                <span class="value">{{ item.value }}</span>
                <span class="time">{{ state.currentTime }}</span>
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
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, computed, watch } from "vue";
import Icon from "../Icon.vue";
import { getEquipData, lineRealTimeCurveApi, labelDetailAttr } from "../../../api/device";
import dayjs from "dayjs";
import lineChart from "../lineChart.vue";
import jsonBody from "./jsonBody.vue";
import { ElMessage } from "element-plus";
import { addAttentionApi, getAttentionList, deleteDialogAttentionApi } from "../../../api/gis.js";
import type { VisualMap } from "../../type";

// import { chartData } from "./popupmock";

const props = withDefaults(defineProps<{ map: VisualMap | null; data: { [key: string]: any } }>(), {
  data: () => ({}),
  map: () => null
});

const emits = defineEmits(["onClose", "scada", "view", "track"]);
const popupRef = ref<InstanceType<typeof HTMLElement>>();

const onClosePopup = () => {
  emits("onClose");
};

const getDOMElement = () => {
  return popupRef.value;
};

// 左键配置信息
const configInfo = ref();
const attrData: any = reactive({
  // 静态属性数据
  staticData: [],
  monitorSequenceData: [], // 监测散点数据
  monitorLineAttr: [], //监测线性属性code
  monitorJSONbodyData: [], // 监测结构体数据
  linkData: [],
  hasFocusBtn: false,
  monitorJSONbodyMap: {}
});

// 左键选择的设备信息
const equipInfo: any = ref({
  equipType: 0,
  code: "",
  isVisitObject: false,
  associationInfo: {}
});
const state = reactive({
  isRelationBody: false, // 是否是关联设备
  currentTime: "", // 当前时间
  countCharts: {} // 图标集合
});

// 获取设备数据
const getDataFromAttr = (equipCodes: string, attributes: string) => {
  return new Promise(async (resolve, reject) => {
    const res: any = await getEquipData({
      equipCodes, // 设备编码集合
      attributes,
      isHistory: false, // 是否是历史数据 , 实时数据查询最近一条记录
      isVisitObject: equipInfo.value.isVisitObject, // 是否是外部对象（船）
      isLineData: false, // 是否线性数据--数据类型
      dataTime: state.currentTime, //数据时间，针对具体时间
      tenantId: 1 // 租户
    });
    if (res.code === 200) {
      resolve(res);
    } else {
      reject(res);
    }
  });
};

const getDiffAttrCode = () => {
  // 散点类型
  const sequenceType = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // 线性类型
  const lineType = [91, 92, 93];
  let staticAttr = configInfo.value.staticAttribute.map((item: any) => item.attributeCode);
  let monitorSeqAttr: string[] = [];
  let monitorLineAttr: string[] = [];
  let monitorJSONbodyMap: any = {};
  configInfo.value.monitorAttribute.forEach((item: any) => {
    if (lineType.includes(Number(item.attributeType))) {
      monitorLineAttr.push(item.attributeCode);
    }
    if (sequenceType.includes(Number(item.attributeType))) {
      monitorSeqAttr.push(item.attributeCode);
    }
    if ([10].includes(Number(item.attributeType))) {
      monitorJSONbodyMap[item.attributeCode] = item.attributeJsonConfig;
    }
  });
  return {
    staticAttr,
    monitorSeqAttr,
    monitorLineAttr,
    monitorJSONbodyMap
  };
};

const lineChartRef = ref();

// 获取左键配置信息
const getLabelDialogConfigInfo = async (relationMap: any) => {
  if (!Object.keys(relationMap || {}).length) {
    state.isRelationBody = false;
    return;
  }
  state.isRelationBody = true;
  console.log(relationMap);
  state.currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const { isVisitObject = false } = relationMap || {};
  equipInfo.value = relationMap;
  // equipInfo.value = {
  //   equipType: 761,
  //   code: "tunnel01",
  //   isVisitObject
  // };
  // 设备类别 EquipCategory  设备类型 EquipType  外部设备类型 VisitObjectType
  const currentType = isVisitObject ? "VisitObjectType" : "EquipType";
  // 获取配置的绑定属性
  const detailRes: any = await labelDetailAttr(equipInfo.value.equipType, currentType);
  if (detailRes.code !== 200) return;
  configInfo.value = detailRes.data;
  attrData.linkData = configInfo.value?.linkConfig || [];
  attrData.hasFocusBtn = !!attrData.linkData.find((item: any) => item.buttonType === 3);
  if (attrData.hasFocusBtn) {
    attrData.linkData = attrData.linkData.filter((item: any) => item.buttonType !== 3);
    getFocusStatus();
  }
  // 获取不同属性的code
  const { staticAttr, monitorSeqAttr, monitorLineAttr, monitorJSONbodyMap } = getDiffAttrCode();
  attrData.monitorLineAttr = monitorLineAttr;
  attrData.monitorJSONbodyMap = monitorJSONbodyMap;
  // 获取静态属性数据 监测散点/结构体数据
  const res: any = await getDataFromAttr(
    String(equipInfo.value.code),
    staticAttr.concat(monitorSeqAttr, Object.keys(monitorJSONbodyMap)).join(",")
  );
  if (res.code === 200) {
    const data = res.data.items[0];
    let telemetryData = data?.telemetry || []; //监测的
    let descriptionsData = data?.descriptions || []; //静态的
    attrData.staticData = descriptionsData;
    attrData.monitorSequenceData = []; // 监测散点的
    attrData.monitorJSONbodyData = []; // 监测结构体的
    telemetryData.forEach((item: any) => {
      if (monitorSeqAttr.includes(item.code)) {
        attrData.monitorSequenceData.push(item);
      }
      if (Object.keys(monitorJSONbodyMap).includes(item.code)) {
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
          xAxisName: countCharts[key][0].xaxis || "时间",
          yAxisName: countCharts[key][0].yaxis,
          data: countCharts[key].map((item: any) => {
            return {
              name: item.name,
              data: item.values
            };
          })
        });
      });
    });
  }
};

// 不同动作所做的事情
const onAction = (actionType: number) => {
  const actionMap: { [key: number]: any } = {
    1: "scada", // 进入组态
    2: "view" // 全景
    // 4: "track" // 轨迹
  };
  if (actionType === 4) {
    // 4 // 轨迹
    onTrack();
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

const onTrack = () => {};

const focusType = ref(1);
const focusMap: { [key: string]: string } = {
  1: "关注",
  2: "取消关注"
};
const trackSearchCode = computed(() => props.map?.defaultOptions.trackSearchCode);
const getFocusStatus = async () => {
  const res: any = await getAttentionList(
    {
      objectCode: equipInfo.value.code,
      objectTypeCode: trackSearchCode.value
    },
    {
      params: {
        pageSize: 1,
        pageNumber: 100000
      }
    }
  );
  if (res.code === 200) {
    focusType.value = res.data.items.length ? 2 : 1;
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
    objectTypeCode: trackSearchCode.value
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
    objectType: trackSearchCode.value
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
  // getLabelDialogConfigInfo
});
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
