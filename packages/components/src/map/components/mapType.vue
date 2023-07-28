<template>
  <div class="map-type" @click.stop>
    <!-- title模块 -->
    <div class="title-box">
      <span>地图类型</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 图片显示模块 -->
    <div class="content-box">
      <span>地图类型：</span>
      <el-radio-group v-model="radio" @change="radioChange">
        <el-radio label="1">街道地图1</el-radio>
        <el-radio label="2">卫星地图1</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, computed, toRefs } from "vue";
import type { VisualMap } from "../type";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onClose"]);

const { map, index } = toRefs(props);
// 关闭地图类型
const onClose = () => {
  emits("onClose", index.value);
};

const defaultOptions = computed(() => {
  let defaultOptions = map.value?.defaultOptions;
  return defaultOptions;
});
const radio = ref<string>();
const radioChange = (value: any) => {
  radio.value = value;
  if (!map.value) return;
  console.log(radio.value, map.value?.defaultOptions, "测试地图类型");
  const { showOverlay } = map.value?.defaultOptions || {};
  const { normalMap, sateMap, overlayMap } = map.value?.get("layerMap");

  if (map.value && map.value?.defaultOptions) {
    map.value.defaultOptions.defaultMapType = Number(value);
  }
  if (Number(value) === 1) {
    normalMap?.setVisible(true);
    sateMap?.setVisible(false);
    overlayMap?.setVisible(false);
  } else {
    normalMap?.setVisible(false);
    sateMap?.setVisible(true);
    overlayMap?.setVisible(showOverlay);
  }
};

watch(
  defaultOptions,
  value => {
    if (value) {
      let defaultMapType = value?.defaultMapType;
      radio.value = String(defaultMapType);
    }
  },
  {
    deep: true,
    flush: "post"
  }
);
</script>

<style lang="scss" scoped>
.map-type {
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
