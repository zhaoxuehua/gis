<template>
  <el-dialog
    :title="['创建白名单', '编辑白名单'][state.dialogType]"
    v-model="state.open"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
    :destroy-on-close="true"
    class="white-list-box"
  >
    <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
      <el-form-item label="查询对象" prop="objectTypeCode">
        <el-select v-model="form.objectTypeCode" placeholder="请选择..." :disabled="state.dialogType == 1">
          <el-option v-for="(item, idx) in realtimeDataList" :key="idx" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item :label="keywordConfig?.code || '对象编码'" prop="objectCode">
        <el-input placeholder="请输入..." v-model="form.objectCode" clearable :disabled="state.dialogType == 1" />
      </el-form-item>
      <el-form-item label="开始时间" prop="beginTime">
        <el-date-picker v-model="form.beginTime" type="datetime" placeholder="选择开始时间"> </el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间"> </el-date-picker>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="form.remark" style="width: 230px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { whiteListEdit, whiteListAdd } from "../../api/device";
import { useGisStore } from "../../stores/modules/gis";

const emit = defineEmits(["successAdd"]);
const gisStore = useGisStore();

// 实时查询对象类型列表
const realtimeDataList = computed(() => {
  return gisStore?.realtimeDataList || [];
});

// 关键词配置
const keywordConfig = computed(() => {
  return gisStore?.keywordConfig;
});

const state = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    objectTypeCode: [{ required: true, message: "查询对象不能为空", trigger: ["blur", "change"] }],
    objectCode: [{ required: true, message: `${keywordConfig.value?.code || "对象编码"}不能为空`, trigger: ["blur", "change"] }],
    beginTime: [{ required: true, message: "开始时间不能为空", trigger: ["blur", "change"] }],
    endTime: [{ required: true, message: "结束时间不能为空", trigger: ["blur", "change"] }]
  }
});
const refForm: any = ref();

const defaultParam = {
  objectTypeCode: realtimeDataList.value?.length ? realtimeDataList.value[0]?.code : "", // 查询对象（实时数据list）
  objectCode: "",
  beginTime: moment().format("YYYY-MM-DD HH:mm:ss"),
  endTime: moment().endOf("day").format("YYYY-MM-DD HH:mm:ss"),
  remark: ""
};

let form = ref<{
  id?: number;
  objectTypeCode: string;
  objectCode: string;
  beginTime: string;
  endTime: string;
  remark: string;
}>(defaultParam);

const openDialog = (row?: { [key: string]: any }) => {
  if (row) {
    state.dialogType = 1;
    form.value = JSON.parse(JSON.stringify(row));
    // 返回毫秒时间戳的处理
    form.value.beginTime = form.value.beginTime
      ? moment(form.value.beginTime).format("YYYY-MM-DD HH:mm:ss")
      : moment().format("YYYY-MM-DD HH:mm:ss");
    form.value.endTime = form.value.endTime
      ? moment(form.value.endTime).format("YYYY-MM-DD HH:mm:ss")
      : moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");
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
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      let param: { [key: string]: any } = { ...form.value };
      param.beginTime = moment(param.beginTime).format("YYYY-MM-DD HH:mm:ss");
      param.endTime = moment(param.endTime).format("YYYY-MM-DD HH:mm:ss");
      // 校验时间大小（结束>开始）
      if (param.beginTime >= param.endTime) {
        ElMessage.warning("结束时间需大于开始时间！");
        return;
      }
      if (state.dialogType == 0) {
        const res: { [key: string]: any } = await whiteListAdd(param);
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
      } else {
        const res: { [key: string]: any } = await whiteListEdit(param);
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
.white-list-box {
  .el-form,
  .el-form .el-select {
    width: 230px;
    :deep(.el-input) {
      width: 230px;
    }
  }
}
</style>
