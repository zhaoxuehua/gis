<template>
  <button class="ag-button" :class="buttonStyle">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
defineOptions({ name: "AgButton" });
type ButtonProps = {
  type?: string;
  size?: string;
};
const buttonProps = defineProps<ButtonProps>();

const buttonStyle = computed(() => {
  return { [`ag-button--${buttonProps.type}`]: buttonProps.type };
});
</script>

<style scoped lang="scss">
.ag-button {
  box-sizing: border-box;
  display: inline-block;
  padding: 12px 20px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  color: #606266;
  text-align: center;
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  transition: 0.1s;
}
.ag-button.ag-button-primary {
  color: #ffffff;
  background-color: #409eff;
  border-color: #409eff;
  &:hover {
    color: #ffffff;
    background: #66b1ff;
    border-color: #66b1ff;
  }
}
</style>
