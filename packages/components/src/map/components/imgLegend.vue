<template>
  <div class="legend-sub">
    <!-- title模块 -->
    <div class="title-box">
      <span>图例</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 图片显示模块 -->
    <div class="imgs-box">
      <div v-for="info in infoList" :key="info?.value">
        <div class="img-div">
          <img :src="info?.src" alt="" width="20" />
          <div>
            <el-tooltip effect="light" :content="info?.name" placement="top-start">
              <span>{{ info?.name }}</span>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted } from "vue";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});
const emits = defineEmits(["onClose"]);
const infoList = computed(() => {
  let { displayLegend } = props?.map?.defaultOptions || {};
  if (displayLegend && displayLegend?.length) {
    let imgList = displayLegend.map((item: { [key: string]: any }) => {
      return {
        name: item?.legendName,
        src: `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${item.legendPath}`
      };
    });
    return imgList;
  } else {
    return [];
  }
});

// 关闭图例
const onClose = () => {
  emits("onClose", 3);
};

onMounted(() => {});
</script>

<style lang="scss" scoped>
.legend-sub {
  display: flex;
  flex-direction: column;
  width: 430px;
  max-height: 320px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding: 0 20px;
  background-color: #f7f7fa;
  span {
    font-size: 16px;
  }
  .icon {
    cursor: pointer;
  }
}
.imgs-box {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  width: 100%;
  max-height: 260px;
  padding: 0 20px 20px;
  overflow-x: hidden;
  overflow-y: auto;
}
.img-div {
  display: flex;
  flex-direction: row; /* 将方向改为横向 */
  align-items: center; /* 垂直居中显示 */
  justify-content: flex-start; /* 水平显示 */
  width: 180px; /* 根据内容自适应宽度 */
  height: 20px;
  margin-top: 20px; /* 调整间距 */
}
.img-div img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 100%;
  margin-right: 3px;
}
.img-div div {
  display: flex;
  flex-direction: row; /* 将方向改为横向 */
  align-items: center;
  justify-content: flex-start;
  height: 20px;
  overflow: hidden;
  white-space: nowrap; /* 添加此属性，防止文本换行 */
}
.img-div span {
  font-size: 12px;
}
</style>
