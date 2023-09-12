<template>
  <el-dialog
    title="自定义配置"
    v-model="state.open"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
    :destroy-on-close="true"
    class="nav-config"
  >
    <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
      <el-form-item label="树编码" prop="code">
        <el-input placeholder="请输入..." v-model="form.code" clearable />
      </el-form-item>
      <el-form-item label="树名称" prop="name">
        <el-input placeholder="请输入..." v-model="form.name" clearable />
      </el-form-item>
      <el-form-item label="网关" prop="gateway">
        <el-input placeholder="请输入..." v-model="form.gateway" clearable />
      </el-form-item>

      <el-form-item label="请求方法" prop="method">
        <el-select v-model="form.method" placeholder="请选择..." clearable>
          <el-option label="GET" value="GET"></el-option>
          <el-option label="POST" value="POST"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="路径" prop="route">
        <el-input placeholder="请输入..." v-model="form.route" clearable />
      </el-form-item>
      <el-form-item label="启用状态" prop="enable">
        <el-checkbox v-model="form.enable"></el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="LayerEdit">
import { reactive, ref } from "vue";
import { ElForm } from "element-plus";
import * as Regular from "@/plugins/verification.js";

const emit = defineEmits(["successAdd"]);
const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("树编码只能出现字母,数字,下划线"));
  }
  callback();
};

const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    code: [
      { required: true, message: "树编码不能为空", trigger: ["blur", "change"] },
      { validator: codeVerification, trigger: ["blur", "change"] },
      { max: 50, message: "树编码长度不能大于50", trigger: ["blur", "change"] }
    ],
    name: [
      { required: true, message: "树名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "树名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    gateway: [{ required: true, message: "请输入网关", trigger: ["blur", "change"] }],
    method: [{ required: true, message: "请选择请求方法", trigger: ["blur", "change"] }],
    route: [{ required: true, message: "请输入路径", trigger: ["blur", "change"] }],
    enable: [{ required: true, message: "请选择启用状态", trigger: ["blur", "change"] }]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  code: "",
  name: "",
  gateway: "",
  method: "",
  route: "",
  enable: true
};

let form = ref<{
  code: string;
  name: string;
  gateway: string;
  method: string;
  route: string;
  enable: boolean;
}>(defaultParam);

const openDialog = (row: { [key: string]: any }, dialogType: number) => {
  if (dialogType == 1 && row) {
    form.value = JSON.parse(JSON.stringify(row));
  } else {
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
      let param: { [key: string]: any } = { ...form.value };
      emit("successAdd", param);
      state.open = false;
    }
  });
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.nav-config {
  .el-form .el-input,
  .el-form .el-select {
    width: 250px;
  }
  .el-form .el-select {
    :deep(.el-input) {
      width: 250px;
    }
  }
}
</style>
