<template>
  <div class="map-popup" ref="popupRef">
    <div :class="[isRelationBody ? 'popup-custom-box' : 'popup-box']">
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
            <li v-for="item in attrData.staticData" :key="item.label" class="list-item">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </li>
          </ul>
          <!-- v-if="attrData.monitorSequenceData.length" -->
          <div class="monitor-sequence-data">
            <ul class="list">
              <li v-for="item in 6" :key="item" class="list-item">
                <span class="label">温度（℃）</span>
                <span class="value">35</span>
                <span class="time">2023-08-05 16:23:12</span>
              </li>
            </ul>
          </div>
          <div class="monitor-curve-data"></div>
          <div class="monitor-jsonbody-data"></div>
          <div class="link-config">
            <el-button v-for="btn in attrData.linkData" :key="btn.label" type="primary">{{ btn.label }}</el-button>
          </div>
        </div>
      </div>
    </div>
    <!-- 自定义内容插槽 -->
    <!-- <template v-else> -->
    <!-- <slot name="customContent"></slot> -->
    <!-- </template> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import Icon from "./Icon.vue";
import { getEquipData, lineRealTimeCurveApi, labelDetailAttr } from "../../api/device";
import dayjs from "dayjs";

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
  staticData: [
    {
      label: "Username",
      value: "kooriookami"
    },
    {
      label: "Telephone",
      value: "18100000000"
    },
    {
      label: "Place",
      value: "Suzhou"
    },
    {
      label: "Address",
      value: "No.1188, Wuzhong Avenue, Wuzhong"
    }
  ],
  monitorSequenceData: [], // 监测散点数据
  monitorLineData: [], //监测线性数据
  monitorJSONbodyData: [], // 监测结构体数据
  linkData: [
    {
      label: "关注"
    },
    {
      label: "定位"
    },
    {
      label: "轨迹"
    },
    {
      label: "备注"
    }
  ]
});
// 获取设备数据
const getDataFromAttr = (equipCodes: string, attributes: string) => {
  return new Promise(async (resolve, reject) => {
    const res: any = await getEquipData({
      equipCodes, // 设备编码集合
      attributes,
      isHistory: false, // 是否是历史数据 , 实时数据查询最近一条记录
      isVisitObject: false, // 是否是外部对象（船）
      isLineData: false, // 是否线性数据--数据类型
      dataTime: dayjs().format("YYYY-MM-DD HH:mm:ss"), //数据时间，针对具体时间
      tenantId: 1 // 租户
    });
    if (res.code === 200) {
      resolve(res.data);
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

// 获取左键配置信息
const getLabelDialogConfigInfo = async (relationMap: any) => {
  if (!relationMap) {
    isRelationBody.value = false;
    return;
  }
  isRelationBody.value = true;
  console.log(relationMap);
  const { equipType, code } = relationMap || {};
  // 设备类别 EquipCategory  设备类型 EquipType  外部设备类型 VisitObjectType
  const currentType = "EquipType";
  const detailRes: any = await labelDetailAttr(equipType, currentType);
  if (detailRes.code !== 200) return;
  // configInfo.value = detailRes.data
  configInfo.value = {
    title: "ais" + equipType,
    staticAttribute: [
      {
        attributeId: 2431,
        attributeCode: "AENDPO",
        attributeName: "A相结束位置"
      },
      {
        attributeId: 2430,
        attributeCode: "ASTARTPO",
        attributeName: "A相起始位置"
      },
      {
        attributeId: 2433,
        attributeCode: "BENDPO",
        attributeName: "B相结束位置"
      },
      {
        attributeId: 2432,
        attributeCode: "BSTARTPO",
        attributeName: "B相起始位置"
      }
    ],
    monitorAttribute: [
      {
        attributeCode: "AOT",
        attributeId: 2047,
        attributeName: "A相缆表温度",
        attributeType: "91"
      },
      {
        attributeCode: "AMAXOT",
        attributeId: 2051,
        attributeName: "A相最高缆表温度",
        attributeType: "2"
      },
      {
        attributeCode: "BOT",
        attributeId: 2048,
        attributeName: "B相缆表温度",
        attributeType: "91"
      },
      {
        attributeCode: "BMAXOT",
        attributeId: 2052,
        attributeName: "B相最高缆表温度",
        attributeType: "2"
      }
    ],
    linkConfig: [
      {
        equipType: 769,
        buttonType: 2,
        name: "关注",
        action: "focus", // 动作
        createdBy: "",
        createdOn: "",
        updatedBy: "",
        updatedOn: ""
      }
    ]
  };
  attrData.linkData = configInfo.value?.linkConfig || [];
  const { staticAttr, monitorSeqAttr, monitorLineAttr, monitorJSONbodyAttr } = getDiffAttrCode();
  // 获取静态属性数据 监测散点/结构体数据
  const res: any = await getDataFromAttr(code, staticAttr.concat(monitorSeqAttr, monitorJSONbodyAttr).join(","));
  if (res.code === 200) {
    let telemetryData = res.data.telemetry; //监测的
    let descriptionsData = res.data.descriptions; //静态的
    attrData.staticData = descriptionsData;
    attrData.monitorSequenceData = [];
    attrData.monitorJSONbodyData = [];
    telemetryData.forEach((item: any) => {
      if (monitorSeqAttr.includes(item.code)) {
        attrData.monitorSequenceData.push(item);
      }
      if (monitorJSONbodyAttr.includes(item.code)) {
        attrData.monitorJSONbodyData.push(item);
      }
    });
  }
  // 获取监测线性数据
  const lineRes: any = await lineRealTimeCurveApi({
    equipCode: code,
    attributes: monitorLineAttr.join(",")
  });
  if (lineRes.code === 200) {
    attrData.monitorLineData = lineRes.data;
  }
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
        padding-bottom: 12px;
        line-height: 23px;
        .label {
          width: 80px;
          color: var(--el-text-color-regular);
        }
        .value {
          width: 300px;
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
      margin-top: 10px;
    }
    .monitor-jsonbody-data {
      margin-top: 10px;
    }
    .link-config {
      margin-top: 10px;
    }
  }
}
.popup-custom-box {
  width: 860px;
}
.popup-box {
  width: 450px;
}
</style>
