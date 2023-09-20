<template>
  <div>
    <el-dialog
      title="知晓标记"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      @close="onClose"
      :destroy-on-close="true"
      append-to-body
    >
      <el-form
        :inline="true"
        :model="form"
        label-width="100px"
        :rules="state.rulesForm"
        ref="refForm"
        v-if="state?.row?.awarenessState == 0"
      >
        <el-form-item label="有效时长" prop="validTimeLength">
          <el-input v-model="form.validTimeLength" placeholder="请输入..." clearable />
        </el-form-item>
        <el-form-item label="时间单位" prop="timeUnit">
          <el-select v-model="form.timeUnit" placeholder="请选择..." clearable>
            <el-option label="分钟" value="minute"></el-option>
            <el-option label="小时" value="hour"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" style="width: 410px" v-model="form.remark" />
        </el-form-item>
      </el-form>

      <el-descriptions :column="1" border v-if="state?.row?.awarenessState == 1">
        <!-- 如果是按钮,多一个权限字符串 -->
        <el-descriptions-item label="有效时间至">
          {{ state?.detailRow?.invalidTimeStr }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ state?.detailRow?.remark }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onCancel" v-if="state?.row?.awarenessState == 1">取消标记</el-button>
          <el-button type="primary" @click="onConfirm" v-if="state?.row?.awarenessState == 0">标记 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { eventAwareness, eventAwarenessDetail } from "../../../../api/device";

const emits = defineEmits(["successOpt"]);
const state: { open: boolean; rulesForm: any; row: any; detailRow: any } = reactive({
  open: false,
  // 弹窗表单验证
  rulesForm: {
    timeUnit: [{ required: true, message: "时间单位不能为空", trigger: ["blur", "change"] }],
    validTimeLength: [{ required: true, message: "有效时长不能为空", trigger: ["blur", "change"] }],
    remark: [{ max: 500, message: "备注长度不能大于500", trigger: ["blur", "change"] }]
  },
  row: null,
  detailRow: null
});
const refForm = ref();

let form: any = ref({});

const openDialog = async (row: any) => {
  if (row) {
    state.row = row;
    if (state.row.awarenessState == 1) {
      // 已知晓状态
      const res: any = await eventAwarenessDetail([state.row.event, state.row.equip].join("/"));
      if (res.code == 200) {
        state.detailRow = res.data;
      }
    } else if (state.row.awarenessState == 0) {
      // 未知晓状态
      form.value.timeUnit = "";
      form.value.validTimeLength = "";
      form.value.remark = "";
    }
  }
  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onCancel = async () => {
  let param: any = {};
  // 取消知晓标记
  param.equipCode = state.row.equip;
  param.eventCode = state.row.event;
  param.state = 0;
  param.validTimeLength = 0;
  const res: any = await eventAwareness(param);
  if (res.code == 200) {
    ElMessage.success("取消标记成功");
    emits("successOpt");
    state.open = false;
  } else {
    ElMessage.error(res.msg);
  }
};

const onConfirm = () => {
  refForm.value.validate(async (valid: any) => {
    if (valid) {
      let param = { ...form.value };
      // 知晓标记
      param.equipCode = state.row.equip;
      param.eventCode = state.row.event;
      param.state = 1;

      const res: any = await eventAwareness(param);

      if (res.code == 200) {
        ElMessage.success("标记成功");
        emits("successOpt");
        state.open = false;
      } else {
        ElMessage.error(res.msg);
      }
    }
  });
};
defineExpose({
  openDialog
});
</script>

<style lang="scss"></style>
