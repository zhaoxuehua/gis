<template>
  <div class="map-popup" ref="popupRef">
    <div :class="['popup-box', isRelationBody ? 'popup-custom-box' : '']">
      <div v-if="props?.data?.featureCode">
        <div class="map-popup-header">
          <span>{{ configInfo?.label || "标签信息" }} </span>
          <Icon src="Close" :size="14" @click="onClosePopup" class="icon"></Icon>
        </div>
        <div class="map-popup-body" v-if="!isRelationBody">
          <div class="content">
            <span>名称：{{ props?.data?.featureName || "" }}</span>
            <span>编码：{{ props?.data?.featureCode || "" }}</span>
          </div>
        </div>
        <div v-else class="map-popup-body">
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
                <span class="time">{{ currentTime }}</span>
              </li>
            </ul>
          </div>
          <lineChart class="monitor-curve-data" ref="lineChartRef" v-if="attrData.monitorLineAttr.length"></lineChart>
          <div class="monitor-jsonbody-data">
            <div v-for="item in attrData.monitorJSONbodyData" :key="item.code">
              <div class="title">{{ item.name }}</div>
              <el-descriptions class="desc-list" title="" :column="2" :border="true" v-if="item.valueType === 'object'">
                <el-descriptions-item
                  v-for="(value, key) in item.value"
                  :key="key"
                  :label="key + ''"
                  class-name="desc-item"
                  label-class-name="desc-label-item"
                >
                  {{ value }}
                </el-descriptions-item>
              </el-descriptions>
              <span v-else> {{ item.value }}</span>
            </div>
          </div>
          <div class="link-config">
            <el-button v-for="btn in attrData.linkData" :key="btn.name" type="primary" @click="onAction(btn.buttonType)">{{
              btn.name
            }}</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from "vue";
import Icon from "./Icon.vue";
import { getEquipData, lineRealTimeCurveApi, labelDetailAttr } from "../../api/device";
import dayjs from "dayjs";
import lineChart from "./lineChart.vue";

const props = withDefaults(defineProps<{ data: { [key: string]: any } }>(), {
  data: () => ({})
});

const emits = defineEmits(["onClose"]);
const popupRef = ref<InstanceType<typeof HTMLElement>>();

const onClosePopup = () => {
  emits("onClose");
};

const getDOMElement = () => {
  return popupRef.value;
};

// 是否是关联设备
const isRelationBody = ref(false);
// 左键配置信息
const configInfo = ref();
const attrData: any = reactive({
  // 静态属性数据
  staticData: [],
  monitorSequenceData: [], // 监测散点数据
  monitorLineAttr: [], //监测线性属性code
  monitorJSONbodyData: [], // 监测结构体数据
  linkData: []
});

// 左键选择的设备信息
const equipInfo = ref({
  equipType: 0,
  code: "",
  isVisitObject: false
});

const currentTime = ref("");

// 获取设备数据
const getDataFromAttr = (equipCodes: string, attributes: string) => {
  return new Promise(async (resolve, reject) => {
    const res: any = await getEquipData({
      equipCodes, // 设备编码集合
      attributes,
      isHistory: false, // 是否是历史数据 , 实时数据查询最近一条记录
      isVisitObject: equipInfo.value.isVisitObject, // 是否是外部对象（船）
      isLineData: false, // 是否线性数据--数据类型
      dataTime: currentTime.value, //数据时间，针对具体时间
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
  let monitorJSONbodyAttr: string[] = [];
  configInfo.value.monitorAttribute.forEach((item: any) => {
    if (lineType.includes(Number(item.attributeType))) {
      monitorLineAttr.push(item.attributeCode);
    }
    if (sequenceType.includes(Number(item.attributeType))) {
      monitorSeqAttr.push(item.attributeCode);
    }
    if ([10].includes(Number(item.attributeType))) {
      monitorJSONbodyAttr.push(item.attributeCode);
    }
  });
  return {
    staticAttr,
    monitorSeqAttr,
    monitorLineAttr,
    monitorJSONbodyAttr
  };
};

const lineChartRef = ref();

// 获取左键配置信息
const getLabelDialogConfigInfo = async (relationMap: any) => {
  if (!Object.keys(relationMap || {}).length) {
    isRelationBody.value = false;
    return;
  }
  isRelationBody.value = true;
  console.log(relationMap);
  currentTime.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const { equipType, code, isVisitObject = false } = relationMap || {};
  equipInfo.value = {
    equipType,
    code,
    isVisitObject
  };
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
  // 获取不同属性的code
  const { staticAttr, monitorSeqAttr, monitorLineAttr, monitorJSONbodyAttr } = getDiffAttrCode();
  attrData.monitorLineAttr = monitorLineAttr;
  // 获取静态属性数据 监测散点/结构体数据
  const res: any = await getDataFromAttr(equipInfo.value.code, staticAttr.concat(monitorSeqAttr, monitorJSONbodyAttr).join(","));
  if (res.code === 200) {
    const data = res.data.items[0];
    let telemetryData = data.telemetry; //监测的
    let descriptionsData = data.descriptions; //静态的
    attrData.staticData = descriptionsData;
    attrData.monitorSequenceData = []; // 监测散点的
    attrData.monitorJSONbodyData = []; // 监测结构体的
    telemetryData.forEach((item: any) => {
      if (monitorSeqAttr.includes(item.code)) {
        attrData.monitorSequenceData.push(item);
      }
      if (monitorJSONbodyAttr.includes(item.code)) {
        item.value = '[{"name":"张三","age":12}]';
        try {
          item.value = JSON.parse(item.value);
          item.valueType = "object";
        } catch (error) {
          // item.value = item.value;
          item.valueType = "string";
        }
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
    nextTick(() => {
      lineChartRef.value.setOption({
        xAxis: {
          name: data.curves[0]?.name
        },
        yAxis: {
          name: ""
        },
        series: data.curves.map((item: any) => {
          return {
            ...item,
            data: item.values
          };
        })
      });
    });
  }
};

// 不同动作所做的事情
const onAction = (actionType: number) => {
  console.log(actionType);
};

defineExpose({
  getDOMElement,
  getLabelDialogConfigInfo
});
</script>

<style lang="scss" scoped>
.map-popup {
  position: absolute;
  bottom: 12px;
  left: -50px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  background-color: #ffffff;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
  &::after,
  &::before {
    position: absolute;
    top: 100%;
    box-sizing: border-box;
    width: 0;
    height: 0;
    pointer-events: none;
    content: " ";
    border: solid transparent;
  }
  &::after {
    left: 48px;
    margin-left: -10px;
    border-width: 10px;
    border-top-color: white;
  }
  &::before {
    left: 48px;
    margin-left: -11px;
    border-width: 11px;
    border-top-color: #cccccc;
  }
  .map-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
  .map-popup-body {
    padding: 20px;
    overflow: hidden;
    font-size: 14px;
    .content {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .static-data {
      display: flex;
      flex-wrap: wrap;
      font-size: 14px;
      .list-item {
        display: flex;
        width: 33%;
        padding-bottom: 12px;
        line-height: 23px;
        .label {
          width: 80px;
          color: var(--el-text-color-regular);
        }
        .value {
          width: 40%;
          margin-left: 10px;
          color: var(--el-text-color-primary);
        }
      }
    }
    .monitor-sequence-data {
      margin-top: 10px;
      overflow-x: scroll;
      .list {
        display: flex;
        flex-wrap: nowrap;
        .list-item {
          display: flex;
          flex-direction: column;
          span {
            padding: 0 10px;
            line-height: 34px;
            color: #606266;

            // color: var(--el-table-text-color);
            text-align: center;
            white-space: nowrap;
            border: 1px solid #ebeef5;
            border-right: 0;
            border-bottom: 0;
            &:last-child {
              border-bottom: 1px solid #ebeef5;
            }
          }
          &:last-child {
            border-right: 1px solid #ebeef5;
          }
          .label {
            color: #303133;

            // color: var(--el-text-color-primary);
            background: #f7f7fa;
          }
        }
      }
    }
    .monitor-curve-data {
      height: 400px;
      margin-top: 10px;
    }
    .monitor-jsonbody-data {
      margin-top: 10px;
      .desc-list {
        width: 88%;
        margin-top: 10px;
      }
      ::v-deep(.desc-item) {
        font-size: 14px;
      }
      ::v-deep(.desc-label-item) {
        width: 100px;
        font-size: 14px;
      }
    }
    .link-config {
      margin-top: 20px;
    }
  }
}
.popup-box {
  width: 450px;
}
.popup-custom-box {
  width: 800px;
  min-height: 400px;
}
</style>
