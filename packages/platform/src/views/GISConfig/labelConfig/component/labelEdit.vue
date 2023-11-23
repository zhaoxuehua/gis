<template>
  <div>
    <el-dialog
      :title="['创建标签', '编辑标签'][state.dialogType]"
      v-model="state.open"
      width="760px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="标签编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" :disabled="state.dialogType == 1" clearable />
        </el-form-item>
        <el-form-item label="标签名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" clearable />
        </el-form-item>
        <el-form-item label="标签类型" prop="labelTypeId">
          <el-select v-model="form.labelTypeId" clearable placeholder="请选择..." :disabled="state.dialogType == 2">
            <el-option v-for="(item, index) in labelTypeList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属图层" prop="refLayerId">
          <el-select v-model="form.refLayerId" clearable placeholder="请选择..." :disabled="state.dialogType == 2">
            <el-option v-for="(item, index) in layerList.data" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签数据" prop="labelData">
          <el-input type="textarea" style="width: 510px" v-model="form.labelData" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm" :loading="btnLoading">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="LabelEdit">
import { reactive, onMounted, ref } from "vue";
import { ElForm, ElMessage } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { handleParam } from "@/utils/common.js";
import { addLabel, editLabel, getLayerList, getLabelTypeList } from "@/api/visconfig.js";
import { LabelInfoData } from "../../type";

interface LabelInfo {
  id?: number;
  code: string;
  name: string;
  labelData: string;
  labelType: { [key: string]: any } | null;
  labelTypeId?: number;
  refLayer: { [key: string]: any } | null;
  refLayerId?: number;
}

const emit = defineEmits(["successAdd"]);

const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("标签编码只能出现字母,数字,下划线"));
  }
  callback();
};
const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    code: [
      { required: true, message: "标签编码不能为空", trigger: ["blur", "change"] },
      { validator: codeVerification, trigger: ["blur", "change"] },
      { max: 50, message: "标签编码长度不能大于50", trigger: ["blur", "change"] }
    ],
    name: [
      { required: true, message: "标签名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "标签名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    labelTypeId: [{ required: true, message: "请选择标签类型", trigger: ["blur", "change"] }],
    refLayerId: [{ required: true, message: "请选择所属图层", trigger: ["blur", "change"] }],
    labelData: [
      { required: true, message: "标签数据不能为空", trigger: ["blur", "change"] },
      { max: 2000, message: "标签数据长度不能大于2000", trigger: ["blur", "change"] }
    ]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  code: "",
  name: "",
  labelTypeId: 0,
  labelType: null,
  refLayerId: 0,
  refLayer: null,
  labelData: ""
};
let form = ref<LabelInfo>(defaultParam);
const btnLoading = ref(false);

const openDialog = (row?: LabelInfoData) => {
  if (row) {
    state.dialogType = 1;
    form.value = JSON.parse(JSON.stringify(row));
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
  refForm.value?.validate(async valid => {
    if (valid) {
      let param = { ...form.value };
      btnLoading.value = true;
      try {
        if (state.dialogType == 0) {
          // 添加
          const res: { [key: string]: any } = await addLabel(param);
          if (res.code == 200) {
            ElMessage.success("创建成功");
            emit("successAdd");
            state.open = false;
          }
        } else if (state.dialogType == 1) {
          // 编辑
          const res: { [key: string]: any } = await editLabel(param);
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

onMounted(() => {
  labelTypeList.value.fetchData();
  layerList.value.fetchData();
});
defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped></style>
