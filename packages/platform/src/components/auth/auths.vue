<template>
  <template v-if="getUserAuthBtnList">
    <slot />
  </template>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAuthStore } from "@/stores/modules/auth";
export default defineComponent({
  name: "Auths",
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const authStore = useAuthStore();
    const authButtons: any = authStore.authButtonListGet || [];
    const getUserAuthBtnList = computed(() => {
      let flag = false;
      authButtons.forEach((val: any) => {
        props.value.forEach(v => {
          if (val === v) flag = true;
        });
      });
      return flag;
    });
    return {
      getUserAuthBtnList
    };
  }
});
</script>
