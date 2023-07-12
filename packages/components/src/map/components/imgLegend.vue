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
import { useGisStore } from "@/stores/modules/gis";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});
const emits = defineEmits(["onClose"]);
const gisStore = useGisStore();
const infoList = computed(() => {
  let { legendIds } = props?.map?.defaultOptions || {};
  if (legendIds) {
    let legendIdArray = legendIds.split(",") || [];
    let imgList = legendIdArray.map((item: string) => {
      let legendList = gisStore.imgLegendList || [];
      let legendObj = legendList.find((obj: { [key: string]: any }) => obj?.legendPath == item);
      return {
        name: legendObj?.legendName,
        src: `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${item}`
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

onMounted(() => {
  gisStore.getLegendList();
});
</script>

<style lang="scss" scoped>
.legend-sub {
  display: flex;
  flex-direction: column;
  width: 320px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  padding: 0 10px;
  background-color: var(--el-color-primary-light-8);
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
  width: 100%;
  overflow-x: hidden; /* 隐藏横向滚动条 */
  overflow-y: auto; /* 出现纵向滚动条 */
}
.img-div {
  display: flex;
  flex-direction: row; /* 将方向改为横向 */
  align-items: center; /* 垂直居中显示 */
  justify-content: flex-start; /* 水平显示 */
  width: 130px; /* 根据内容自适应宽度 */
  height: 20px;
  margin: 10px; /* 调整间距 */
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
  width: 180px;
  height: 20px;
  overflow: hidden;
  white-space: nowrap; /* 添加此属性，防止文本换行 */
}
.img-div span {
  font-size: 12px;
}
</style>
