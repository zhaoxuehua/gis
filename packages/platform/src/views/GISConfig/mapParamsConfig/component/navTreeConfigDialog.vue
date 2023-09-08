<template>
  <div>
    <el-dialog
      title="自定义配置"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="配置编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" :disabled="state.dialogType == 1" clearable />
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
import { ElForm } from "element-plus";
import * as Regular from "@/plugins/verification.js";

const emit = defineEmits(["successAdd"]);
const codeVerification = (rule: any, value: any, callback: Function) => {
  if (!Regular.verifyNumCode.test(value)) {
    return callback(new Error("图层编码只能出现字母,数字,下划线"));
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
    ]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  code: ""
};

let form = ref<{
  code: string;
}>(defaultParam);

const openDialog = (row?: { [key: string]: any }) => {
  if (row) {
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
.iconItem {
  margin: auto 0;
}
</style>
