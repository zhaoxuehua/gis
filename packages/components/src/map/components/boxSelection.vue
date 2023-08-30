<!-- 框选 -->
<template>
  <div class="box-selection" @click.stop>
    <!-- title模块 -->
    <div class="title-box">
      <span>框选模式</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 图片显示模块 -->
    <div class="content-box">
      <span>框选模式：</span>
      <el-radio-group v-model="radio" @change="boxSelectRadioChange">
        <el-radio label="Circle">矩形</el-radio>
        <el-radio label="Polygon">多边形</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, toRefs, watch } from "vue";
import { selectionAddDrawInteraction } from "../hooks/index";
import { clearSelectionDrawInteraction } from "../hooks/clearSelectionDrawInteraction";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null; index?: number; isShow?: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const emits = defineEmits(["onClose", "onBoxSelection"]);

// 地图实例
const { map, isShow, index } = toRefs(props);
// 关闭地图类型
const onClose = () => {
  emits("onClose", index.value);
};

const radio = ref<string>("Circle");

watch(
  () => isShow.value,
  isShowVal => {
    if (isShowVal) {
      selectionAddDrawInteraction(map.value, radio.value, handleSelectionFeatures);
    } else {
      clearSelectionDrawInteraction(map.value);
    }
  },
  {
    immediate: true,
    deep: true
  }
);

const boxSelectRadioChange = (val: any) => {
  radio.value = val;
  clearSelectionDrawInteraction(map.value);
  selectionAddDrawInteraction(map.value, val, handleSelectionFeatures);
};
const handleSelectionFeatures = (selectionFeatures: any[]) => {
  const searchCode = map.value?.defaultOptions?.displaySearch.map((item: any) => item.code);
  selectionFeatures = selectionFeatures.filter(item => searchCode?.includes(item.get("labelTypeCode")));
  emits("onBoxSelection", selectionFeatures);
};
</script>

<style lang="scss" scoped>
.box-selection {
  display: flex;
  flex-direction: column;
  width: 430px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding: 0 20px;
  background-color: #f7f7fa;
  span {
    font-size: 16px;
  }
  .icon {
    cursor: pointer;
  }
}
.content-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  padding-left: 20px;
  overflow: auto;
}
</style>
