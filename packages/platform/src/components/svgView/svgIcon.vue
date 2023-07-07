<template>
  <div class="svg-icon-menu" :style="{ ...style }">
    <el-icon :size="14">
      <component :is="src"></component>
    </el-icon>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, reactive } from "vue";

export default defineComponent({
  name: "SvgIcon",
  props: {
    // svg路径地址
    src: {
      type: String,
      require: true,
      default: ""
    },
    // 行内样式
    style: {
      type: [Object],
      default: () => {
        return {};
      }
    }
  },
  setup() {
    const state = reactive({});
    return {
      ...toRefs(state)
    };
  }
});
</script>

<style scoped>
.svg-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
}
.svg-icon-menu {
  display: flex;
  align-items: center;
  width: 30px;
  height: 100%;
}
</style>
