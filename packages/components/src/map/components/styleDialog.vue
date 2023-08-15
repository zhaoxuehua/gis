<template>
  <div class="style-box">
    <el-dialog
      title="编辑样式"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="线宽" prop="lineWidth">
          <el-input type="number" v-model="form.lineWidth" />
        </el-form-item>
        <el-form-item label="线色" prop="lineColor" style="width: 350px">
          <el-color-picker v-model="form.lineColor" show-alpha />
        </el-form-item>
        <el-form-item label="线型" prop="lineType">
          <el-select v-model="form.lineType" placeholder="请选择..." clearable>
            <el-option label="实线" value="solid"></el-option>
            <el-option label="虚线" value="dash"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="面填充色" prop="polygonColor" v-if="state.drawType == 'drawPolygon'">
          <el-color-picker v-model="form.polygonColor" show-alpha />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <!-- <el-button @click="onClose">取消</el-button> -->
          <el-button type="primary" @click="onConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";

const emits = defineEmits(["successAdd"]);

const displayScaleVerification = (rule: any, value: any, callback: Function) => {
  if (!/(^[0-9]*$)|(^[0-9]*\.[0-9]{1,6}$)/.test(value)) {
    return callback(new Error("只能为大于0的数字"));
  }
  callback();
};
const state = reactive({
  open: false,
  drawType: "",
  // 弹窗表单验证
  rulesForm: {
    lineWidth: [
      { required: true, message: "线宽不能为空", trigger: ["blur", "change"] },
      { validator: displayScaleVerification, trigger: ["blur", "change"] }
    ],
    lineType: [{ required: true, message: "请选择线型", trigger: ["blur", "change"] }],
    lineColor: [{ required: true, message: "请选择线色", trigger: ["blur", "change"] }],
    polygonColor: [{ required: true, message: "请选择面填充色", trigger: ["blur", "change"] }]
  }
});
const refForm: any = ref();

const defaultParam = {
  polygonColor: "rgba(255, 255, 255, 0.5)",
  lineWidth: "1",
  lineColor: "rgba(0, 153, 255, 1)",
  lineType: "solid"
};

let form = ref<{
  polygonColor?: string;
  lineWidth?: string | number;
  lineColor?: string;
  lineType?: string;
}>(defaultParam);

const openDialog = (row?: { [key: string]: any }, drawType?: string) => {
  if (drawType) {
    state.drawType = drawType;
  }
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
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      emits("successAdd", { ...form.value });
      onClose();
    }
  });
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped></style>
