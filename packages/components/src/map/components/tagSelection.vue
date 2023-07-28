<template>
  <div class="map-type">
    <!-- title模块 -->
    <div class="title-box">
      <span>标签筛选</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 标签类型显示模块 -->
    <div class="content-box">
      <div class="all-tag">
        <el-checkbox v-model="state.checkAll" :indeterminate="state.isIndeterminate" @change="handleCheckAllChange"
          >全部
        </el-checkbox>
      </div>
      <div>
        <el-checkbox-group v-model="checkedTags" @change="handleCheckedChange">
          <el-checkbox v-for="item in labelTypeList" :key="item.code" :label="item.code">
            <img v-if="item.labelLegendImagePath" :src="item?.iconUrl" />
            {{ item.name }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, reactive, ref, onMounted, watch, toRefs } from "vue";
import Feature from "ol/Feature";
import type { VisualMap } from "../type";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onClose"]);

const { map, index } = toRefs(props);

const onClose = () => {
  emits("onClose", index.value);
};

let state = reactive({
  checkAll: true, // 全选
  isIndeterminate: false // 半选状态
});

// 标签要素分组
const featureTypeGroup = computed(() => {
  let featureTypeGroup = map.value?.get("featureTypeGroup") || {};
  return featureTypeGroup;
});

// 标签类型
const labelTypeList: any = computed(() => {
  let labelTypeMap = map.value?.get("labelTypeMap") || {};
  return Object.values(labelTypeMap);
});

// 地图图层
const layerMap = computed(() => {
  let layerMap = map.value?.get("layerMap") || {};
  return layerMap;
});

// 已选择的标签
let checkedTags = ref<Array<string>>([]);

const handleCheckAllChange = (val: any) => {
  checkedTags.value = val ? labelTypeList.value?.map((item: any) => item.code) : [];
  state.isIndeterminate = false;
  setFeatureVisible();
};

const handleCheckedChange = (value: any[]) => {
  const checkedCount = value.length;
  state.checkAll = checkedCount === checkedTags.value.length;
  state.isIndeterminate = checkedCount > 0 && checkedCount < labelTypeList.value?.length;
  setFeatureVisible();
};

// 遍历所有标签类型，根据选中状态修改每个类型下的标签要素的显示状态
const setFeatureVisible = () => {
  labelTypeList.value.forEach((item: any) => {
    // 遍历该类型下的所有标签要素
    featureTypeGroup.value[item.code].forEach((feature: Feature) => {
      const layer = layerMap.value[feature.get("layerCode")];
      const isTagAgg = layer.get("isTagAgg");
      let source: any;
      if (isTagAgg) {
        const clusterDataSource = layer.getSource();
        source = clusterDataSource.getSource();
      } else {
        source = layer.getSource();
      }
      // 此处设置样式还是操作图层？
      if (checkedTags.value.includes(item.code)) {
        source.addFeature(feature);
      } else if (!checkedTags.value.includes(item.code) && source.hasFeature(feature)) {
        source.removeFeature(feature);
      }
    });
  });
};

onMounted(() => {});

watch(
  labelTypeList,
  value => {
    if (value && value?.length) {
      checkedTags.value = value.map((item: any) => item.code);
    }
  },
  {
    deep: true,
    flush: "post"
  }
);
</script>

<style lang="scss" scoped>
.map-type {
  display: flex;
  flex-direction: column;
  width: 430px;
  height: 320px;
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
.content-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: 260px;
  padding: 0 20px 20px;
  overflow: auto;
  .all-tag {
    margin-top: 10px;
  }
  .el-checkbox {
    height: 20px;
    margin-top: 5px;
    img {
      max-width: 23px;
      max-height: 19px;
      margin-right: 3px;
      vertical-align: bottom;
    }
  }
}
</style>
