<template>
  <el-icon :size="size" :color="color">
    <component :is="src" v-if="src"></component>
  </el-icon>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Icon",
  props: {
    // svg路径地址
    src: {
      type: String,
      require: true,
      default: "Menu"
    },
    size: {
      type: Number,
      default: 12
    },
    color: {
      type: String,
      default: ""
    }
  },
  setup() {
    return {};
  }
});
</script>

<style scoped></style>
