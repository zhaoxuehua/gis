<template>
  <div class="white-list-box">
    <el-dialog
      :title="['创建白名单', '编辑白名单'][state.dialogType]"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="对象编码" prop="code">
          <el-input placeholder="请输入..." v-model="form.code" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" style="width: 200px" v-model="form.remark" />
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
import {
  ElForm
  // ElMessage
} from "element-plus";
// import * as Regular from "@/plugins/verification.js";
// import { addLayer, editLayer } from "@/api/visconfig.js";

// const emit = defineEmits(["successAdd"]);

const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    code: [{ required: true, message: "对象编码不能为空", trigger: ["blur", "change"] }]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  code: "",
  startTime: "",
  endTime: "",
  remark: ""
};

let form = ref<{
  id?: number;
  code: string;
  startTime: string;
  endTime: string;
  remark: string;
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
      let param: { [key: string]: any } = { ...form.value };
      if (state.dialogType == 0) {
        console.log(param, 1);
      } else if (state.dialogType == 1) {
        // 编辑
        // const res: { [key: string]: any } = await editLayer(param);
        // if (res.code == 200) {
        //   ElMessage.success("编辑成功");
        //   emit("successAdd");
        //   state.open = false;
        // } else {
        //   ElMessage({
        //     type: "error",
        //     message: res.msg
        //   });
        // }
      }
    }
  });
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped></style>
