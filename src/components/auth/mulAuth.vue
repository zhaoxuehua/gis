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
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const authStore = useAuthStore();
    const authButtonList: any = authStore.authButtonListGet;
    // 获取 vuex 中的用户权限
    const getUserAuthBtnList = computed(() => {
      let flag = false;
      props.value.forEach((item: any) => {
        let isHas = authButtonList?.some((v: unknown) => v === item);
        if (isHas) {
          flag = true;
        }
      });
      return flag;
    });
    return {
      getUserAuthBtnList
    };
  }
});
</script>
