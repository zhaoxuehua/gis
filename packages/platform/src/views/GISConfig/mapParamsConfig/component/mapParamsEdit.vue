<template>
  <div>
    <el-dialog
      :title="['创建应用场景', '编辑应用场景'][state.dialogType]"
      v-model="state.open"
      width="900px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="场景编码" prop="appCode">
          <el-input placeholder="请输入..." v-model="form.appCode" clearable />
        </el-form-item>
        <el-form-item label="场景名称" prop="appName">
          <el-input placeholder="请输入..." v-model="form.appName" clearable />
        </el-form-item>
        <el-form-item label="默认显示模式" prop="displayMode" style="width: 350px">
          <el-radio-group v-model="form.displayMode">
            <el-radio :label="1" size="large">电子地图</el-radio>
            <el-radio :label="2" size="large">卫星影像</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认展示层级" prop="defaultDisplayLevel">
          <el-input type="number" v-model.number="form.defaultDisplayLevel" />
        </el-form-item>
        <el-form-item label="最低层级" prop="minLevel">
          <el-input type="number" v-model.number="form.minLevel" />
        </el-form-item>
        <el-form-item label="最高层级" prop="maxLevel">
          <el-input type="number" v-model.number="form.maxLevel" />
        </el-form-item>
        <el-form-item label="中心点纬度" prop="defaultCenterPointLatitude">
          <el-input type="number" v-model.number="form.defaultCenterPointLatitude" />
        </el-form-item>
        <el-form-item label="中心点经度" prop="defaultCenterPointLongitude">
          <el-input type="number" v-model.number="form.defaultCenterPointLongitude" />
        </el-form-item>
        <el-form-item label="显示标签类型" prop="displayLabelInfoIds">
          <el-select filterable v-model="form.displayLabelInfoIds" multiple collapse-tags clearable placeholder="请选择...">
            <el-option v-for="(item, index) in labelTypeList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="搜索标签类型" prop="displaySearchIds">
          <el-select v-model="form.displaySearchIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <el-option v-for="(item, index) in searchTypeList" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示图层" prop="displayLayerIds">
          <el-select v-model="form.displayLayerIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <el-option v-for="(item, index) in layerList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示控件" prop="displayControlIds">
          <el-select filterable v-model="form.displayControlIds" multiple collapse-tags clearable placeholder="请选择...">
            <el-option v-for="(item, index) in controlList.data" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示图例" prop="displayLegendIds">
          <el-select v-model="form.displayLegendIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <el-option
              v-for="(item, index) in legendIdsList.data"
              :key="index"
              :label="item.legendName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="显示外部对象类型" prop="trackSearchId">
          <el-select v-model="form.trackSearchId" clearable placeholder="请选择..." filterable>
            <el-option v-for="(item, index) in trackSearchList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="距离单位" prop="scaleLineUnit">
          <el-select v-model="form.scaleLineUnit" clearable placeholder="请选择..." filterable>
            <el-option
              v-for="(item, index) in scaleLineUnitList.data"
              :key="index"
              :label="item.name"
              :value="item.code"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="导航树" prop="customTreeType">
          <el-select v-model="form.customTreeType" clearable placeholder="请选择..." filterable>
            <el-option v-for="(item, index) in navTreeList.data" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
          <el-button
            class="reference-button"
            circle
            @click="customTreeConfigClick"
            v-if="form.customTreeType == 'ExternalCustomTree'"
          >
            <Icon src="EditPen"></Icon>
          </el-button>
        </el-form-item>
        <el-form-item label="设备树" prop="customTreeCode" v-if="form.customTreeType == 'EquipCustomTree'">
          <el-select v-model="form.customTreeCode" clearable placeholder="请选择..." filterable>
            <el-option
              v-for="(item, index) in customTreeCodeList.data"
              :key="index"
              :label="item.name"
              :value="item.code"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="关键词显示配置" prop="keywordConfig">
          <div style="width: 200px">
            <el-button class="reference-button" circle @click="keywordConfigClick">
              <Icon src="EditPen"></Icon>
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="是否可编辑" prop="isEdit">
          <el-checkbox v-model="form.isEdit" style="width: 200px"></el-checkbox>
        </el-form-item>
        <el-form-item
          label="电子地图URL"
          prop="normalUrl"
          v-if="form.displayMode == 1 || form.displayControlIds.includes('mapTypeSwitch')"
        >
          <el-input placeholder="请输入..." v-model="form.normalUrl" clearable />
        </el-form-item>
        <el-form-item
          label="卫星影像URL"
          prop="sateUrl"
          v-if="form.displayMode == 2 || form.displayControlIds.includes('mapTypeSwitch')"
        >
          <el-input placeholder="请输入..." v-model="form.sateUrl" clearable />
        </el-form-item>
        <el-form-item label="路网叠加层URL" prop="overlayUrl" v-if="form.displayControlIds.includes('showOverlay')">
          <el-input placeholder="请输入..." v-model="form.overlayUrl" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
    <KeywordConfigDialog ref="keywordConfigRef" @success-add="saveKeywordConfig"></KeywordConfigDialog>
    <NavTreeConfigDialog ref="navTreeConfigRef" @success-add="saveNavTreeConfig"></NavTreeConfigDialog>
  </div>
</template>

<script lang="ts" setup name="MapParamsEdit">
import { reactive, onMounted, ref, unref, computed } from "vue";
import { ElForm, ElMessage } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { handleParam } from "@/utils/common.js";
import { addMapParams, editMapParams, getLayerList, getLabelTypeList, getLegendConfigList } from "@/api/visconfig.js";
import { objTypeList, customTreeList } from "@/api/device.js";
import { GIS_CONTROLS } from "@/constant/gisConstant";
import KeywordConfigDialog from "./keywordConfigDialog.vue";
import NavTreeConfigDialog from "./navTreeConfigDialog.vue";

interface MapParamsForm {
  id?: number;
  appCode: string;
  appName: string;
  displayMode: number;
  defaultDisplayLevel: number | null;
  minLevel: number | null;
  maxLevel: number | null;
  defaultCenterPointLatitude: number | null;
  defaultCenterPointLongitude: number | null;
  displayLabelInfoIds: number[] | string;
  displayLayerIds: number[] | string;
  displaySearchIds: number[] | string;
  displayControlIds: any;
  displayLegendIds: number[] | string;
  normalUrl: string;
  sateUrl: string;
  overlayUrl: string;
  scaleLineUnit?: string;
  customTreeType?: string;
  customTreeCode?: string;
  externalCustomTree?: any;
  keywordConfig?: any;
  trackSearchId?: string | Number;
  isEdit: boolean;
}
const emit = defineEmits(["successAdd"]);
const layerLevelVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyPositiveInteger.test(value)) {
    return callback(new Error("层级只能为大于0的整数"));
  }
  callback();
};
const lngVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyLng.test(value)) {
    return callback(new Error("经度只能为-180.0～180.0的浮点数"));
  }
  callback();
};
const latVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyLat.test(value)) {
    return callback(new Error("纬度只能为-90.0～90.0的浮点数"));
  }
  callback();
};
const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("场景编码只能出现字母,数字,下划线"));
  }
  callback();
};
const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    appName: [
      { required: true, message: "场景名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "场景名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    appCode: [
      { required: true, message: "场景编码不能为空", trigger: ["blur", "change"] },
      { validator: codeVerification, trigger: ["blur", "change"] },
      { max: 50, message: "场景编码长度不能大于50", trigger: ["blur", "change"] }
    ],
    displayMode: [{ required: true, message: "请选择默认显示模式", trigger: ["blur", "change"] }],
    defaultDisplayLevel: [
      { required: true, message: "默认展示层级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ],
    minLevel: [
      { required: true, message: "最低层级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ],
    maxLevel: [
      { required: true, message: "最高层级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ],
    defaultCenterPointLatitude: [
      { required: true, message: "中心点纬度不能为空", trigger: ["blur", "change"] },
      { validator: latVerification, trigger: ["blur", "change"] }
    ],
    defaultCenterPointLongitude: [
      { required: true, message: "中心点经度不能为空", trigger: ["blur", "change"] },
      { validator: lngVerification, trigger: ["blur", "change"] }
    ],
    displayLabelInfoIds: [{ required: true, message: "请选择显示标签类型", trigger: ["blur", "change"] }],
    displayLayerIds: [{ required: true, message: "请选择显示图层", trigger: ["blur", "change"] }],
    scaleLineUnit: [{ required: true, message: "请选择距离单位", trigger: ["blur", "change"] }],
    customTreeType: [{ required: true, message: "请选择导航树", trigger: ["blur", "change"] }],
    customTreeCode: [{ required: true, message: "请选择设备树", trigger: ["blur", "change"] }],
    normalUrl: [
      { required: true, message: "电子地图URL不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "电子地图URL长度不能大于500", trigger: ["blur", "change"] }
    ],
    sateUrl: [
      { required: true, message: "卫星影像URL不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "卫星影像URL长度不能大于500", trigger: ["blur", "change"] }
    ],
    overlayUrl: [
      { required: true, message: "路网叠加层URL不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "路网叠加层URL长度不能大于500", trigger: ["blur", "change"] }
    ]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();
const keywordConfigRef = ref();
const navTreeConfigRef = ref();

const defaultParam = {
  appName: "",
  appCode: "",
  displayMode: 1,
  defaultDisplayLevel: null,
  minLevel: null,
  maxLevel: null,
  defaultCenterPointLatitude: null,
  defaultCenterPointLongitude: null,

  displayLabelInfoIds: [],
  displayLayerIds: [],
  displaySearchIds: [], // 搜索类型
  displayControlIds: [], // 控件列表
  displayLegendIds: [], // 图例列表
  normalUrl: "",
  sateUrl: "",
  overlayUrl: "",
  scaleLineUnit: "metric", // 距离单位（比例尺及测距用）
  customTreeType: "EquipCustomTree", // 导航树（默认设备树）
  customTreeCode: "", // 设备树编码
  externalCustomTree: {}, // 自定义树配置
  keywordConfig: {}, // 关键词配置
  trackSearchId: "", // 轨迹搜索类型
  isEdit: false // 是否可编辑
};

let form = ref<MapParamsForm>(defaultParam);

const openDialog = (row?: { [key: string]: any }) => {
  if (row) {
    state.dialogType = 1;
    form.value = JSON.parse(JSON.stringify(row));
    form.value.id = row.id;
    // 标签类型
    form.value.displayLabelInfoIds = row.displayLabelInfoIds
      ? row.displayLabelInfoIds.split(",").map((id: string) => Number(id))
      : [];
    // 图层
    form.value.displayLayerIds = row.displayLayerIds ? row.displayLayerIds.split(",").map((id: string) => Number(id)) : [];
    // 搜索类型
    form.value.displaySearchIds = row.displaySearchIds ? row.displaySearchIds.split(",").map((id: string) => Number(id)) : [];
    // 控件
    form.value.displayControlIds = row.displayControlIds ? row.displayControlIds.split(",") : [];
    // 图例
    form.value.displayLegendIds = row.displayLegendIds ? row.displayLegendIds.split(",").map((id: string) => Number(id)) : [];
  } else {
    state.dialogType = 0;
    form.value = { ...defaultParam };
  }
  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onConfirm = () => {
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      let param = unref(form);
      // 校验自定义树时是否配置自定义内容
      if (param.customTreeType == "ExternalCustomTree") {
        if (!param?.externalCustomTree || !param?.externalCustomTree?.code) {
          ElMessage.warning("请设置自定义树配置");
          return;
        }
      }
      // 标签类型参数处理
      if (Array.isArray(param.displayLabelInfoIds)) {
        param.displayLabelInfoIds = param.displayLabelInfoIds.join(",");
      }
      // 图层参数处理
      if (Array.isArray(param.displayLayerIds)) {
        param.displayLayerIds = param.displayLayerIds.join(",");
      }
      // 图层参数处理
      if (Array.isArray(param.displaySearchIds)) {
        param.displaySearchIds = param.displaySearchIds.join(",");
      }
      // 控件参数处理
      if (Array.isArray(param.displayControlIds)) {
        param.displayControlIds = param.displayControlIds.join(",");
      }
      // 图例参数处理
      if (Array.isArray(param.displayLegendIds)) {
        param.displayLegendIds = param.displayLegendIds.join(",");
      }

      if (state.dialogType == 0) {
        // 添加
        const res: { [key: string]: any } = await addMapParams(param);
        if (res.code == 200) {
          ElMessage.success("创建成功");
          emit("successAdd");
          state.open = false;
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      } else if (state.dialogType == 1) {
        // 编辑
        const res: { [key: string]: any } = await editMapParams(param);
        if (res.code == 200) {
          ElMessage.success("编辑成功");
          emit("successAdd");
          state.open = false;
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      }
    }
  });
};

// 控件列表
const controlList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: GIS_CONTROLS
});

// 比例尺单位配置列表
const scaleLineUnitList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "metric",
      name: "米（千米）"
    },
    {
      code: "nautical",
      name: "海里"
    }
  ]
});

// 导航树配置列表
const navTreeList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "EquipCustomTree",
      name: "设备树"
    },
    {
      code: "ExternalCustomTree",
      name: "自定义"
    }
  ]
});

// 设备树列表
const customTreeCodeList = ref<{
  data: Array<{
    name: string;
    code: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await customTreeList("?pageSize=10000&pageNumber=1", {});
    if (res?.items) {
      customTreeCodeList.value.data = res.items;
    } else {
      ElMessage.error("接口异常");
    }
  }
});

// 图例列表
const legendIdsList = ref<{
  data: Array<{
    legendName: string;
    id: number;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLegendConfigList("?pageSize=10000&pageNumber=1", {});
    if (res?.data?.items) {
      legendIdsList.value.data = res.data.items;
    } else {
      ElMessage.error("接口异常");
    }
  }
});
// 图层列表
const layerList = ref<{
  data: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLayerList(
      ...(handleParam({ pageNumber: 1, pageSize: 1000, name: "", orderByColumn: "", isAsc: "" }) as [string, object])
    );
    if (res.data.items) {
      layerList.value.data = res.data.items;
    } else {
      ElMessage.error("接口异常");
    }
  }
});
// 标签类型列表
const labelTypeList = ref<{
  data: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLabelTypeList(
      ...(handleParam({ pageNumber: 1, pageSize: 1000, name: "", orderByColumn: "", isAsc: "" }) as [string, object])
    );
    if (res.data.items) {
      labelTypeList.value.data = res.data.items;
    } else {
      ElMessage.error("接口异常");
    }
  }
});

// 轨迹搜索类型
const trackSearchList = ref<{
  data: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await objTypeList(
      ...(handleParam({ pageNumber: 1, pageSize: 10000, orderByColumn: "", isAsc: "" }) as [string, object])
    );
    if (res.items) {
      trackSearchList.value.data = res.items;
    } else {
      ElMessage.error("接口异常");
    }
  }
});

// 搜索类型列表
const searchTypeList = computed(() => {
  return labelTypeList.value.data?.filter(item => {
    if (Array.isArray(form.value.displayLabelInfoIds)) {
      return form.value.displayLabelInfoIds?.includes(item.id);
    }
  });
});

// 关键词显示配置
const keywordConfigClick = () => {
  keywordConfigRef.value.openDialog(form.value.keywordConfig);
};

// 存储键值对
const saveKeywordConfig = (keywordConfig: { [key: string]: any }) => {
  form.value.keywordConfig = keywordConfig;
};

// 自定义导航树配置弹框
const customTreeConfigClick = () => {
  navTreeConfigRef.value.openDialog(form.value.externalCustomTree, state.dialogType);
};

// 自定义导航树配置内容存储
const saveNavTreeConfig = (navTreeConfig: { [key: string]: any }) => {
  form.value.externalCustomTree = navTreeConfig;
};

onMounted(() => {
  labelTypeList.value.fetchData();
  layerList.value.fetchData();
  legendIdsList.value.fetchData();
  trackSearchList.value.fetchData();
  customTreeCodeList.value.fetchData();
});

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.reference-button {
  margin-left: 5px;
  i {
    margin-right: 0;
  }
}
</style>
