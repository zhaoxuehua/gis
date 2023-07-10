<template>
  <div class="map-popup" ref="popupRef">
    <div style="width: 450px" v-if="!customContent">
      <div class="map-popup-header">
        <span>标签信息 </span>
        <Icon src="Close" :size="14" @click="onClosePopup"></Icon>
      </div>
      <div class="map-popup-body">
        <span>名称：{{ props.data?.data?.featureCode }}</span>
        <span>编码：{{ props.data?.data?.featureName }}</span>
      </div>
    </div>
    <!-- 自定义内容插槽 -->
    <template v-else>
      <slot name="customContent"></slot>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, useSlots } from "vue";

const props = withDefaults(defineProps<{ data: { [key: string]: any } }>(), {
  data: () => ({})
});

const emits = defineEmits(["onClose"]);
const popupRef = ref<InstanceType<typeof HTMLElement>>();
const customContent = useSlots()?.customContent;

const onClosePopup = () => {
  emits("onClose");
};

const getDOMElement = () => {
  return popupRef.value;
};

defineExpose({
  getDOMElement
});
</script>

<style lang="scss" scoped>
.map-popup {
  position: absolute;
  bottom: 12px;
  left: -50px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  background-color: #ffffff;
  border: #e0e0e0 solid 1px;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
  &::after,
  &::before {
    position: absolute;
    top: 100%;
    box-sizing: border-box;
    width: 0;
    height: 0;
    pointer-events: none;
    content: " ";
    border: solid transparent;
  }
  &::after {
    left: 48px;
    margin-left: -10px;
    border-width: 10px;
    border-top-color: white;
  }
  &::before {
    left: 48px;
    margin-left: -11px;
    border-width: 11px;
    border-top-color: #cccccc;
  }
  .map-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 15px;
    background-color: var(--el-color-primary-light-8);
    border-bottom: #e0e0e0 solid 1px;
    span {
      font-size: 16px;
      font-weight: bold;
    }
  }
  .map-popup-body {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  }
}
</style>
