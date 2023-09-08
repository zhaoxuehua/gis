<template>
  <div>
    <el-dialog
      title="关键词显示配置"
      v-model="open"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <div>
        <div v-for="(item, index) in state.keywordConfigList" :key="index">
          <div class="position-box">
            <label> key </label>
            <el-input
              type="text"
              @blur="validateInput(state.keywordConfigList[index][0])"
              v-model="state.keywordConfigList[index][0]"
              class="input-box"
            />
            <label class="label-box"> value </label>
            <el-input type="text" v-model="state.keywordConfigList[index][1]" class="input-box" />
            <div class="editIcon" @click.stop="onAdd(index)">
              <Icon src="Plus" :size="14" class="icon"></Icon>
            </div>
            <div class="editIcon" @click.stop="onDelete(index)">
              <Icon src="Delete" :size="14" class="icon"></Icon>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="create">添加</el-button>
          <el-button type="primary" @click="onConfirm">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import * as Regular from "@/plugins/verification.js";
import { ElMessage } from "element-plus";

const emits = defineEmits(["successAdd"]);
const open = ref<boolean>(false);
const state: { keywordConfigList: any } = reactive({
  keywordConfigList: [] // [[],[],[]]
});

const validateInput = (inputValue: any) => {
  if (!Regular.verifyNumCode.test(inputValue)) {
    ElMessage.warning("【key】只能输入字母,数字,下划线");
  }
};

const openDialog = (keywordConfig: { [key: string]: any } = {}) => {
  state.keywordConfigList = Object.entries(keywordConfig);
  open.value = true;
};

const onClose = () => {
  open.value = false;
};

const create = () => {
  state.keywordConfigList.push([]);
};

const onAdd = (idx: number) => {
  state.keywordConfigList.splice(idx + 1, 0, []);
};

const onDelete = (idx: number) => {
  state.keywordConfigList?.splice(idx, 1);
};

const onConfirm = () => {
  // 不能为空的校验
  let hasEmpty = false;
  let hasError = false;
  for (let i = 0; i < state.keywordConfigList.length; i++) {
    if (!state.keywordConfigList[i][0] || !state.keywordConfigList[i][1]) {
      hasEmpty = true;
      break;
    }
    if (!Regular.verifyNumCode.test(state.keywordConfigList[i][0])) {
      hasError = true;
      break;
    }
  }
  if (hasEmpty) {
    ElMessage.warning("【key value】不能为空！");
    return;
  }
  if (hasError) {
    ElMessage.warning("【key】只能输入字母,数字,下划线");
    return;
  }

  let newObj = Object.fromEntries(state.keywordConfigList); // 键值对数组转为对象
  emits("successAdd", newObj);
  onClose();
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.position-box {
  padding-left: 20px;
  margin-bottom: 15px;
  .input-box {
    width: 160px;
    padding-left: 5px;
  }
  .label-box {
    padding-left: 20px;
  }
  .editIcon {
    display: inline-block;
    width: 30px;
    height: 30px;
    margin-left: 10px;
    line-height: 30px;
    color: #ffffff;
    text-align: center;
    cursor: pointer;
    background: var(--el-color-primary);
    border: 1px solid #dddddd;
    border-radius: 50%;
  }
}
</style>
