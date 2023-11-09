<template>
  <div class="tag-edit-draw" v-if="isShowEditLabel" @click.stop>
    <div class="title">
      <span>编辑标签</span>
      <Icon src="Close" :size="14" @click="onClose"></Icon>
    </div>

    <div class="content">
      <el-form :inline="false" :model="form" label-width="100px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="标签编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" disabled />
        </el-form-item>

        <el-form-item label="标签名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" clearable />
        </el-form-item>

        <el-form-item label="所属图层" prop="refLayer.name">
          <el-input placeholder="请输入..." v-model="form.refLayer.name" disabled />
        </el-form-item>

        <el-form-item label="数据类型" prop="labelType.name">
          <el-input placeholder="请输入..." v-model="labelDataType" disabled />
        </el-form-item>

        <el-form-item label="坐标点" prop="labelData.coordinates">
          <el-input
            placeholder="请输入..."
            v-model="form.labelData.coordinates"
            disabled
            :class="{
              showEditIcon: true
            }"
          />
          <div class="editIcon" @click.stop="showEditPosition">
            <Icon src="Edit" :size="14" class="icon"></Icon>
          </div>
        </el-form-item>

        <!-- 点 -->
        <template v-if="['1'].includes(form.labelType.dataType)">
          <el-form-item label="显示比例" prop="labelData.style.icon.scale">
            <el-input placeholder="请输入..." v-model="form.labelData.style.icon.scale" clearable />
          </el-form-item>

          <el-form-item label="透明度" prop="labelData.style.icon.opacity">
            <el-input placeholder="请输入..." v-model="form.labelData.style.icon.opacity" clearable />
          </el-form-item>
        </template>

        <!-- 圆 -->
        <template v-if="['4'].includes(form.labelType.dataType)">
          <el-form-item label="半径" prop="labelData.radius">
            <el-input placeholder="请输入..." v-model="form.labelData.radius" type="number" clearable />
          </el-form-item>
        </template>

        <!-- 线、面、矩形、圆、环 -->
        <template v-if="['2', '3', '4', '5', '7'].includes(form.labelType.dataType)">
          <el-form-item label="线宽" prop="labelData.style.stroke.width" v-if="!form?.labelData?.style?.lineVector?.path">
            <el-input placeholder="请输入..." v-model="form.labelData.style.stroke.width" clearable />
          </el-form-item>

          <el-form-item label="线型" prop="labelData.style.stroke.lineDash" v-if="!form?.labelData?.style?.lineVector?.path">
            <el-select placeholder="请选择..." v-model="form.labelData.style.stroke.lineDash" clearable style="width: 213px">
              <el-option label="实线" value="solid"></el-option>
              <el-option label="虚线" value="dash"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="线色" prop="labelData.style.stroke.color">
            <el-color-picker v-model="form.labelData.style.stroke.color" show-alpha />
          </el-form-item>
        </template>

        <!-- 线 -->
        <template v-if="['2'].includes(form.labelType.dataType)">
          <el-form-item label="矢量路径" prop="labelData.style.lineVector.path" v-if="form?.labelData?.style?.lineVector?.path">
            <el-input placeholder="请输入..." v-model="form.labelData.style.lineVector.path" clearable disabled />
          </el-form-item>

          <el-form-item label="矢量宽度" prop="labelData.style.lineVector.width" v-if="form?.labelData?.style?.lineVector?.path">
            <el-input placeholder="请输入..." v-model="form.labelData.style.lineVector.width" clearable />
          </el-form-item>

          <el-form-item label="矢量高度" prop="labelData.style.lineVector.height" v-if="form?.labelData?.style?.lineVector?.path">
            <el-input placeholder="请输入..." v-model="form.labelData.style.lineVector.height" clearable />
          </el-form-item>
        </template>

        <!-- 面、矩形、圆 -->
        <template v-if="['3', '4', '5'].includes(form.labelType.dataType)">
          <el-form-item label="填充色" prop="labelData.style.fill.color">
            <el-color-picker v-model="form.labelData.style.fill.color" show-alpha />
          </el-form-item>
        </template>

        <!-- 是否显示标签名称 -->
        <el-form-item
          label="显示标签名称"
          prop="labelData.isDefaultDisplayLabelName"
          v-if="form.labelType.dataType !== '6' && !form?.labelData?.style?.lineVector?.path"
        >
          <el-checkbox v-model="form.labelData.isDefaultDisplayLabelName"></el-checkbox>
        </el-form-item>

        <!-- 文本 -->
        <template
          v-if="
            (['6'].includes(form.labelType.dataType) || form.labelData.isDefaultDisplayLabelName) &&
            !form?.labelData?.style?.lineVector?.path
          "
        >
          <el-form-item label="文本内容" prop="labelData.style.text.text">
            <el-input placeholder="请输入..." v-model="form.labelData.style.text.text" clearable />
          </el-form-item>

          <el-form-item label="字体" prop="font.fontFamily">
            <el-select v-model="form.font.fontFamily" placeholder="请选择..." clearable style="width: 213px">
              <el-option label="微软雅黑" value="MicrosoftYaHei"></el-option>
              <el-option label="宋体" value="SimSun"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="是否加粗" prop="font.isBold">
            <el-checkbox v-model="form.font.isBold"></el-checkbox>
          </el-form-item>

          <el-form-item label="字体大小" prop="font.fontSize">
            <el-input type="number" v-model="form.font.fontSize" />
          </el-form-item>

          <el-form-item label="字体颜色" prop="labelData.style.text.fill">
            <el-color-picker v-model="form.labelData.style.text.fill" show-alpha />
          </el-form-item>

          <el-form-item label="描边大小" prop="labelData.style.text.fontStrokeWidth">
            <el-input type="number" v-model="form.labelData.style.text.fontStrokeWidth" />
          </el-form-item>
          <el-form-item label="描边颜色" prop="labelData.style.text.fontStrokeColor">
            <el-color-picker v-model="form.labelData.style.text.fontStrokeColor" show-alpha />
          </el-form-item>
        </template>

        <el-form-item
          label="标注放置方式"
          prop="labelData.style.text.placement"
          v-if="
            form.labelType.dataType !== '1' &&
            form.labelType.dataType !== '6' &&
            form.labelType.dataType !== '4' &&
            form.labelData.isDefaultDisplayLabelName &&
            !form?.labelData?.style?.lineVector?.path
          "
        >
          <el-select v-model="form.labelData.style.text.placement" placeholder="请选择..." clearable style="width: 213px">
            <el-option label="中心点标注" value="point"></el-option>
            <el-option label="沿要素边标注" value="line"></el-option>
          </el-select>
        </el-form-item>

        <!-- 文本 -->
        <template
          v-if="
            (['6'].includes(form.labelType.dataType) || form.labelData.isDefaultDisplayLabelName) &&
            !form?.labelData?.style?.lineVector?.path
          "
        >
          <el-form-item
            label="旋转角度"
            prop="labelData.style.text.rotation"
            v-if="form.labelData.style.text.placement === 'point'"
          >
            <el-input type="number" v-model="form.labelData.style.text.rotation" />
          </el-form-item>
          <el-form-item
            label="水平偏移量"
            prop="labelData.style.text.offsetX"
            v-if="form.labelData.style.text.placement === 'point'"
          >
            <el-input type="number" v-model="form.labelData.style.text.offsetX" />
          </el-form-item>
          <el-form-item label="垂直偏移量" prop="labelData.style.text.offsetY">
            <el-input type="number" v-model="form.labelData.style.text.offsetY" />
          </el-form-item>

          <el-form-item
            label="边框线宽"
            prop="labelData.style.text.backgroundStrokeWidth"
            v-if="form.labelData.style.text.placement === 'point'"
          >
            <el-input type="number" v-model="form.labelData.style.text.backgroundStrokeWidth" />
          </el-form-item>
          <el-form-item
            label="边框颜色"
            prop="labelData.style.text.backgroundStrokeColor"
            v-if="form.labelData.style.text.placement === 'point'"
          >
            <el-color-picker v-model="form.labelData.style.text.backgroundStrokeColor" show-alpha />
          </el-form-item>
          <el-form-item
            label="背景颜色"
            prop="labelData.style.text.backgroundFill"
            v-if="form.labelData.style.text.placement === 'point'"
          >
            <el-color-picker v-model="form.labelData.style.text.backgroundFill" show-alpha />
          </el-form-item>
        </template>
      </el-form>
    </div>
    <div class="footer">
      <span class="footer-content">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm">确认</el-button>
      </span>
    </div>
    <EditPositionDialog ref="editPositionRef" @success-add="savePosition"></EditPositionDialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onBeforeUnmount, watch } from "vue";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash";
import { Modify, Translate } from "ol/interaction";
import Collection from "ol/Collection";
import { Circle } from "ol/geom";
import { useGisStore } from "../../stores/modules/gis";
import type { LabelForm, LabelInfoData } from "../type";

import { MAP_DATA_TYPE, getLonLatCoordinate } from "../hooks/createGeometry.js";
import { featureUpdate, getFeature } from "../hooks/index.js";
import { editLabel } from "../../api/visconfig";
import type { VisualMap } from "../type";
import Icon from "./Icon.vue";
import EditPositionDialog from "./editPositionDialog.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});

const lineWidthVerify = (rule: any, value: any, callback: Function) => {
  if (!/^(\d|[1-9]\d+)$/.test(value)) {
    return callback(new Error("只能为0-100的整数"));
  }
  callback();
};
const state = reactive({
  isShow: false,
  // 弹窗表单验证
  rulesForm: {
    name: [
      { required: true, message: "标签名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "标签名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    // "labelData.style.icon.src": [{ required: true, message: "标签图片不能为空", trigger: ["blur", "change"] }],
    "labelData.style.icon.scale": [
      { required: true, message: "显示比例不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)(\.\d+)?$/.test(value) || value > 100) {
            return callback(new Error("只能为0-100的整数或浮点数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.icon.opacity": [
      { required: true, message: "透明度不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(?:1|0(?:\.[0-9]{1,4})?)$/.test(value)) {
            return callback(new Error("只能为0-1的浮点数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.radius": [
      { required: true, message: "半径不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)(\.\d+)?$/.test(value)) {
            return callback(new Error("只能为非负浮点数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.stroke.width": [
      { required: true, message: "线宽不能为空", trigger: ["blur", "change"] },
      { validator: lineWidthVerify, trigger: ["blur", "change"] }
    ],
    "labelData.style.lineVector.path": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (value && !/^(M|m).*$/.test(value)) {
            return callback(new Error("SVG path格式不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.lineVector.width": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)(\.\d+)?$/.test(value)) {
            return callback(new Error("只能为正整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.lineVector.height": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)(\.\d+)?$/.test(value)) {
            return callback(new Error("只能为正整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.text.text": [
      { required: true, message: "文本内容不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "文本内容长度不能大于50", trigger: ["blur", "change"] }
    ],
    "font.fontSize": [
      { required: true, message: "字体大小不能为空", trigger: ["blur", "change"] },
      { validator: lineWidthVerify, trigger: ["blur", "change"] }
    ],
    "labelData.style.text.fontStrokeWidth": [{ validator: lineWidthVerify, trigger: ["blur", "change"] }],
    "labelData.style.text.rotation": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)$/.test(value) || value > 360) {
            return callback(new Error("只能为0-360的整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.text.offsetX": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)$/.test(value) || value > 1000) {
            return callback(new Error("只能为0-10000的整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.text.offsetY": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)$/.test(value) || value > 1000) {
            return callback(new Error("只能为0-10000的整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    "labelData.style.text.backgroundStrokeWidth": [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^(\d|[1-9]\d+)$/.test(value) || value > 100) {
            return callback(new Error("只能为0-100的整数"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ]
  }
});

const labelInfoMap = computed(() => {
  return props.map?.get("labelInfoMap") || {};
});

const labelDataType = computed(() => {
  if (form.value.labelType.dataType) {
    return MAP_DATA_TYPE[form.value.labelType.dataType].title; // 点、线、面
  } else {
    return "";
  }
});

const editPositionRef = ref();
const refForm = ref();
const form = ref<LabelForm>({
  id: "",
  code: "",
  name: "",
  refLayer: {},
  refLayerId: null,
  labelType: {},
  labelTypeId: null,
  labelData: {
    isDefaultDisplayLabelName: false,
    radius: 0,
    coordinates: [],
    style: {}
  },
  font: {
    isBold: false,
    fontSize: 12,
    fontFamily: ""
  }
});

const originEditLabel = ref(); // 编辑前的原始数据
const hasEdit = ref(false); // 是否编辑过数据
const isEditSuccess = ref(false); // 是否编辑成功（即是否需要恢复原来的数据）

const gisStore = useGisStore();
const isShowEditLabel = computed(() => {
  return gisStore.isShowEditLabel;
});

// 编辑地图要素（点的话就是平移）
const modifyFeature = ref(); // 编辑的要素
const modify = ref(); // 编辑交互器

// 平移地图要素
const translation = ref(); // 平移交互器

// 打开标签编辑
const onOpen = (labelCode: string) => {
  if (labelCode) {
    let editLabel = null;
    editLabel = cloneDeep(labelInfoMap.value[labelCode]) as LabelInfoData & { font: { [key: string]: any } };
    if (!editLabel) {
      // 从标签信息中找不到（可能别的应用绘制了但是有的应用没有配置对应的类型所以地图上没有）
      ElMessage.warning("标签不存在或已删除");
      return;
    }
    clearModify(); // 恢复上条数据的信息
    originEditLabel.value = cloneDeep(labelInfoMap.value[labelCode]) as LabelInfoData & { font: { [key: string]: any } };
    // 文本标注默认样式
    const defaultTextStyle = {
      font: "normal 12px MicrosoftYaHei",
      fill: "rgba(0, 0, 0, 1)",
      placement: "point",
      fontStrokeWidth: 0,
      offsetX: 0,
      offsetY: editLabel.labelType.dataType === "1" || editLabel.labelType.dataType === "Point" ? 20 : 0,
      rotation: 0, // 旋转角度默认0
      backgroundStrokeWidth: 0 // 边框线宽默认0
    };
    editLabel.labelData.style.text = Object.assign({}, defaultTextStyle, editLabel.labelData.style.text || {});
    // 解析字体样式
    let fontArr =
      editLabel.labelData.style.text && editLabel.labelData.style.text.font
        ? editLabel.labelData.style.text.font.split(" ")
        : defaultTextStyle.font.split(" ");
    editLabel.font = {
      isBold: fontArr[0] === "bold",
      fontSize: Number(fontArr[1].replace("px", "")),
      fontFamily: fontArr[2]
    };
    let feature = getFeature(editLabel, props.map);
    if (!feature) {
      ElMessage.warning("标签不存在或标签类型中已隐藏");
      return;
    }
    // 更新表单
    form.value = editLabel;
    // state.isShow = true;
    gisStore?.setIsShowEditLabel(true);

    // 增加平移功能
    translation.value = new Translate({
      hitTolerance: 30,
      filter: function (allFeature) {
        return allFeature?.get("code") == labelCode;
      }
    });
    props.map?.addInteraction(translation.value); // 给地图增加平移要素几何的交互
    translation.value.on("translating", function (event: any) {
      const feature = event.features?.getArray()[0];
      let featureCoordinates = feature.getGeometry()?.getCoordinates(); // 坐标集合
      // 坐标转换：EPSG:3857转为EPSG:4326  投影到经纬度
      if (feature.getGeometry() instanceof Circle) {
        // 平移时圆只有中心点变化
        featureCoordinates = feature.getGeometry().getCenter();
      }
      featureCoordinates = getLonLatCoordinate(featureCoordinates);
      // 根据平移坐标
      form.value.labelData.coordinates = featureCoordinates;
    });

    // 标签元素进入编辑状态（点1、文本6不需要编辑交互只需要平移）
    modifyFeature.value = feature;
    modify.value = new Modify({ features: new Collection([modifyFeature.value]) });
    props.map?.addInteraction(modify.value); // 给地图增加修改要素几何的交互
    modify.value.on("modifyend", function (event: any) {
      const feature = event.features.getArray()[0];
      let featureCoordinates = feature.getGeometry().getCoordinates(); // 坐标集合
      let radius = null; // 圆的半径
      if (feature.getGeometry() instanceof Circle) {
        // 编辑圆时只有半径变化
        featureCoordinates = feature.getGeometry().getCenter();
        radius = feature.getGeometry().getRadius();
      }
      // 坐标转换：EPSG:3857转为EPSG:4326  投影到经纬度
      featureCoordinates = getLonLatCoordinate(featureCoordinates);
      // 根据拖拽更新表单中圆半径及坐标
      form.value.labelData.coordinates = featureCoordinates;
      form.value.labelData.radius = radius;
    });
  }
};

// 关闭标签编辑
const onClose = () => {
  gisStore?.setIsShowEditLabel(false);
  clearModify(); // 恢复原数据
};

// 编辑坐标（线、面、矩形、环）
const showEditPosition = () => {
  editPositionRef.value?.openDialog(cloneDeep(form.value.labelData.coordinates), form.value.labelType.dataType);
};
// 坐标更改后的回调
const savePosition = (coordinates: any[]) => {
  form.value.labelData.coordinates = coordinates;
};

// 新表单数据变化应用到地图上
const applyModify = (data: any) => {
  hasEdit.value = true;
  isEditSuccess.value = false;
  labelInfoMap.value[data?.code] = data;
  props.map.set("labelInfoMap", labelInfoMap.value); // 更新标签树
  if (data && data.labelData && data.labelData.radius) {
    data.labelData.radius = Number(data.labelData.radius);
  }
  featureUpdate(data, props.map);
};

// 保存
const onConfirm = () => {
  refForm.value.validate((valid: any) => {
    if (valid) {
      const { id, code, name, labelTypeId, labelType, refLayerId, refLayer, labelData } = form.value;

      editLabel({
        id,
        code,
        name,
        labelTypeId,
        labelType,
        refLayerId,
        refLayer,
        labelData: JSON.stringify(labelData)
      }).then(
        (res: any) => {
          if (res.code == 200) {
            const newLabel = cloneDeep(res.data);
            newLabel.labelData = JSON.parse(newLabel.labelData);
            labelInfoMap.value[newLabel.code] = newLabel;
            props.map.set("labelInfoMap", labelInfoMap.value);
            isEditSuccess.value = true;
            originEditLabel.value = null;
            ElMessage.success("保存成功");
            onClose();
          }
        },
        (err: any) => {
          console.error(err);
          ElMessage.error("接口异常");
        }
      );
    }
  });
};

// 恢复原来的标签样式
const clearModify = () => {
  if (modify.value) {
    props.map?.removeInteraction(modify.value);
  }
  if (translation.value) {
    props.map?.removeInteraction(translation.value);
  }
  modifyFeature.value = null;
  modify.value = null;
  translation.value = null;
  if (hasEdit.value && !isEditSuccess.value) {
    if (originEditLabel.value) {
      labelInfoMap.value[originEditLabel.value?.code] = originEditLabel.value;
      props.map.set("labelInfoMap", labelInfoMap.value); // 更新标签树
      featureUpdate(originEditLabel.value, props.map);
      originEditLabel.value = null;
    }
  }
};

onBeforeUnmount(() => {
  clearModify();
});

defineExpose({
  onOpen,
  onClose
});

watch(
  form,
  newForm => {
    if (newForm.font) {
      const bold = newForm.font.isBold ? "bold" : "normal";
      newForm.labelData.style.text.font = bold + " " + newForm.font.fontSize + "px " + newForm.font.fontFamily;
    }
    // 修改地图元素样式
    applyModify(newForm);
  },
  {
    deep: true,
    flush: "post"
  }
);
</script>

<style lang="scss" scoped>
.tag-edit-draw {
  position: absolute;
  right: 10px;
  bottom: 50px;
  z-index: 2000;
  width: 360px;
  height: 500px;
  background-color: #ffffff;
}
.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  background-color: #f7f7fa;
}
.title span {
  font-size: 16px;
}
.tag-edit-draw .title {
  padding: 0 20px;
}
.content {
  width: 100%;
  height: calc(100% - 110px);
  padding: 20px 20px 0;
  overflow-y: auto;
  .showEditIcon {
    width: 170px !important;
  }
  .editIcon {
    width: 32px;
    height: 32px;
    margin-left: 5px;
    line-height: 32px;
    color: #ffffff;
    text-align: center;
    cursor: pointer;
    background: var(--el-color-primary);
    border: 1px solid #dddddd;
    border-radius: 50%;
  }
}
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
}
.footer-content {
  display: flex;
  align-items: center;
}
</style>
