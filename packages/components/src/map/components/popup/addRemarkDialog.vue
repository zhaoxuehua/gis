<template>
  <div>
    <el-dialog
      title="添加备注"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="名称" prop="name">
          <el-input placeholder="请输入..." v-model="form.name" clearable style="width: 230px" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phoneNumber">
          <el-input placeholder="请输入..." v-model="form.phoneNumber" clearable style="width: 230px" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" style="width: 230px" v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { getVisitObjectDetail, editVisitObject } from "../../../api/device";
import { ElMessage } from "element-plus";

const state = reactive({
  open: false,
  rulesForm: {
    name: [{ required: true, message: "名称不能为空", trigger: ["blur", "change"] }],
    phoneNumber: [
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (value && !/^\+?[1-9][0-9]*$/.test(value)) {
            return callback(new Error("联系电话输入错误"));
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
  name: "",
  phoneNumber: "",
  remark: ""
};

let form = ref<{
  [key: string]: any;
}>(defaultParam);

const openDialog = async (row?: { [key: string]: any }) => {
  // 根据code查详情
  let code = row?.code;
  if (code) {
    const res: { [key: string]: any } = await getVisitObjectDetail("?pageSize=10000&pageNumber=1", { code: code });
    if (res.items) {
      if (res.items?.length) {
        form.value = { ...res?.items[0] };
        state.open = true;
      } else {
        ElMessage({
          type: "warning",
          message: "未查询到数据"
        });
      }
    } else {
      ElMessage({
        type: "error",
        message: "接口异常"
      });
    }
  }
};

const onClose = () => {
  state.open = false;
};

const onConfirm = () => {
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      const param = {
        ...form.value
      };
      const res: { [key: string]: any } = await editVisitObject(param);
      if (res.code == 200) {
        ElMessage.success("保存成功");
        state.open = false;
      } else {
        ElMessage({
          type: "error",
          message: res?.msg
        });
      }
    }
  });
};

defineExpose({
  openDialog
});
</script>
