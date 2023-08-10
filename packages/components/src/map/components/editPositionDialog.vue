<template>
  <div>
    <el-dialog
      title="坐标点编辑"
      v-model="open"
      width="650px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <div>
        <div v-for="(item, index) in state.coordinates" :key="index">
          <div class="position-box">
            <label> 经度 </label>
            <el-input type="number" v-model="state.coordinates[index][0]" class="input-box" />
            <label class="label-box"> 纬度 </label>
            <el-input type="number" v-model="state.coordinates[index][1]" class="input-box" />
            <!-- 编辑区域(点文本圆不需要编辑) -->
            <div class="editIcon" v-if="state.dataType != '1' && state.dataType != '4' && state.dataType != '6'">
              <Icon src="Plus" :size="14" class="icon" @click.stop="onAdd(index)"></Icon>
            </div>
            <div class="editIcon" v-if="state.dataType != '1' && state.dataType != '4' && state.dataType != '6'">
              <Icon src="Delete" :size="14" class="icon" @click.stop="onDelete(index)"></Icon>
            </div>
          </div>
        </div>
      </div>
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
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";

const emits = defineEmits(["successAdd"]);
const open = ref<boolean>(false);
const state: { coordinates: any[]; dataType: string } = reactive({
  coordinates: [],
  dataType: ""
});

const openDialog = (coordinates: any, dataType: string) => {
  if (coordinates && coordinates?.length && dataType) {
    state.dataType = dataType;
    // 处理线、环的坐标数组 [[,][,]] 最少2个点
    if (dataType == "2" || dataType == "7") {
      state.coordinates = coordinates;
    } else if (dataType == "3" || dataType == "5") {
      // 处理面、矩形的坐标数组 [[[,],[,],[,]]]  // 首尾必须一致，面坐标点不能少于3个
      state.coordinates = coordinates[0];
    } else {
      // 点 文本、圆 [,]=>[[,]] 1 4 6
      state.coordinates = [coordinates];
    }
    open.value = true;
  }
};

const onClose = () => {
  open.value = false;
};

const onAdd = (idx: number) => {
  state.coordinates.splice(idx + 1, 0, []);
};

const onDelete = (idx: number) => {
  // 线、环不能少于2个
  if (state.dataType == "2" && state.coordinates?.length <= 2) {
    ElMessage.warning("【线】坐标点不能少于2个");
    return;
  }
  if (state.dataType == "7" && state.coordinates?.length <= 2) {
    ElMessage.warning("【环】坐标点不能少于2个");
    return;
  }

  // 面、矩形不能少于3个
  if (state.dataType == "3" && state.coordinates?.length <= 3) {
    ElMessage.warning("【面】坐标点不能少于3个");
    return;
  }
  if (state.dataType == "5" && state.coordinates?.length <= 4) {
    ElMessage.warning("【矩形】坐标点不能少于4个");
    return;
  }
  state.coordinates?.splice(idx, 1);
};

const onConfirm = () => {
  if (!state.coordinates || !state.coordinates?.length) {
    return;
  }
  // 坐标值不能为空的校验
  let hasEmpty = false;
  for (let i = 0; i < state.coordinates.length; i++) {
    if (!state.coordinates[i][0] || !state.coordinates[i][1]) {
      hasEmpty = true;
      break;
    }
  }
  if (hasEmpty) {
    ElMessage.warning("坐标值不能为空");
    return;
  }
  // 处理类型转换
  state.coordinates = state.coordinates.map(item => {
    item[0] = Number(item[0]);
    item[1] = Number(item[1]);
    return item;
  });
  let newCoordinates = state.coordinates;
  // 面最后一个与第一个得坐标值相同的校验(不一样赛一个)
  if (state.dataType == "3" || state.dataType == "5") {
    let first = state.coordinates[0];
    let last = state.coordinates[state.coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      state.coordinates.push(first);
    }
    newCoordinates = [state.coordinates];
  }
  if (state.dataType == "1" || state.dataType == "4" || state.dataType == "6") {
    newCoordinates = state.coordinates[0];
  }
  emits("successAdd", newCoordinates);
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
    width: 200px;
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
