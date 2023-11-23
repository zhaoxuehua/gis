<!-- 批量处理、全部处理 -->
<template>
  <div>
    <el-dialog
      :title="state.dialogTitle"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      @close="onClose"
      :destroy-on-close="true"
      append-to-body
    >
      <el-form :inline="true" :model="form" label-width="100px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="处理方式" prop="eventHandleType">
          <el-select placeholder="请选择..." v-model="form.eventHandleType" clearable>
            <el-option
              v-for="(item, index) in state.handleTypeOption"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="事件性质" prop="eventNature">
          <el-select placeholder="请选择..." v-model="form.eventNature" clearable>
            <el-option
              v-for="(item, index) in state.natureOption"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input type="textarea" style="width: 410px" v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm" :loading="btnLoading">处理</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { eventProcessBatch, getHandleTypeOption, getNatureOption, handleAll } from "../../../../api/device";

const emits = defineEmits(["successBatch"]);
const state: {
  open: boolean;
  rulesForm: any;
  dialogTitle: string;
  type: any;
  ids: any;
  handleTypeOption: any[];
  natureOption: any[];
  extendInfo: any;
  fromInfo: any;
  toDoListRow: any;
} = reactive({
  open: false,
  // 弹窗表单验证
  rulesForm: {
    eventHandleType: [{ required: true, message: "处理方式不能为空", trigger: ["blur", "change"] }],
    eventNature: [{ required: true, message: "事件性质不能为空", trigger: ["blur", "change"] }],
    description: [
      { required: true, message: "备注不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "备注长度不能大于500", trigger: ["blur", "change"] }
    ]
  },
  dialogTitle: "批量处理",
  type: null,
  ids: null,
  handleTypeOption: [],
  natureOption: [],
  extendInfo: null,
  fromInfo: null,
  toDoListRow: null
});
const refForm = ref();
let form: any = ref({});
const btnLoading = ref(false);

const openDialog = (type: any, ids: any, extendInfo: any, fromInfo: any, toDoListRow: any) => {
  state.extendInfo = extendInfo;
  state.fromInfo = fromInfo;
  state.toDoListRow = toDoListRow;
  state.ids = ids;
  initOption();
  form.value.eventHandleType = "";
  form.value.eventNature = "";
  form.value.description = "";
  state.type = type;
  if (type == "all") {
    state.dialogTitle = "全部处理";
  } else if (type == "part") {
    state.dialogTitle = "批量处理";
  }
  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onConfirm = () => {
  refForm.value.validate(async (valid: any) => {
    if (valid) {
      let param = { ...form.value };
      btnLoading.value = true;
      try {
        if (state.type == "part") {
          // 批量处理
          param.eventMids = state.ids;
          if (state.fromInfo == "table") {
            // 来自table的全部处理
            param.unfoldProcess = true;
          }
          const res: any = await eventProcessBatch(param);
          if (res.code == 200) {
            ElMessage.success("处理成功");
            emits("successBatch");
            state.open = false;
          }
        } else if (state.type == "all") {
          if (state.fromInfo == "table") {
            // 来自table的全部处理
            param.equipTypeCodes = state.extendInfo;
          } else if (state.fromInfo == "dialog") {
            // 来自dialog的全部处理
            param.collectKey = state.toDoListRow.collectKey;
            param.eventCode = state.toDoListRow.event;
          }
          const res: any = await handleAll(param);
          if (res.code == 200) {
            ElMessage.success("处理成功");
            emits("successBatch");
            state.open = false;
          }
        }
      } finally {
        btnLoading.value = false;
      }
    }
  });
};

const initOption = async () => {
  const res1: any = await getHandleTypeOption();
  if (res1.code == 200) {
    state.handleTypeOption = res1.data;
  }

  const res2: any = await getNatureOption();
  if (res2.code == 200) {
    state.natureOption = res2.data;
  }
};

defineExpose({
  openDialog
});
</script>

<style lang="scss"></style>
