<template>
  <div class="ag-map">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: "AgMap" });
</script>

<style scoped lang="scss">
.ag-map {
  display: flex;
}
</style>
