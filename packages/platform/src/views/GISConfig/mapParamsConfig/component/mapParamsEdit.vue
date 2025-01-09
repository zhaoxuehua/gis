<template>
  <div>
    <el-dialog
      :title="['创建应用场景', '编辑应用场景'][state.dialogType]"
      v-model="state.open"
      width="1020px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
      class="map-params-edit"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="场景编码" prop="appCode">
          <el-input placeholder="请输入..." v-model="form.appCode" clearable />
        </el-form-item>
        <el-form-item label="场景名称" prop="appName">
          <el-input placeholder="请输入..." v-model="form.appName" clearable />
        </el-form-item>
        <el-form-item label="地图加载方式" prop="mapLoadMode" style="width: 450px">
          <el-radio-group v-model="form.mapLoadMode">
            <el-radio label="online" size="large">在线地图</el-radio>
            <el-radio label="outline" size="large">离线地图</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 离线底图模块 -->
        <el-form-item label="离线电子地图" prop="normalUrl" v-if="form.mapLoadMode == 'outline'">
          <el-input placeholder="请输入..." v-model="form.normalUrl" clearable style="width: 240px" />
          <el-upload
            :before-upload="file => beforeUpload(file, 'normalUrl')"
            :http-request="() => uploadMapImage('normalUrl')"
            :show-file-list="false"
          >
            <el-button type="primary">上传</el-button>
          </el-upload>
          <el-tooltip effect="dark" content="若地图过大，建议直接拷贝至服务器对应目录下" placement="top">
            <Icon src="WarningFilled" :size="20" color="#e6a23c"></Icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="离线卫星地图" prop="sateUrl" v-if="form.mapLoadMode == 'outline'">
          <el-input placeholder="请输入..." v-model="form.sateUrl" clearable style="width: 240px" />
          <el-upload
            :before-upload="file => beforeUpload(file, 'sateUrl')"
            :http-request="() => uploadMapImage('sateUrl')"
            :show-file-list="false"
          >
            <el-button type="primary">上传</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="离线路网叠加层" prop="overlayUrl" v-if="form.mapLoadMode == 'outline'">
          <el-input placeholder="请输入..." v-model="form.overlayUrl" clearable style="width: 240px" />
          <el-upload
            :before-upload="file => beforeUpload(file, 'overlayUrl')"
            :http-request="() => uploadMapImage('overlayUrl')"
            :show-file-list="false"
          >
            <el-button type="primary">上传</el-button>
          </el-upload>
        </el-form-item>

        <!-- 在线底图模块 -->
        <!-- https://gac-geo.googlecnapps.cn/maps/vt?lyrs=m&x={x}&y={y}&z={z} -->
        <el-form-item label="在线电子地图" prop="normalUrl" v-if="form.mapLoadMode == 'online'">
          <el-input placeholder="请输入..." v-model="form.normalUrl" clearable />
        </el-form-item>
        <!-- https://gac-geo.googlecnapps.cn/maps/vt?lyrs=s,m&gl=CN&x={x}&y={y}&z={z} -->
        <el-form-item label="在线卫星地图" prop="sateUrl" v-if="form.mapLoadMode == 'online'">
          <el-input placeholder="请输入..." v-model="form.sateUrl" clearable />
        </el-form-item>

        <el-form-item label="默认显示模式" prop="displayMode" style="width: 450px">
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
          <el-select
            filterable
            v-model="form.displayLabelInfoIds"
            multiple
            collapse-tags
            clearable
            placeholder="请选择..."
            @change="displayLabelTypeChange"
          >
            <div class="select_up">
              <el-button link type="primary" @click="attributeAllSelect('displayLabelType')"> 全选</el-button>
              <el-button link type="primary" @click="attributeDelete('displayLabelType')"> 清空</el-button>
              <el-button link type="primary" @click="attributeSelectReverse('displayLabelType')"> 反选</el-button>
            </div>
            <div>
              <el-option v-for="(item, index) in labelTypeList.data" :key="index" :label="item.name" :value="item.id"></el-option>
            </div>
          </el-select>
        </el-form-item>
        <el-form-item label="搜索标签类型" prop="displaySearchIds">
          <el-select v-model="form.displaySearchIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <div class="select_up">
              <el-button link type="primary" @click="attributeAllSelect('searchLabelType')"> 全选</el-button>
              <el-button link type="primary" @click="attributeDelete('searchLabelType')"> 清空</el-button>
              <el-button link type="primary" @click="attributeSelectReverse('searchLabelType')"> 反选</el-button>
            </div>
            <div>
              <el-option v-for="(item, index) in searchTypeList" :key="index" :label="item.name" :value="item.id"></el-option>
            </div>
          </el-select>
        </el-form-item>
        <el-form-item label="显示图层" prop="displayLayerIds">
          <el-select v-model="form.displayLayerIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <div class="select_up">
              <el-button link type="primary" @click="attributeAllSelect('displayLayer')"> 全选</el-button>
              <el-button link type="primary" @click="attributeDelete('displayLayer')"> 清空</el-button>
              <el-button link type="primary" @click="attributeSelectReverse('displayLayer')"> 反选</el-button>
            </div>
            <div>
              <el-option v-for="(item, index) in layerList.data" :key="index" :label="item.name" :value="item.id"></el-option>
            </div>
          </el-select>
        </el-form-item>
        <el-form-item label="显示控件" prop="displayControlIds">
          <el-select filterable v-model="form.displayControlIds" multiple collapse-tags clearable placeholder="请选择...">
            <div class="select_up">
              <el-button link type="primary" @click="attributeAllSelect('displayControl')"> 全选</el-button>
              <el-button link type="primary" @click="attributeDelete('displayControl')"> 清空</el-button>
              <el-button link type="primary" @click="attributeSelectReverse('displayControl')"> 反选</el-button>
            </div>
            <div>
              <el-option v-for="(item, index) in controlList.data" :key="index" :label="item.name" :value="item.code"></el-option>
            </div>
          </el-select>
        </el-form-item>
        <el-form-item label="显示图例" prop="displayLegendIds">
          <el-select v-model="form.displayLegendIds" multiple collapse-tags clearable placeholder="请选择..." filterable>
            <div class="select_up">
              <el-button link type="primary" @click="attributeAllSelect('displayLegend')"> 全选</el-button>
              <el-button link type="primary" @click="attributeDelete('displayLegend')"> 清空</el-button>
              <el-button link type="primary" @click="attributeSelectReverse('displayLegend')"> 反选</el-button>
            </div>
            <div>
              <el-option
                v-for="(item, index) in legendIdsList.data"
                :key="index"
                :label="item.legendName"
                :value="item.id"
              ></el-option>
            </div>
          </el-select>
        </el-form-item>
        <el-form-item label="距离单位" prop="scaleLineUnit">
          <el-select v-model="form.scaleLineUnit" clearable placeholder="请选择..." filterable>
            <el-option v-for="item in scaleLineUnitList.data" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="左键弹窗位置" prop="leftClickDialogPosition">
          <el-select v-model="form.leftClickDialogPosition" clearable placeholder="请选择..." filterable>
            <el-option
              v-for="(item, index) in leftClickDialogPositionList.data"
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
            <el-option v-for="item in customTreeCodeList.data" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词显示配置" prop="keywordConfig" style="width: 450px">
          <el-button class="reference-button" circle @click="keywordConfigClick">
            <Icon src="EditPen"></Icon>
          </el-button>
        </el-form-item>
        <el-form-item label="面选中方式" prop="polygonSelectMode">
          <el-select v-model="form.polygonSelectMode" placeholder="请选择..." filterable>
            <el-option
              v-for="item in polygonSelectModeOption.data"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否可编辑" prop="isEdit" style="width: 450px">
          <el-checkbox v-model="form.isEdit"></el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-dropdown v-if="progressList?.length" style="margin: 0 10px">
            <el-button> 查看进度 </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(item, index) in progressList"
                  :key="index"
                  @click.stop="checkProgress(item.fileUploadType)"
                >
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" @click="onConfirm" :loading="btnLoading">确认</el-button>
        </span>
      </template>
    </el-dialog>
    <KeywordConfigDialog ref="keywordConfigRef" @success-add="saveKeywordConfig"></KeywordConfigDialog>
    <NavTreeConfigDialog ref="navTreeConfigRef" @success-add="saveNavTreeConfig"></NavTreeConfigDialog>
    <ProgressDialog ref="progressDialogRef" :data="uploadMap" @update-progress-status="updateProgressStatus"></ProgressDialog>
  </div>
</template>

<script lang="ts" setup name="MapParamsEdit">
import { reactive, onMounted, ref, unref, computed, nextTick } from "vue";
import { ElForm, ElMessage, ElMessageBox } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { handleParam } from "@/utils/common.js";
import { calculateChunkSize, splitFile, getFileUniqueHash, progressStatus, progressLabel } from "@/utils/fileChunk";
import {
  addMapParams,
  editMapParams,
  getLayerList,
  getLabelTypeList,
  getLegendConfigList,
  getLegendListByLabelType,
  getFileMaxChunks,
  uploadCheckChunkFile,
  uploadChunkFile,
  getChunkFileUrl
} from "@/api/visconfig.js";
import { customTreeList } from "@/api/device.js";
import { GIS_CONTROLS } from "@/constant/gisConstant";
import KeywordConfigDialog from "./keywordConfigDialog.vue";
import NavTreeConfigDialog from "./navTreeConfigDialog.vue";
import ProgressDialog from "./progressDialog.vue";

interface MapParamsForm {
  id?: number;
  appCode: string;
  appName: string;
  mapLoadMode: string;
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
  isEdit: boolean;
  leftClickDialogPosition: string;
  polygonSelectMode: string;
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
    mapLoadMode: [{ required: true, message: "请选择地图加载方式", trigger: ["blur", "change"] }],
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
    leftClickDialogPosition: [{ required: true, message: "请选择左键弹窗位置", trigger: ["blur", "change"] }],
    polygonSelectMode: [{ required: true, message: "请选择面选中方式", trigger: ["blur", "change"] }],
    customTreeType: [{ required: true, message: "请选择导航树", trigger: ["blur", "change"] }],
    customTreeCode: [{ required: true, message: "请选择设备树", trigger: ["blur", "change"] }],
    normalUrl: [{ max: 500, message: "离线电子地图长度不能大于500", trigger: ["blur", "change"] }],
    sateUrl: [{ max: 500, message: "离线卫星地图长度不能大于500", trigger: ["blur", "change"] }],
    overlayUrl: [{ max: 500, message: "离线路网叠加层长度不能大于500", trigger: ["blur", "change"] }]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();
const keywordConfigRef = ref<InstanceType<typeof KeywordConfigDialog>>();
const navTreeConfigRef = ref<InstanceType<typeof NavTreeConfigDialog>>();
const progressDialogRef = ref<InstanceType<typeof ProgressDialog>>();
const btnLoading = ref(false);

const defaultParam = {
  appName: "",
  appCode: "",
  mapLoadMode: "outline",
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
  isEdit: false, // 是否可编辑
  leftClickDialogPosition: "current", // 左键弹窗位置 当前
  polygonSelectMode: "polygon"
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
    // 面选中方式（没有值默认面选中为了兼容之前的数据）
    form.value.polygonSelectMode = row?.polygonSelectMode || "polygon";
  } else {
    state.dialogType = 0;
    form.value = { ...defaultParam };
  }
  state.open = true;
};

type FileUploadType = "normalUrl" | "sateUrl" | "overlayUrl";
const minChunkSize = 50 * 1024 * 1024; // 50MB
const maxChunks = ref<number>(30);
const uploadMap: any = reactive({
  normalUrl: {},
  sateUrl: {},
  overlayUrl: {}
});
const resetUploadParams = (type: FileUploadType) => {
  uploadMap[type] = {};
};

const beforeUpload = async (file: any, type: FileUploadType) => {
  let arr = file?.name?.split(".");
  if (!["zip", "tar", "7z"]?.includes(arr[arr?.length - 1])) {
    ElMessage.warning("导入文件必须是【.zip、.tar、.7z】格式!");
    return false;
  }
  if (file?.size / 1024 / 1024 / 1024 > 10) {
    ElMessage.warning("文件大小不能超过【10GB】!");
    return false;
  }
  resetUploadParams(type);
  const uploadTypeObj = uploadMap[type];
  uploadTypeObj.currentProgressStatus = progressStatus.ready;
  uploadTypeObj.fileUploadType = type;
  progressDialogRef.value?.openDialog(type);
  uploadTypeObj.chunksSize = calculateChunkSize(file?.size, maxChunks.value, minChunkSize); // 计算分片大小
  let hashHex: string = "";
  try {
    hashHex = (await getFileUniqueHash(file)) as string;
  } catch (error) {
    console.error("计算哈希值时发生错误:", error);
    return false;
  }
  uploadTypeObj.allChunksFile = splitFile(file, uploadTypeObj.chunksSize); // 文件分片后的[]
  uploadTypeObj.fileHash = hashHex;
  uploadTypeObj.currentProgressStatus = progressStatus.uploading;
  try {
    const res: any = await uploadCheckChunkFile(hashHex, uploadTypeObj.allChunksFile?.length);
    if (res.code === 200) {
      uploadTypeObj.unUploadFileIdx = res?.data || [];
      uploadTypeObj.completedUploadCount = uploadTypeObj.allChunksFile?.length - uploadTypeObj.unUploadFileIdx?.length;
      return true;
    }
  } catch (error) {
    uploadTypeObj.currentProgressStatus = progressStatus.uploadFail;
    return false;
  }
};

const uploadMapImage = async (type: FileUploadType) => {
  const uploadTypeObj = uploadMap[type];
  if (uploadTypeObj.unUploadFileIdx?.length) {
    const requests = uploadTypeObj.allChunksFile?.map((file: any, index: number) => {
      if (uploadTypeObj.unUploadFileIdx?.includes(index)) {
        let formData = new FormData();
        formData.append("file", file);
        const uploadHeaders = {
          headers: {
            chunkNum: index,
            size: uploadTypeObj.chunksSize,
            chunks: uploadTypeObj.allChunksFile?.length,
            fileHash: uploadTypeObj.fileHash
          },
          timeout: 0
        };
        return uploadChunkFile(formData, uploadHeaders).then(() => {
          uploadTypeObj.completedUploadCount++; // 每个请求完成时，增加已完成请求数
        });
      }
    });
    Promise.all(requests)
      .then(() => {
        queryChunkFileUrl(uploadTypeObj.fileHash, type);
      })
      .catch(error => {
        uploadTypeObj.currentProgressStatus = progressStatus.uploadFail;
        console.error("有一个请求失败：", error);
      });
  } else {
    queryChunkFileUrl(uploadTypeObj.fileHash, type);
  }
};

// 获取上传成功后url
const queryChunkFileUrl = async (fileHash: string, type: FileUploadType) => {
  const uploadTypeObj = uploadMap[type];
  uploadTypeObj.currentProgressStatus = progressStatus.uploadSuccess;
  try {
    await getChunkFileUrl(fileHash).then((res: any) => {
      if (res?.code == 200) {
        uploadTypeObj.fileUploadType && (form.value[uploadTypeObj.fileUploadType as FileUploadType] = res?.data?.url || "");
        uploadTypeObj.currentProgressStatus = res?.data?.status || "";
        uploadTypeObj.isNeedRefresh = true;
      }
    });
  } catch {
    uploadTypeObj.currentProgressStatus = progressStatus.decompressionFail;
  }
};

const updateProgressStatus = (type: FileUploadType, ProgressStatus: string) => {
  uploadMap[type].currentProgressStatus = ProgressStatus;
  nextTick(() => {
    // 为了处理首次自动关闭弹框
    if (ProgressStatus !== "解压中") {
      uploadMap[type].isNeedRefresh = false;
    }
  });
};

const progressList = computed(() => {
  return (Object.entries(uploadMap) as any[])
    .filter(([, obj]) => obj?.fileUploadType)
    .map(([key, obj]) => ({
      ...obj,
      label: progressLabel[key as FileUploadType]
    }));
});

// 上传进度查看
const checkProgress = (type: FileUploadType) => {
  progressDialogRef.value?.openDialog(type);
};

const onClose = () => {
  (["normalUrl", "sateUrl", "overlayUrl"] as FileUploadType[])?.forEach((type: FileUploadType) => resetUploadParams(type));
  state.open = false;
};

const confirmFun = async () => {
  let param = unref(form);
  // 校验自定义树时是否配置自定义内容
  if (param.customTreeType == "ExternalCustomTree") {
    delete param.customTreeCode;
    if (!param?.externalCustomTree || !param?.externalCustomTree?.code) {
      ElMessage.warning("请设置自定义树配置");
      return;
    }
  } else {
    delete param.externalCustomTree;
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

  btnLoading.value = true;
  try {
    if (state.dialogType == 0) {
      // 添加
      const res: { [key: string]: any } = await addMapParams(param);
      if (res.code == 200) {
        ElMessage.success("创建成功");
        emit("successAdd");
        onClose();
      }
    } else if (state.dialogType == 1) {
      // 编辑
      const res: { [key: string]: any } = await editMapParams(param);
      if (res.code == 200) {
        ElMessage.success("编辑成功");
        emit("successAdd");
        onClose();
      }
    }
  } finally {
    btnLoading.value = false;
  }
};
const onConfirm = () => {
  refForm.value?.validate((valid: any) => {
    if (valid) {
      // 检查是否有文件尚未上传成功(准备中 上传中)
      const hasUnsuccessfulUpload = Object.values(uploadMap)?.some((upload: any) => {
        return upload?.fileUploadType && ["准备中", "上传中"].includes(upload?.currentProgressStatus);
      });
      if (hasUnsuccessfulUpload) {
        ElMessageBox.confirm("有文件正在上传中，确定执行该操作？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }).then(() => {
          confirmFun();
        });
      } else {
        confirmFun();
      }
    }
  });
};

// 显示标签类型change及显示标签类型的全选、反选、清空调用
const displayLabelTypeChange = () => {
  // 清除当前搜索类型选中项在列表中不存在的值
  let currentAllData: any[] = (searchTypeList.value as any[])?.map((item: any) => item?.id);
  form.value.displaySearchIds =
    (form.value.displaySearchIds as any[]).filter((item: any) => currentAllData?.includes(item)) || [];
  // 根据标签类型id查图例列表
  legendListByLabelType.value?.fetchData();
};

// 全选
const attributeAllSelect = (type: string) => {
  if (type == "displayLabelType") {
    form.value.displayLabelInfoIds = labelTypeList.value.data?.map((item: any) => item?.id);
    displayLabelTypeChange();
  } else if (type == "searchLabelType") {
    form.value.displaySearchIds = (searchTypeList.value || [])?.map((item: any) => item?.id);
  } else if (type == "displayLayer") {
    form.value.displayLayerIds = layerList.value.data?.map((item: any) => item?.id);
  } else if (type == "displayControl") {
    form.value.displayControlIds = controlList.value.data?.map((item: any) => item?.code);
  } else if (type == "displayLegend") {
    form.value.displayLegendIds = legendIdsList.value.data?.map((item: any) => item?.id);
  }
};

// 清空
const attributeDelete = (type: string) => {
  if (type == "displayLabelType") {
    form.value.displayLabelInfoIds = [];
    displayLabelTypeChange();
  } else if (type == "searchLabelType") {
    form.value.displaySearchIds = [];
  } else if (type == "displayLayer") {
    form.value.displayLayerIds = [];
  } else if (type == "displayControl") {
    form.value.displayControlIds = [];
  } else if (type == "displayLegend") {
    form.value.displayLegendIds = [];
  }
};

// 反选
const attributeSelectReverse = (type: string) => {
  if (type == "displayLabelType") {
    form.value.displayLabelInfoIds = (labelTypeList.value.data || [])
      .filter((item: any) => !(form.value.displayLabelInfoIds as any[])?.includes(item?.id))
      .map((filteredItem: any) => filteredItem?.id);
    displayLabelTypeChange();
  } else if (type == "searchLabelType") {
    form.value.displaySearchIds = (searchTypeList.value || [])
      .filter((item: any) => !(form.value.displaySearchIds as any[])?.includes(item?.id))
      .map((filteredItem: any) => filteredItem?.id);
  } else if (type == "displayLayer") {
    form.value.displayLayerIds = (layerList.value.data || [])
      .filter((item: any) => !(form.value.displayLayerIds as any[])?.includes(item?.id))
      .map((filteredItem: any) => filteredItem?.id);
  } else if (type == "displayControl") {
    form.value.displayControlIds = (controlList.value.data || [])
      .filter((item: any) => !(form.value.displayControlIds as any[])?.includes(item?.code))
      .map((filteredItem: any) => filteredItem?.code);
  } else if (type == "displayLegend") {
    form.value.displayLegendIds = (legendIdsList.value.data || [])
      .filter((item: any) => !(form.value.displayLegendIds as any[])?.includes(item?.id))
      .map((filteredItem: any) => filteredItem?.id);
  }
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

// 左键弹窗位置配置列表
const leftClickDialogPositionList = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "current",
      name: "当前位置"
    },
    {
      code: "right-bottom",
      name: "右下角"
    }
  ]
});

// 面选中当时Option
const polygonSelectModeOption = ref<{
  data: Array<{
    code: string;
    name: string;
  }>;
}>({
  data: [
    {
      code: "polygon",
      name: "面"
    },
    {
      code: "edge",
      name: "边"
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

// 搜索类型列表
const searchTypeList = computed(() => {
  return labelTypeList.value.data?.filter(item => {
    if (Array.isArray(form.value.displayLabelInfoIds)) {
      return form.value.displayLabelInfoIds?.includes(item.id);
    }
  });
});

// 根据标签类型获取已配置图例列表
const legendListByLabelType = ref<{
  data: Array<{
    id: number | string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    if (form.value?.displayLabelInfoIds && form.value.displayLabelInfoIds?.length) {
      const res: { [key: string]: any } = await getLegendListByLabelType(form.value.displayLabelInfoIds);
      if (res?.code == 200) {
        // 将此列表存在的值默认在图例配置中选中(去重)
        res?.data?.forEach((item: any) => {
          if (!(form.value.displayLegendIds as any[])?.includes(item.id)) {
            (form.value.displayLegendIds as any[])?.push(item.id);
          }
        });
      }
    }
  }
});

// 获取总包数限制
const maxChunksFetchData = async () => {
  const res: { [key: string]: any } = await getFileMaxChunks();
  if (res?.code == 200) {
    maxChunks.value = res?.data;
  }
};

// 关键词显示配置
const keywordConfigClick = () => {
  keywordConfigRef.value?.openDialog(form.value.keywordConfig);
};

// 存储键值对
const saveKeywordConfig = (keywordConfig: { [key: string]: any }) => {
  form.value.keywordConfig = keywordConfig;
};

// 自定义导航树配置弹框
const customTreeConfigClick = () => {
  navTreeConfigRef.value?.openDialog(form.value.externalCustomTree, state.dialogType);
};

// 自定义导航树配置内容存储
const saveNavTreeConfig = (navTreeConfig: { [key: string]: any }) => {
  form.value.externalCustomTree = navTreeConfig;
};

onMounted(() => {
  labelTypeList.value.fetchData();
  layerList.value.fetchData();
  legendIdsList.value.fetchData();
  customTreeCodeList.value.fetchData();
  maxChunksFetchData();
});

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.map-params-edit {
  .reference-button {
    margin-left: 5px;
    i {
      margin-right: 0;
    }
  }
  .el-form .el-input,
  .el-form .el-select {
    width: 300px;
  }
  .el-form .el-select {
    :deep(.el-input) {
      width: 300px;
    }
  }
}
.select_up {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
