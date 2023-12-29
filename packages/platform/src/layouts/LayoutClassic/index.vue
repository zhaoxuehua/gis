<!-- 经典布局 -->
<template>
  <el-container class="layout">
    <el-header v-if="!isSubApp">
      <div class="header-lf">
        <div class="logo flx-center">
          <img src="@/assets/images/logo.png" alt="logo" />
          <span class="logo-text">GIS基础引擎</span>
        </div>
      </div>
      <div class="header-ri">
        <ToolBarRight />
      </div>
    </el-header>
    <el-container :class="['classic-content', isSubApp ? 'sub-app-classic-content' : '']">
      <el-aside v-if="!isSubApp">
        <div class="aside-box" :style="{ width: isCollapse ? '65px' : '240px' }">
          <el-scrollbar>
            <el-menu
              :default-active="activeMenu"
              :router="false"
              :collapse="isCollapse"
              :collapse-transition="false"
              :unique-opened="true"
            >
              <SubMenu :menuList="menuList" />
            </el-menu>
          </el-scrollbar>
        </div>
        <CollapseIcon />
      </el-aside>
      <el-container class="classic-main">
        <Main />
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup lang="ts" name="layoutClassic">
import { computed, inject } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/modules/auth";
import { useGlobalStore } from "@/stores/modules/global";
import Main from "@/layouts/components/Main/index.vue";
import SubMenu from "@/layouts/components/Menu/SubMenu.vue";
import CollapseIcon from "@/layouts/components/Header/components/CollapseIcon.vue";
import ToolBarRight from "@/layouts/components/Header/ToolBarRight.vue";

const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const isCollapse = computed(() => globalStore.isCollapse);
const menuList = computed(() => authStore.showMenuListGet);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);
const isSubApp = inject("isSubApp");
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
