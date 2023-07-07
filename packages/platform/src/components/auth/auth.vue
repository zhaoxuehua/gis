<template>
  <template v-if="getUserAuthBtnList">
    <slot />
  </template>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuthStore } from "@/stores/modules/auth";
export default defineComponent({
  name: "Auth",
  props: {
    value: {
      type: String,
      default: () => ""
    }
  },
  setup(props) {
    const authStore = useAuthStore();
    const authButtonList: any = authStore.authButtonListGet || [];
    const getUserAuthBtnList = computed(() => {
      return authButtonList?.some((v: string) => v === props.value);
    });
    return {
      getUserAuthBtnList
    };
  }
});
</script>
