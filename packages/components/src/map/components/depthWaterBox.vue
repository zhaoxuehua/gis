<template>
  <div>
    <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
      <el-form-item label="IP" prop="host">
        <el-input placeholder="请输入..." v-model="form.host" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input placeholder="正整数" v-model="form.port" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="水深间隔(m)" prop="depth">
        <el-input placeholder="正整数" v-model="form.depth" clearable style="width: 200px" />
      </el-form-item>
    </el-form>
    <span class="dialog-footer">
      <el-button type="primary" @click="onConfirm">确认</el-button>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getDepthWater } from "../../api/device";

const state = reactive({
  // 弹窗表单验证
  rulesForm: {
    host: [
      { required: true, message: "IP不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !/^([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])$/.test(
              value
            )
          ) {
            return callback(new Error("IP不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    port: [
      { required: true, message: "端口不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^[1-9]\d*$/.test(value)) {
            return callback(new Error("端口不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    depth: [
      { required: true, message: "水深间隔不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^[1-9]\d*$/.test(value)) {
            return callback(new Error("水深间隔不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ]
  }
});
const refForm: any = ref();

const defaultParam = {
  host: "",
  port: "",
  depth: ""
};

let form = ref<{
  host: string;
  port: string;
  depth: string;
}>(defaultParam);

const onConfirm = () => {
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      let param: { [key: string]: any } = { ...form.value };
      const res: { [key: string]: any } = await getDepthWater(param);
      if (res.code == 200) {
        ElMessage.success("操作成功");
      } else {
        ElMessage({
          type: "error",
          message: res.msg
        });
      }
    }
  });
};
</script>

<style lang="scss" scoped></style>
