<template>
  <div class="map-type">
    <!-- title模块 -->
    <div class="title-box">
      <span>地图类型</span>
      <Icon src="Close" :size="14" @click.stop="onClose"></Icon>
    </div>
    <!-- 图片显示模块 -->
    <div class="content-box">
      <span>地图类型：</span>
      <el-radio-group v-model="radio" @change="radioChange">
        <el-radio label="1">街道地图</el-radio>
        <el-radio label="2">卫星地图</el-radio>
      </el-radio-group>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});
const emits = defineEmits(["onClose"]);

// 关闭地图类型
const onClose = () => {
  emits("onClose", 2);
};
const defaultOptions = computed(() => {
  let defaultOptions = props.map?.defaultOptions;
  return defaultOptions;
});
const radio = ref<string>();
const radioChange = (value: any) => {
  if (!props.map) return;
  const { showOverlay } = props.map?.defaultOptions || {};
  const { normalMap, sateMap, overlayMap } = props.map?.get("layerMap");
  if (props?.map && props.map?.defaultOptions) {
    props.map.defaultOptions.defaultMapType = Number(value);
  }
  if (Number(value) === 1) {
    normalMap.setVisible(true);
    sateMap.setVisible(false);
    overlayMap.setVisible(false);
  } else {
    normalMap.setVisible(false);
    sateMap.setVisible(true);
    overlayMap.setVisible(showOverlay);
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
  width: 320px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  padding: 0 10px;
  background-color: var(--el-color-primary-light-8);
}
.title-box span {
  font-size: 16px;
}
.content-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 60px;
  padding-left: 10px;
  overflow: auto;
}
</style>
