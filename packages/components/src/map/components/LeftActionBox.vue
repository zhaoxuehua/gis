<template>
  <div class="action-box">
    <div class="left-box">
      <!-- 导航栏部分 -->
      <div class="left-action">
        <div v-for="(item, index) in props.leftBoxData" :key="item.label">
          <!-- 当不是编辑状态时隐藏标签树及快速绘制 -->
          <div
            class="left-action-item"
            :class="{ active: item.isShow }"
            @click.stop="leftBoxClick(index)"
            v-if="item.visible && !(!isEditShow && (item.label == '标签树' || item.label == '快速创建'))"
          >
            <el-tooltip effect="light" :content="item.label" placement="bottom-start">
              <i :class="item.icon" class="left-icon"></i>
            </el-tooltip>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      <!-- 内容部分 -->
      <div class="left-content">
        <div v-for="(item, index) in props.leftBoxData" :key="index">
          <component
            :is="item.component"
            v-if="item.isShow"
            :map="props.map"
            :index="index"
            :isShow="item.isShow"
            @on-close="leftBoxClick"
            @on-edit-label="onEditLabel"
          ></component>
        </div>
      </div>
    </div>
    <!-- 标签搜索框 -->
    <SearchDialog
      v-if="deviceSearchVisible"
      class="action-search"
      :style="{ left: searchLeft + 'px' }"
      :map="props.map"
    ></SearchDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from "vue";
import { useGisStore } from "../../stores/modules/gis";
import type { VisualMap, leftBoxData as boxData } from "../type";
import SearchDialog from "./searchDialog.vue";

const gisStore = useGisStore();
const props = withDefaults(
  defineProps<{
    map: VisualMap | null;
    leftBoxData: boxData[];
    deviceSearchVisible?: boolean;
    isCustomSearchDialog?: boolean;
  }>(),
  {
    map: () => null,
    leftBoxData: () => [],
    deviceSearchVisible: () => false,
    isCustomSearchDialog: () => false
  }
);
const emits = defineEmits(["leftBoxDataChange", "onEditLabel", "isEditChangeHidden", "customSearchDialog"]);

const isEditShow = computed(() => {
  return gisStore.isEdit;
});

const searchLeft = ref();

// 左侧控件导航点击
const leftBoxClick = (index: number) => {
  emits("leftBoxDataChange", index);
};

// 编辑标签
const onEditLabel = (labelCode: any) => {
  emits("onEditLabel", labelCode);
};

watch(
  isEditShow,
  val => {
    if (!val) {
      // 不显示标签树、快速绘制
      emits("isEditChangeHidden");
    }
    nextTick(() => {
      searchLeft.value = (document.querySelector(".left-action")?.clientWidth || 0) + 25;
    });
  },
  {
    deep: true,
    flush: "post"
  }
);

watch(
  props.leftBoxData,
  () => {
    searchLeft.value = (document.querySelector(".left-action")?.clientWidth || 0) + 25;
  },
  {
    deep: true,
    flush: "post"
  }
);
</script>
<style lang="scss" scoped>
/* 大盒子的布局：导航+内容  列排 */
.left-box {
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

// 导航大盒子
.left-action {
  display: flex;
  align-items: center;
  padding: 0 3px;
  color: #606266;
  pointer-events: all;
  background-color: #ffffff;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}

// 每个导航的样式
.left-action-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  background-color: var(--background-color);
}
.left-icon {
  margin-right: 6px;
  font-size: 14px;
}
.left-action-item:hover {
  color: var(--color-primary);
}
.active {
  color: var(--color-primary);
}

// 内容区域的样式
.left-content {
  display: flex;
  margin-top: 5px;
  overflow: auto;
  background-color: #ffffff;
  border-radius: 6px;
}

// 搜索
.action-search {
  position: absolute;
  top: 15px;
  width: 240px;
  margin-left: 10px;
  ::v-deep(.el-input__inner) {
    height: 39px;
    line-height: 39px;
  }
}
</style>
