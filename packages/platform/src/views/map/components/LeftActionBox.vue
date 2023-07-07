<template>
  <div class="action-box">
    <div class="left-box">
      <!-- 导航栏部分 -->
      <div class="left-action">
        <div v-for="(item, index) in props.leftBoxData" :key="item.label">
          <div class="left-action-item" :class="{ active: item.isShow }" @click.stop="leftBoxClick(index)" v-if="item.visible">
            <el-tooltip effect="light" :content="item.label" placement="bottom-start">
              <i :class="item.icon" class="left-icon"></i>
            </el-tooltip>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      <!-- 内容部分 -->
      <div class="left-content">
        <div v-for="item in props.leftBoxData" :key="item.label">
          <!-- 父子组件交互数据Props 传递：通过定义子组件的 props及emit事件@handleEvent  :propName= -->
          <component
            :is="item.component"
            v-if="item.isShow"
            :map="props.map"
            @on-close="leftBoxClick"
            @on-edit-label="onEditLabel"
          ></component>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ config?: any; map: VisualMap | null; leftBoxData: any[] }>(), {
  config: () => [],
  map: () => null,
  leftBoxData: () => []
});
const emits = defineEmits(["leftBoxDataChange", "onEditLabel"]);

// 左侧控件导航点击
const leftBoxClick = (index: number) => {
  emits("leftBoxDataChange", index);
};

// 编辑标签
const onEditLabel = (labelCode: any) => {
  emits("onEditLabel", labelCode);
};
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
  // z-index: 2;
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
</style>
