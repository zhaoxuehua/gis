<template>
  <svg class="icon" aria-hidden="true" :style="{ margin: 0, ...style }">
    <use :xlink:href="`#${src}`"></use>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SvgView",
  props: {
    // svg路径地址
    src: {
      type: String,
      require: true,
      default: ""
    },
    // 行内样式
    style: {
      type: Object
    }
  },
  setup() {
    return {};
  }
});
</script>

<style scoped></style>
