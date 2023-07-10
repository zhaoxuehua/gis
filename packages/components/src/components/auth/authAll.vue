<template>
  <template v-if="getUserAuthBtnList">
    <slot />
  </template>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuthStore } from "@/stores/modules/auth";
import { judementSameArr } from "@/utils/index";
export default defineComponent({
  name: "AuthAll",
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const authStore = useAuthStore();
    const authButtons: any = authStore.authButtonListGet;
    const getUserAuthBtnList = computed(() => {
      return judementSameArr(props.value as string[], authButtons);
    });
    return {
      getUserAuthBtnList
    };
  }
});
</script>
