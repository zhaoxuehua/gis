<!-- 框选 -->
<template>
  <div class="box-selection">
    <!-- title模块 -->
    <div class="title-box">
      <span>框选模式</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 图片显示模块 -->
    <div class="content-box">
      <span>框选模式：</span>
      <el-radio-group v-model="state.radio" @change="boxSelectChange">
        <el-radio label="Circle">矩形</el-radio>
        <el-radio label="Polygon">多边形</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, toRefs, watch } from "vue";
import { selectionAddDrawInteraction } from "../hooks/index";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number; isShow: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const emits = defineEmits(["onClose", "onBoxSelection"]);

// 关闭地图类型
const onClose = () => {
  emits("onClose", props.index);
};

const state = reactive({
  radio: "Circle"
});

// 地图实例
const { map, isShow } = toRefs(props);

watch(
  () => isShow.value,
  isShowVal => {
    if (isShowVal) {
      selectionAddDrawInteraction(map.value, state.radio, handleSelectionFeatures);
    } else {
      if (map.value) {
        // 关闭框选
        if (map.value?.get("boxSelectionDrawInteraction")) {
          map.value?.removeInteraction(map.value?.get("boxSelectionDrawInteraction"));
          map.value?.set("boxSelectionDrawInteraction", null);
        }
        if (map.value?.get("boxSelectionSource")) {
          map.value?.get("boxSelectionSource")?.clear();
          map.value?.set("boxSelectionSource", null);
        }
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
);

const boxSelectChange = (val: any) => {
  selectionAddDrawInteraction(map.value, val, handleSelectionFeatures);
};
const handleSelectionFeatures = (selectionFeatures: any[]) => {
  emits("onBoxSelection", selectionFeatures);
  // console.log(selectionFeatures, 77666);
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
