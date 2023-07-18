<template>
  <div>
    <el-dialog
      :title="['创建图例', '编辑图例'][state.dialogType]"
      v-model="state.open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
        <el-form-item label="图例名称" prop="legendName">
          <el-input placeholder="请输入..." v-model="form.legendName" clearable />
        </el-form-item>
        <el-form-item label="图例图片" prop="legendPath" v-if="state.dialogType == 0">
          <el-upload
            action="#"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="uploadLabelTypeImage"
            class="avatar-uploader"
          >
            <div v-if="form.legendPath">
              <img class="avatar" :src="`/backend1/equip/gisLabel/type/getAllPathByFileName/${form.legendPath}`" alt="" />
            </div>
            <Icon v-else src="Plus" class="avatar-uploader-icon" :size="28"></Icon>
          </el-upload>
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
import { addLegend, editLegend, upLoadImage } from "@/api/visconfig.js";

const emit = defineEmits(["successAdd"]);

const state = reactive({
  dialogType: 0,
  open: false,
  rulesForm: {
    legendName: [
      { required: true, message: "图例名称不能为空", trigger: ["blur", "change"] },
      { max: 50, message: "图例名称长度不能大于50", trigger: ["blur", "change"] }
    ],
    legendPath: [{ required: true, message: "图例图片不能为空", trigger: ["blur", "change"] }]
  }
});
const refForm = ref<InstanceType<typeof ElForm>>();

const defaultParam = {
  legendName: "",
  legendPath: "",
  labelTypeImageAllPath: ""
};

let form = ref<{
  id?: number;
  legendName: string;
  legendPath: string;
  labelTypeImageAllPath: string;
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
        const res: { [key: string]: any } = await addLegend(param);
        if (res.code == 200) {
          ElMessage.success("创建成功");
          emit("successAdd");
          state.open = false;
        } else {
          ElMessage({
            type: "error",
            message: res?.msg
          });
        }
      } else if (state.dialogType == 1) {
        // 编辑
        const res: { [key: string]: any } = await editLegend(param);
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

// 上传前验证
const beforeUpload = (rawFile: any) => {
  if (!["image/jpeg", "image/png"].includes(rawFile.type)) {
    ElMessage.error("只能上传图片格式!");
    return false;
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error("图片大小不能超过 2MB!");
    return false;
  }
  return true;
};

// 点图例上传
const uploadLabelTypeImage = async (content: any) => {
  let formData = new FormData();
  formData.append("uploadFile", content.file);
  const res: { [key: string]: any } = await upLoadImage(formData);
  if (res.code == 200) {
    ElMessage({
      type: "success",
      message: "上传成功"
    });
    const { fileName, fileUrl } = res.data;
    form.value.legendPath = fileName;
    form.value.labelTypeImageAllPath = fileUrl;
    refForm.value?.validateField("legendPath");
  } else {
    ElMessage.error(res.msg);
  }
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.avatar-uploader {
  ::v-deep(.el-upload) {
    position: relative;
    width: 200px;
    height: 200px;
    overflow: hidden;
    cursor: pointer;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    transition: 0.2s;
    div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }
  ::v-deep(.el-upload:hover) {
    border-color: var(--color-primary);
  }
  .avatar {
    max-width: 100%;
    max-height: 100%;
  }
  .avatar-uploader-icon {
    width: 200px;
    height: 200px;
    font-size: 28px;
    line-height: 200px;
    color: #8c939d;
    text-align: center;
  }
}
</style>
