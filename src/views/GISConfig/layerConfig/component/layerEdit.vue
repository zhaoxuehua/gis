<template>
  <div>
    <el-dialog
      :title="['创建图层', '编辑图层'][state.dialogType]"
      v-model="state.open"
      width="820px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="图层编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" :disabled="state.dialogType == 1" clearable />
        </el-form-item>
        <el-form-item label="图层名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" clearable />
        </el-form-item>
        <el-form-item label="图层等级" prop="layerLevel">
          <el-input type="number" v-model="form.layerLevel" />
        </el-form-item>
        <el-form-item label="图层显示最低等级" prop="layerMinLevel">
          <el-input type="number" v-model="form.layerMinLevel" />
        </el-form-item>
        <el-form-item label="图层显示最高等级" prop="layerMaxLevel">
          <el-input type="number" v-model="form.layerMaxLevel" />
        </el-form-item>
        <div></div>
        <el-form-item prop="isTagAgg">
          <template #label>
            <span>标签聚合</span>
            <el-tooltip effect="dark" content="目前只针对点类型标签生效" placement="top">
              <Icon src="WarningFilled" :size="16" color="#e6a23c" class="iconItem"></Icon>
            </el-tooltip>
          </template>
          <el-checkbox v-model="form.isTagAgg" />
        </el-form-item>
        <div></div>
        <el-form-item v-if="form.isTagAgg" label="标签聚合距离" prop="tagAggDistance">
          <el-input type="number" v-model="form.tagAggDistance" />
        </el-form-item>
        <el-form-item v-if="form.isTagAgg" label="轨迹聚合距离" prop="trackAggDistance">
          <el-input type="number" v-model="form.trackAggDistance" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="LayerEdit">
import { reactive, ref } from "vue";
import { ElForm, ElMessage } from "element-plus";
import * as Regular from "@/plugins/verification.js";
import { addLayer, editLayer } from "@/api/visconfig.js";

const emit = defineEmits(["successAdd"]);
const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("图层编码只能出现字母,数字,下划线"));
  }
  callback();
};
const layerLevelVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyPositiveInteger.test(value)) {
    return callback(new Error("等级只能为大于0的整数"));
  }
  callback();
};
const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    code: [
      { required: true, message: "图层编码不能为空", trigger: ["blur", "change"] },
      { validator: codeVerification, trigger: ["blur", "change"] },
      { max: 50, message: "图层编码长度不能大于50", trigger: ["blur", "change"] }
    ],
    name: [
      { required: true, message: "图层名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "图层名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    layerLevel: [
      { required: true, message: "图层等级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ],
    layerMinLevel: [
      { required: true, message: "图层显示最低等级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ],
    layerMaxLevel: [
      { required: true, message: "图层显示最高等级不能为空", trigger: ["blur", "change"] },
      { validator: layerLevelVerification, trigger: ["blur", "change"] }
    ]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  code: "",
  name: "",
  layerLevel: null,
  layerMinLevel: null,
  layerMaxLevel: null,
  isTagAgg: false,
  tagAggDistance: null,
  trackAggDistance: null
};

let form = ref<{
  id?: number;
  code: string;
  name: string;
  layerLevel: number | null;
  layerMinLevel: number | null;
  layerMaxLevel: number | null;
  isTagAgg?: boolean | undefined;
  tagAggDistance: number | null;
  trackAggDistance: number | null;
}>(defaultParam);

const openDialog = (row?: { [key: string]: any }) => {
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
      if (state.dialogType == 0) {
        // 添加
        const res: { [key: string]: any } = await addLayer(param);
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
        const res: { [key: string]: any } = await editLayer(param);
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

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.iconItem {
  margin: auto 0;
}
</style>
