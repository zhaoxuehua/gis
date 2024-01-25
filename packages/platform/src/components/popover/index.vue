<template>
  <div class="span-popover">
    <el-popover :placement="placement" :width="width" trigger="hover" v-if="info && info?.length > len">
      <template #reference>
        <span>{{ info?.slice(0, len) + "..." }}</span>
      </template>
      <template #default>
        <div class="span-popover-content">{{ info }}</div>
      </template>
    </el-popover>
    <span v-else>{{ info }}</span>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ len: number; placement: any; width: number; info: any }>(), {
  len: () => 10,
  placement: () => "right",
  width: () => 224
});
</script>
<style lang="scss">
.span-popover-content {
  width: 200px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
