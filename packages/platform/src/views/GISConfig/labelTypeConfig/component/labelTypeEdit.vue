<template>
  <div>
    <el-dialog
      :title="['创建标签类型', '编辑标签类型'][state.dialogType]"
      v-model="state.open"
      width="850px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="标签类型编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" :disabled="state.dialogType == 1" clearable />
        </el-form-item>
        <el-form-item label="标签类型名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" clearable />
        </el-form-item>
        <el-form-item label="所属图层" prop="layerConfigId">
          <el-select v-model="form.layerConfigId" clearable placeholder="请选择...">
            <el-option v-for="(item, index) in layerList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>

        <!-- 对象关联配置 -->
        <el-form-item label="对象关联配置">
          <el-input readonly v-model="reference" />
          <el-button class="reference-button" circle @click="onRefrenceClick">
            <Icon src="EditPen"></Icon>
          </el-button>
        </el-form-item>
        <el-form-item label="默认显示标签名称" prop="isDefaultDisplayLabelName">
          <el-checkbox v-model="form.isDefaultDisplayLabelName" style="width: 200px"></el-checkbox>
        </el-form-item>
        <el-form-item label="默认挂载标签树" prop="isHang">
          <el-checkbox v-model="form.isHang" style="width: 200px"></el-checkbox>
        </el-form-item>
        <el-form-item label="标签图例" prop="labelLegendImagePath">
          <el-select v-model="form.labelLegendImagePath" clearable placeholder="请选择..." filterable>
            <el-option
              v-for="(item, index) in labelLegendImageList.data"
              :key="index"
              :label="item.legendName"
              :value="item.legendPath"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="form.dataType" clearable placeholder="请选择...">
            <el-option
              v-for="(item, index) in dataTypeList.data"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 点 -->
        <template v-if="form.dataType === '1'">
          <!-- 只有是设备类型才有数据来源及数据内容  -->
          <el-form-item prop="dataSource" v-if="form.equipType?.id">
            <template #label>
              <div style="display: flex; align-items: center">
                <span>数据来源</span>
                <div style="display: flex; align-items: center">
                  <el-tooltip effect="dark" content="实时请求的数据还是基础引擎绘制的数据" placement="top">
                    <Icon src="WarningFilled" :size="16" color="#e6a23c"></Icon>
                  </el-tooltip>
                </div>
              </div>
            </template>
            <el-select v-model="form.dataSource" clearable placeholder="请选择...">
              <el-option
                v-for="(item, index) in dataSourceList.data"
                :key="index"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item prop="dataContent" v-if="form.equipType?.id && form.dataSource == 'dynamicQuery'">
            <template #label>
              <div style="display: flex; align-items: center">
                <span>数据内容</span>
                <div style="display: flex; align-items: center">
                  <el-tooltip effect="dark" content="选择绑定的监测属性" placement="top">
                    <Icon src="WarningFilled" :size="16" color="#e6a23c"></Icon>
                  </el-tooltip>
                </div>
              </div>
            </template>
            <el-select v-model="form.dataContent" clearable placeholder="请选择...">
              <el-option
                v-for="(item, index) in dataContentList.data"
                :key="index"
                :label="item.attributeName"
                :value="item.attributeCode"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="样式" prop="selectStyle">
            <el-select v-model="form.selectStyle" clearable placeholder="请选择..." filterable>
              <el-option
                v-for="(item, index) in selectStyleList.data"
                :key="index"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="内置样式对象" prop="styleObject" v-if="form.selectStyle == 'builtInStyle'">
            <el-select v-model="form.styleObject" clearable placeholder="请选择..." filterable>
              <el-option
                v-for="(item, index) in styleObjectList.data"
                :key="index"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="显示比例" prop="displayScale" v-if="form.selectStyle == 'customStyle'">
            <el-input type="number" v-model="form.displayScale" />
          </el-form-item>
          <el-form-item label="标签类型图片" prop="labelTypeImagePath" v-if="form.selectStyle == 'customStyle'">
            <el-select v-model="form.labelTypeImagePath" :multiple="true" clearable placeholder="请选择..." filterable>
              <el-option
                v-for="(item, index) in labelLegendImageList.data"
                :key="index"
                :label="item.legendName"
                :value="item.legendPath"
              ></el-option>
            </el-select>
          </el-form-item>
          <!-- 点类型下轨迹的设置（绘制轨迹时可以找到所属类型拿轨迹设置及图层信息） -->
          <el-form-item label="轨迹设置" prop="isTrackSetting">
            <el-checkbox v-model="form.isTrackSetting" style="width: 200px" />
          </el-form-item>
          <div></div>
        </template>
        <!-- 线 面 圆 矩形 轨迹配置时   要不要icon -->
        <template v-if="['2', '3', '4', '5', '7'].includes(form.dataType) || form.isTrackSetting">
          <el-form-item label="线宽" prop="lineWidth">
            <el-input type="number" v-model="form.lineWidth" />
          </el-form-item>

          <el-form-item label="速度单位" prop="speedUnit" v-if="form.isTrackSetting && form.dataType == '1'">
            <el-input v-model="form.speedUnit" />
          </el-form-item>

          <el-form-item
            label="线色"
            prop="lineColor"
            style="width: 350px"
            v-if="['2', '3', '4', '5', '7'].includes(form.dataType)"
          >
            <el-color-picker v-model="form.lineColor" show-alpha />
          </el-form-item>
          <el-form-item label="线型" prop="lineType" v-if="['2', '3', '4', '5', '7'].includes(form.dataType)">
            <el-select v-model="form.lineType" placeholder="请选择..." clearable>
              <el-option label="实线" value="solid"></el-option>
              <el-option label="虚线" value="dash"></el-option>
            </el-select>
          </el-form-item>
          <!-- 数据类型是线、环且是虚线时 -->
          <el-form-item
            prop="animationSetting"
            label="动画设置"
            v-if="form.lineType == 'dash' && (form.dataType == '2' || form.dataType == '7')"
            style="width: 350px"
          >
            <el-select v-model="form.animationSetting" placeholder="请选择..." clearable>
              <el-option
                v-for="(item, index) in animationList.data"
                :key="index"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
        </template>
        <!-- 面 圆 矩形 -->
        <template v-if="['3', '4', '5'].includes(form.dataType)">
          <el-form-item label="面填充色" prop="polygonColor" style="width: 350px">
            <el-color-picker v-model="form.polygonColor" show-alpha />
          </el-form-item>
        </template>
        <!-- 线 -->
        <template v-if="form.dataType === '2'">
          <el-form-item label="矢量路径" prop="lineVectorPath">
            <el-input placeholder="请输入..." v-model="form.lineVectorPath" clearable />
          </el-form-item>
          <el-form-item label="矢量宽度" prop="lineVectorWidth">
            <el-input type="number" v-model="form.lineVectorWidth" />
          </el-form-item>
          <el-form-item label="矢量高度" prop="lineVectorHeight">
            <el-input type="number" v-model="form.lineVectorHeight" />
          </el-form-item>
          <el-form-item label="矢量显示比例" prop="lineVectorProportion">
            <el-input type="number" v-model="form.lineVectorProportion" />
          </el-form-item>
        </template>
        <!-- 文本 -->
        <template v-if="form.dataType === '6'">
          <el-form-item label="文本内容" prop="content">
            <el-input placeholder="请输入..." v-model="form.content" clearable />
          </el-form-item>
          <el-form-item label="是否加粗" prop="isBold">
            <el-checkbox v-model="form.isBold" style="width: 200px"></el-checkbox>
          </el-form-item>
          <el-form-item label="字体" prop="fontType">
            <el-select v-model="form.fontType" placeholder="请选择..." clearable>
              <el-option label="微软雅黑" value="MicrosoftYaHei"></el-option>
              <el-option label="宋体" value="SimSun"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="字体大小" prop="fontSize">
            <el-input type="number" v-model="form.fontSize" />
          </el-form-item>
          <el-form-item label="字体颜色" prop="fontColor" style="width: 350px">
            <el-color-picker v-model="form.fontColor" show-alpha />
          </el-form-item>
          <el-form-item label="边框线宽" prop="borderWidth">
            <el-input type="number" v-model="form.borderWidth" />
          </el-form-item>
          <el-form-item label="边框颜色" prop="borderColor" style="width: 350px">
            <el-color-picker v-model="form.borderColor" show-alpha />
          </el-form-item>
          <el-form-item label="背景颜色" prop="backGroundColor" style="width: 350px">
            <el-color-picker v-model="form.backGroundColor" show-alpha />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm" :loading="btnLoading">确认</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 默认关联设备信息 -->
    <ReferenceMain ref="referenceMainRef" @reference-change="onReferenceChange"></ReferenceMain>
    <!-- 关联自定义对象信息 -->
    <ReferenceObject ref="referenceObjectRef" @reference-object-change="onReferenceObjectChange"></ReferenceObject>
  </div>
</template>

<script lang="ts" setup name="LabelTypeEdit">
import { reactive, onMounted, ref, computed, watch } from "vue";
import { ElForm, ElMessage } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { handleParam } from "@/utils/common.js";
import {
  getLabelTypeDetail,
  getLabelDataType,
  getLayerList,
  addLabelType,
  editLabelType,
  getLegendConfigList
} from "@/api/visconfig.js";
import { getBindAttributeMonitor } from "@/api/device.js";
import ReferenceMain from "./referenceMain.vue";
import ReferenceObject from "./referenceObject.vue";
import { LabelType } from "../../type";

const emit = defineEmits(["successAdd"]);
const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("标签类型编码只能出现字母,数字,下划线"));
  }
  callback();
};
const displayScaleVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumberFloat.test(value)) {
    return callback(new Error("只能为大于0的数字"));
  }
  callback();
};
const fontSizeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyPositiveInteger.test(value)) {
    return callback(new Error("只能为大于0的整数"));
  }
  callback();
};

// 线时 矢量宽 高 显示比例(非必填) 正数           文本线宽增加正数校验
const lineVectoVerification = (rule: any, value: any, callback: Function) => {
  if (value && !Regular.verifyPositiveInteger.test(value)) {
    return callback(new Error("只能为大于0的整数"));
  }
  callback();
};

// 是设备关联对象还是其他
const referenceType = ref("");
const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    code: [
      { required: true, message: "标签类型编码不能为空", trigger: ["blur", "change"] },
      { validator: codeVerification, trigger: ["blur", "change"] },
      { max: 50, message: "标签类型编码长度不能大于50", trigger: ["blur", "change"] }
    ],
    name: [
      { required: true, message: "标签类型名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "标签类型名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    layerConfigId: [{ required: true, message: "请选择所属图层", trigger: ["blur", "change"] }],
    dataType: [{ required: true, message: "请选择数据类型", trigger: ["blur", "change"] }],
    dataSource: [{ required: true, message: "请选择数据来源", trigger: ["blur", "change"] }],
    selectStyle: [{ required: true, message: "请选择样式", trigger: ["blur", "change"] }],
    styleObject: [{ required: true, message: "请选择内置样式对象", trigger: ["blur", "change"] }],
    dataContent: [{ required: true, message: "请选择数据内容", trigger: ["blur", "change"] }],
    displayScale: [
      { required: true, message: "显示比例不能为空", trigger: ["blur", "change"] },
      { validator: displayScaleVerification, trigger: ["blur", "change"] }
    ],
    labelTypeImagePath: [{ required: true, message: "标签类型图片不能为空", trigger: ["blur", "change"] }],
    lineWidth: [
      { required: true, message: "线宽不能为空", trigger: ["blur", "change"] },
      { validator: displayScaleVerification, trigger: ["blur", "change"] }
    ],
    lineType: [{ required: true, message: "请选择线型", trigger: ["blur", "change"] }],
    lineColor: [{ required: true, message: "请选择线色", trigger: ["blur", "change"] }],
    polygonColor: [{ required: true, message: "请选择面填充色", trigger: ["blur", "change"] }],
    content: [
      { required: true, message: "文本内容不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "文本内容长度不能大于500", trigger: ["blur", "change"] }
    ],
    fontType: [{ required: true, message: "请选择字体", trigger: ["blur", "change"] }],
    fontColor: [{ required: true, message: "请选择字体颜色", trigger: ["blur", "change"] }],
    fontSize: [
      { required: true, message: "字体大小不能为空", trigger: ["blur", "change"] },
      { validator: fontSizeVerification, trigger: ["blur", "change"] }
    ],
    lineVectorWidth: [{ validator: lineVectoVerification, trigger: ["blur", "change"] }],
    lineVectorHeight: [{ validator: lineVectoVerification, trigger: ["blur", "change"] }],
    lineVectorProportion: [{ validator: lineVectoVerification, trigger: ["blur", "change"] }],
    borderWidth: [{ validator: lineVectoVerification, trigger: ["blur", "change"] }]
  }
});

const referenceMainRef = ref<InstanceType<typeof ReferenceMain>>();
const referenceObjectRef = ref<InstanceType<typeof ReferenceObject>>();
const refForm = ref<InstanceType<typeof ElForm>>();
const btnLoading = ref(false);

// 创建时form表单字段及默认值
const defaultParam = {
  code: "",
  name: "",
  layerConfigId: "",

  // 物理、逻辑的设备类型及属性传参
  equipType: null, // 设备类型 {}
  equipTypeId: 0, // 设备类型id 1441

  attribute: null, // 关联属性对象
  attributeId: 0, // 关联属性id（取值attribute中的extendAttribute）
  referenceValue: "", //  json string  属性类型及选择值（type为select是需要该字段）
  referenceValueReal: "", // 属性值（属性绑定的值即用户输入的值）

  // 外部对象的传参
  isVisitObject: null,

  // 其他关联对象的传参数
  referenceObject: null, // 配置的关联对象（自定义的关联对象，例如除设备关联外的其他 是一个表格行数据）

  isDefaultDisplayLabelName: false, // 默认展示标签名称
  isHang: true, // 是否挂载标签树
  labelLegendImagePath: "", // 标签图例
  labelLegendImageAllPath: "",
  dataType: "1",
  displayScale: 1,
  pellucidity: 1,
  labelTypeImagePath: [],
  lineWidth: 1,
  speedUnit: "节",
  lineType: "solid",
  lineColor: "rgba(0,0,0,1)",
  polygonColor: "rgba(0,0,0,1)",
  lineVectorPath: "",
  lineVectorWidth: 10,
  lineVectorHeight: 10,
  lineVectorProportion: 1,
  content: "",
  fontType: "MicrosoftYaHei",
  isBold: false,
  fontColor: "rgba(0,0,0,1)",
  fontSize: 12,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,1)",
  backGroundColor: "rgba(0,0,0,0.3)",
  isTrackSetting: false, // 轨迹设置
  animationSetting: "", // 动画设置
  trackLineStyle: null, // 轨迹线样式
  selectStyle: "customStyle", // 样式
  styleObject: "", // 内置样式对象
  dataSource: "draw", // 数据源（自己绘制还是实时请求）
  dataContent: "" // 数据源是实时查询时关联的属性名
};

// 表单字段
let form = ref<
  LabelType & {
    referenceValue: string;
    referenceValueReal: any;
    isTrackSetting: any;
    labelLegendImagePath: any;
    animationSetting: string;
    referenceObject: any;
    trackLineStyle: any;
    isVisitObject?: any;
    speedUnit: string;
    selectStyle?: string;
    styleObject?: string;
    dataSource?: string;
    dataContent?: string;
  }
>(defaultParam);

const timer: any = ref(null);

// 关联设备信息
// 没绑定展示空
// 光设备类型 展示 设备类型名
// 设备类型及属性都存在展示  设备类型名 属性名及值
const reference = computed(() => {
  // 关联信息的v-model字段
  if (referenceType.value == "other") {
    if (form.value.referenceObject) {
      let { name } = form.value?.referenceObject;
      return `${name}`;
    } else {
      return "";
    }
  } else {
    if (form.value.equipType && form.value.equipTypeId) {
      if (form.value.attribute && form.value.attributeId) {
        const referenceValue = JSON.parse(form.value.referenceValue);
        const { type, selectedValue } = referenceValue;
        let attributeValue = selectedValue;

        if (type === "select") {
          attributeValue = selectedValue.label;
        }

        return `${form.value.equipType.name} - ${form.value.attribute.label || form.value.attribute.name} - ${attributeValue}`;
      } else {
        return `${form.value.equipType.name}`;
      }
    } else {
      return "";
    }
  }
});

const openDialog = async (row?: { [key: string]: any }) => {
  if (row) {
    // 编辑
    state.dialogType = 1;
    const res: { [key: string]: any } = await getLabelTypeDetail(row.id);
    if (res.code === 200 && res.data) {
      form.value = JSON.parse(JSON.stringify(res.data));
      form.value.isVisitObject = !!res.data?.reference.includes("VisitObject");
    }
    form.value.id = row.id;
    // 首次进来需要执行数据内容接口请求会将其值清空
    timer.value = setTimeout(() => {
      form.value.dataContent = JSON.parse(JSON.stringify(res.data))?.dataContent;
      clearTimeout(timer.value);
      timer.value = null;
    });
  } else {
    // 新建
    state.dialogType = 0;
    form.value = { ...defaultParam };
  }
  if (typeof form.value.labelTypeImagePath == "string") {
    form.value.labelTypeImagePath = form.value.labelTypeImagePath ? form.value.labelTypeImagePath?.split(",") : [];
  } else {
    form.value.labelTypeImagePath = [];
  }

  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onConfirm = () => {
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      let param = { ...form.value };
      // 分别字段值类型转换
      const { isBold, isDefaultDisplayLabelName, lineVectorPath } = param;
      param.isBold = Boolean(isBold);
      param.isDefaultDisplayLabelName = Boolean(isDefaultDisplayLabelName);

      param.lineVectorPath = lineVectorPath || "";

      // 数据类型点且轨迹设置时 拼接trackLineStyle
      if (param.dataType == "1" && param?.isTrackSetting) {
        param.trackLineStyle = {
          lineWidth: param?.lineWidth
        };
      } else {
        // 清除轨迹模式及轨迹线样式、速度单位
        if (param.trackLineStyle) {
          delete param.trackLineStyle;
        }
        if (param.speedUnit) {
          param.speedUnit = "";
        }
      }
      // 点数据时标签类型图片
      if (Array.isArray(param.labelTypeImagePath)) {
        param.labelTypeImagePath = param.labelTypeImagePath.join(",");
      }
      // 校验选择的是聚合图层时只能是点类型数据layerConfigId
      let isTagAgg = false;
      layerList.value.data?.forEach((obj: { [key: string]: any }) => {
        if (`${obj.id}` == `${param.layerConfigId}`) {
          isTagAgg = !!obj?.isTagAgg;
        }
      });
      // 是聚合图层但不是点类型数据
      if (isTagAgg && param.dataType != "1") {
        ElMessage.warning("聚合图层只能选择点类型数据");
        return;
      }
      btnLoading.value = true;
      try {
        if (state.dialogType == 0) {
          // 添加
          const res: { [key: string]: any } = await addLabelType(param);
          if (res.code == 200) {
            ElMessage.success("创建成功");
            emit("successAdd");
            state.open = false;
          }
        } else if (state.dialogType == 1) {
          // 编辑
          const res: { [key: string]: any } = await editLabelType(param);
          if (res.code == 200) {
            ElMessage.success("编辑成功");
            emit("successAdd");
            state.open = false;
          }
        }
      } finally {
        btnLoading.value = false;
      }
    }
  });
};

// 点击对象信息
const onRefrenceClick = () => {
  if (referenceType.value == "other") {
    // 关联其他对象动态弹框
    referenceObjectRef.value?.openDialog();
  } else {
    referenceMainRef.value?.openDialog(); // 关联设备弹框
  }
};

// 确认关联回调（设备类型行（一定有） 设备属性行（不一定）  是物理逻辑还是外部）
const onReferenceChange = (
  equipType: { [key: string]: any },
  equipAttribute: { [key: string]: any },
  isLogical?: number | string
) => {
  if (isLogical == 3) {
    form.value.isVisitObject = true;
  } else {
    form.value.isVisitObject = false;
  }
  form.value.equipType = { ...equipType };
  form.value.equipTypeId = equipType.id;

  // 如果有设备属性对象
  if (equipAttribute) {
    const { type, bindValue, option, extendAttribute } = equipAttribute;
    let selectedValue = bindValue;

    if (type === "select") {
      selectedValue = option.find((item: { [key: string]: any }) => item.value === bindValue);
    }

    form.value.attributeId = extendAttribute;
    form.value.attribute = equipAttribute;
    form.value.referenceValue = JSON.stringify({
      type,
      selectedValue
    });
    form.value.referenceValueReal = bindValue;
  } else {
    form.value.attributeId = null;
    form.value.attribute = null;
  }
};

// 动态关联配置对象回调（关联列表行数据）
const onReferenceObjectChange = (object: { [key: string]: any }) => {
  form.value.referenceObject = { ...object };
};

// 数据类型列表
const dataTypeList = ref<{
  data: Array<{
    label: string;
    value: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLabelDataType();
    if (res.data.dataType) {
      dataTypeList.value.data = res.data.dataType;
    } else {
      ElMessage.error("接口异常");
    }
  }
});

// 标签图例列表
const labelLegendImageList = ref<{
  data: Array<{
    legendName: string;
    legendPath: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLegendConfigList("?pageSize=10000&pageNumber=1", {});
    if (res?.code == 200) {
      labelLegendImageList.value.data = res?.data?.items || [];
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

// 数据内容（根据关联的对象类型请求属性列表）
const dataContentList = ref<{
  data: Array<{
    attributeCode: string;
    attributeName: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    dataContentList.value.data = [];
    const res: { [key: string]: any } = await getBindAttributeMonitor(form.value?.equipType?.id, form?.value.isVisitObject); // 传设备类型id
    dataContentList.value.data = res?.data || [];
  }
});

// 动画配置
const animationList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "animations",
      name: "有"
    },
    {
      code: "no",
      name: "无"
    }
  ]
});

// 样式选择
const selectStyleList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "customStyle",
      name: "自定义样式"
    },
    {
      code: "builtInStyle",
      name: "内置样式"
    }
  ]
});

// 内置样式对象
const styleObjectList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "person",
      name: "人"
    },
    {
      code: "aisBoat",
      name: "船"
    }
  ]
});

// 数据来源
const dataSourceList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "draw",
      name: "绘制"
    },
    {
      code: "dynamicQuery",
      name: "实时查询"
    }
  ]
});

// 监听绑定的设备类型id，当变更后更新显示内容列表
watch(
  () => form.value?.equipType?.id,
  val => {
    if (!val) {
      form.value.dataSource = "";
      dataContentList.value.data = [];
    } else {
      dataContentList.value.fetchData();
    }
    form.value.dataContent = ""; // 数据内容
  },
  {
    deep: true,
    flush: "post"
  }
);

onMounted(() => {
  dataTypeList.value.fetchData();
  layerList.value.fetchData();
  labelLegendImageList.value.fetchData();
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
