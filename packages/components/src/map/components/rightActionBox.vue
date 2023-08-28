<template>
  <div class="action-box">
    <div class="right-box">
      <!-- 导航栏部分 -->
      <div class="right-action">
        <div v-for="(item, index) in props.rightBoxData" :key="index">
          <div
            class="right-action-item"
            :class="{ active: item.isShow }"
            @click.stop="rightBoxClick(index, item.label)"
            v-if="item.visible"
          >
            <el-tooltip effect="light" :content="item.label" placement="bottom-start">
              <i :class="item.icon" class="left-icon"></i>
            </el-tooltip>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      <!-- 内容部分 -->
      <div class="right-content">
        <div v-for="(item, index) in props.rightBoxData" :key="index">
          <component
            :is="item.component"
            v-show="item.isShow && item?.label !== '编辑'"
            :map="props.map"
            :index="index"
            :isShow="item.isShow"
            @on-close="rightBoxClick"
            @on-box-selection="onBoxSelection"
          ></component>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VisualMap, leftBoxData } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null; rightBoxData: leftBoxData[] }>(), {
  map: () => null,
  rightBoxData: () => []
});
const emits = defineEmits(["rightBoxDataChange", "onClickBoxSelection"]);

// 左侧控件导航点击
const rightBoxClick = (index: number, label: string = "") => {
  emits("rightBoxDataChange", index, label);
};

const onBoxSelection = (selectionFeatures: any[]) => {
  emits("onClickBoxSelection", selectionFeatures);
};
</script>
<style lang="scss" scoped>
/* 大盒子的布局：导航+内容  列排 */
.right-box {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
}

// 导航大盒子
.right-action {
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
.right-action-item {
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
.right-action-item:hover {
  color: var(--color-primary);
}
.active {
  color: var(--color-primary);
}

// 内容区域的样式
.right-content {
  display: flex;
  margin-top: 5px;
  overflow: auto;
  background-color: #ffffff;
  border-radius: 6px;
}
</style>
