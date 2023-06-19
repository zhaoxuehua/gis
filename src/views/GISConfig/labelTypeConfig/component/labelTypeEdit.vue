<template>
  <div>
    <el-dialog
      :title="['创建标签类型', '编辑标签类型', '标签类型详情'][state.dialogType]"
      v-model="state.open"
      width="850px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="标签类型编码" prop="code">
          <el-input
            placeholder="请输入..."
            v-model="form.code"
            :disabled="state.dialogType == 1 || state.dialogType == 2"
            clearable
          />
        </el-form-item>
        <el-form-item label="标签类型名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" :disabled="state.dialogType == 2" clearable />
        </el-form-item>
        <el-form-item label="所属图层" prop="layerConfigId">
          <el-select v-model="form.layerConfigId" clearable placeholder="请选择..." :disabled="state.dialogType == 2">
            <el-option v-for="(item, index) in layerList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>

        <!-- 对象关联配置 -->
        <el-form-item label="对象关联配置">
          <el-input readonly v-model="reference" :disabled="state.dialogType == 2" />
          <el-button class="reference-button" circle @click="onRefrenceClick" v-if="state.dialogType != 2">
            <Icon src="EditPen"></Icon>
          </el-button>
        </el-form-item>
        <el-form-item label="对应要素" prop="factor">
          <el-input placeholder="请输入..." v-model="form.factor" clearable :disabled="state.dialogType == 2" />
        </el-form-item>
        <el-form-item label="默认显示标签名称" prop="isDefaultDisplayLabelName">
          <el-checkbox v-model="form.isDefaultDisplayLabelName" :disabled="state.dialogType == 2"></el-checkbox>
        </el-form-item>
        <el-form-item label="标签图例" prop="labelLegendImagePath">
          <el-select
            v-model="form.labelLegendImagePath"
            clearable
            placeholder="请选择..."
            :disabled="state.dialogType == 2"
            filterable
          >
            <el-option
              v-for="(item, index) in labelLegendImageList.data"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="form.dataType" clearable placeholder="请选择..." :disabled="state.dialogType == 2">
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
          <el-form-item label="显示比例" prop="displayScale">
            <el-input type="number" v-model="form.displayScale" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="标签类型图片" prop="labelTypeImagePath">
            <el-select
              v-model="form.labelTypeImagePath"
              :multiple="true"
              clearable
              placeholder="请选择..."
              :disabled="state.dialogType == 2"
              filterable
            >
              <el-option
                v-for="(item, index) in labelLegendImageList.data"
                :key="index"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <!-- 点类型下轨迹的设置（绘制轨迹时可以找到所属类型拿轨迹设置及图层信息） -->
          <el-form-item label="轨迹设置" prop="isTrackSetting">
            <el-checkbox v-model="form.isTrackSetting" :disabled="state.dialogType == 2" />
          </el-form-item>
          <div></div>
          <el-form-item label="轨迹模式" prop="trackMode" v-if="form.isTrackSetting">
            <el-select v-model="form.trackMode" clearable placeholder="请选择..." :disabled="state.dialogType == 2">
              <el-option
                v-for="(item, index) in trackModeList.data"
                :key="index"
                :label="item.name"
                :value="item.code"
              ></el-option>
            </el-select>
          </el-form-item>
          <div></div>
          <el-form-item v-if="form.isTrackSetting">
            <template #label>
              <div style="font-weight: bold">轨迹线样式</div>
            </template>
          </el-form-item>
          <div></div>
        </template>
        <!-- 线 面 圆 矩形 轨迹配置时   要不要icon -->
        <template v-if="['2', '3', '4', '5', '7'].includes(form.dataType) || form.isTrackSetting">
          <el-form-item label="线宽" prop="lineWidth">
            <el-input type="number" v-model="form.lineWidth" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="线色" prop="lineColor" style="width: 350px">
            <el-color-picker v-model="form.lineColor" show-alpha :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="线型" prop="lineType">
            <el-select v-model="form.lineType" placeholder="请选择..." clearable :disabled="state.dialogType == 2">
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
            <el-select v-model="form.animationSetting" placeholder="请选择..." clearable :disabled="state.dialogType == 2">
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
          <el-form-item label="面填充色" prop="polygonColor">
            <el-color-picker v-model="form.polygonColor" show-alpha :disabled="state.dialogType == 2" />
          </el-form-item>
        </template>
        <!-- 线 -->
        <template v-if="form.dataType === '2'">
          <el-form-item label="矢量路径" prop="lineVectorPath">
            <el-input placeholder="请输入..." v-model="form.lineVectorPath" clearable :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="矢量宽度" prop="lineVectorWidth">
            <el-input type="number" v-model="form.lineVectorWidth" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="矢量高度" prop="lineVectorHeight">
            <el-input type="number" v-model="form.lineVectorHeight" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="矢量显示比例" prop="lineVectorProportion">
            <el-input type="number" v-model="form.lineVectorProportion" :disabled="state.dialogType == 2" />
          </el-form-item>
        </template>
        <!-- 文本 -->
        <template v-if="form.dataType === '6'">
          <el-form-item label="文本内容" prop="content">
            <el-input placeholder="请输入..." v-model="form.content" clearable :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="是否加粗" prop="isBold">
            <el-checkbox v-model="form.isBold" :disabled="state.dialogType == 2"></el-checkbox>
          </el-form-item>
          <el-form-item label="字体" prop="fontType">
            <el-select v-model="form.fontType" placeholder="请选择..." clearable :disabled="state.dialogType == 2">
              <el-option label="微软雅黑" value="MicrosoftYaHei"></el-option>
              <el-option label="宋体" value="SimSun"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="字体颜色" prop="fontColor">
            <el-color-picker v-model="form.fontColor" show-alpha :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="字体大小" prop="fontSize">
            <el-input type="number" v-model="form.fontSize" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="边框线宽" prop="borderWidth">
            <el-input type="number" v-model="form.borderWidth" :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="边框颜色" prop="borderColor" style="width: 350px">
            <el-color-picker v-model="form.borderColor" show-alpha :disabled="state.dialogType == 2" />
          </el-form-item>
          <el-form-item label="背景颜色" prop="backGroundColor">
            <el-color-picker v-model="form.backGroundColor" show-alpha :disabled="state.dialogType == 2" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer v-if="state.dialogType != 2">
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认</el-button>
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
import { reactive, onMounted, ref, computed } from "vue";
import { ElForm, ElMessage } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { handleParam } from "@/utils/common.js";
import { getLabelTypeDetail, getLabelDataType, getLayerList, addLabelType, editLabelType } from "@/api/visconfig.js";
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
// 是设备关联对象还是其他
const referenceType = ref("other");
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
    trackMode: [{ required: true, message: "请选择轨迹模式", trigger: ["blur", "change"] }]
  }
});

const referenceMainRef = ref<InstanceType<typeof ReferenceMain>>();
const referenceObjectRef = ref<InstanceType<typeof ReferenceObject>>();
const refForm = ref<InstanceType<typeof ElForm>>();

// 创建时form表单字段及默认值
const defaultParam = {
  code: "",
  name: "",
  layerConfigId: "",

  attribute: null, // 关联属性
  attributeId: 0, // 关联属性id
  equipType: null, // 设备类型 {}
  equipTypeId: 0, // 设备类型id 1441
  referenceValue: "", //  json string  属性类型及选择值
  referenceValueReal: "", // 属性值

  referenceObject: null, // 配置的关联对象

  isDefaultDisplayLabelName: false,
  factor: "",
  labelLegendImagePath: "", // 标签图例
  labelLegendImageAllPath: "",
  dataType: "1",
  displayScale: 1,
  pellucidity: 1,
  labelTypeImagePath: [],
  lineWidth: 1,
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
  trackMode: "", // 轨迹模式
  animationSetting: "", // 动画设置
  trackLineStyle: null // 轨迹线样式
};

// 表单字段
let form = ref<
  LabelType & {
    referenceValue: string;
    referenceValueReal: any;
    isTrackSetting: any;
    trackMode: any;
    labelLegendImagePath: any;
    animationSetting: string;
    referenceObject: any;
    trackLineStyle: any;
  }
>(defaultParam);

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

const openDialog = async (row?: { [key: string]: any }, type?: string) => {
  if (row) {
    if (type === "edit") {
      state.dialogType = 1;
    } else {
      state.dialogType = 2;
    }
    const res: { [key: string]: any } = await getLabelTypeDetail(row.id);
    if (res.code === 200 && res.data) {
      form.value = JSON.parse(JSON.stringify(res.data));
    }
    form.value.id = row.id;
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
      let param = { ...form.value };
      // 分别字段值类型转换
      const { isBold, isDefaultDisplayLabelName, lineVectorPath } = param;
      param.isBold = Boolean(isBold);
      param.isDefaultDisplayLabelName = Boolean(isDefaultDisplayLabelName);
      param.lineVectorPath = lineVectorPath || "";

      // 数据类型点且轨迹设置时 拼接trackLineStyle
      if (param.dataType == "1" && param?.isTrackSetting) {
        param.trackLineStyle = {
          lineWidth: param?.lineWidth,
          lineColor: param?.lineColor,
          lineType: param?.lineType
        };
      }

      if (state.dialogType == 0) {
        // 添加
        const res: { [key: string]: any } = await addLabelType(param);
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
        const res: { [key: string]: any } = await editLabelType(param);
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

// 点击对象信息
const onRefrenceClick = () => {
  if (referenceType.value == "other") {
    // 关联其他对象动态弹框
    referenceObjectRef.value?.openDialog();
  } else {
    referenceMainRef.value?.openDialog(); // 关联设备弹框
  }
};

// 确认关联回调
const onReferenceChange = (equipType: { [key: string]: any }, equipAttribute: { [key: string]: any }) => {
  form.value.equipType = { ...equipType };
  form.value.equipTypeId = equipType.id;

  // 如果有设备属性
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
    label: string;
    value: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getLabelDataType();
    if (res.data.dataType) {
      labelLegendImageList.value.data = res.data.dataType;
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

const trackModeList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "dynamic",
      name: "动态延展轨迹线"
    },
    {
      code: "fixed",
      name: "固定轨迹线"
    }
  ]
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
      code: "high",
      name: "快"
    },
    {
      code: "medium",
      name: "中"
    },
    {
      code: "low",
      name: "慢"
    },
    {
      code: "no",
      name: "无"
    }
  ]
});

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
.avatar-uploader {
  ::v-deep(.el-upload) {
    position: relative;
    width: 178px;
    height: 178px;
    overflow: hidden;
    cursor: pointer;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    transition: 0.2s;
    div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }
  ::v-deep(.el-upload:hover) {
    border-color: var(--color-primary);
  }
  .avatar {
    max-width: 100%;
    max-height: 100%;
  }
  .avatar-uploader-icon {
    width: 178px;
    height: 178px;
    font-size: 28px;
    line-height: 178px;
    color: #8c939d;
    text-align: center;
  }
  .upload-image-btn {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex !important;
    align-items: center;
    justify-content: space-evenly !important;
    width: 100%;
    height: 100%;
    font-size: 20px;
    color: #ffffff;
    cursor: default;
    background-color: rgba($color: #000000, $alpha: 50%);
    opacity: 0;
    transition: opacity 0.3s;
    &:hover {
      opacity: 1;
    }
    span {
      display: inline-flex;
      cursor: pointer;
    }
    .svg-icon {
      font-size: 20px;
    }
  }
}
</style>
