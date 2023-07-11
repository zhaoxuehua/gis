<!-- 导航树部分（点击、编辑、新增、删除） -->
<template>
  <div class="nav-tree">
    <div class="title">
      <span>导航树</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="nav-tree-content">
      <el-input
        placeholder="输入关键字进行过滤"
        v-model="state.filterText"
        clearable
        @keyup.enter="treeSearch"
        class="nav-tree-content-filter"
      >
      </el-input>
      <div class="tree-content">
        <el-tree
          :data="navTreeData"
          :props="state.defaultProps"
          @node-click="handleNodeClick"
          :filter-node-method="filterNode"
          ref="treeRef"
        >
          <template #default="{ data }">
            <span class="custom-tree-node" :class="{ active: !!data.associationInfo }">
              <span>{{ data.name }}</span>
              <span v-if="data.equipNodeFlag">
                <Icon src="Plus" :size="14" @click="onAdd(data)" v-if="!data.associationInfo"></Icon>
                <Icon src="EditPen" :size="14" v-if="data.associationInfo" @click.stop="onEdit(data)"></Icon>
                <Icon src="Delete" :size="14" v-if="data.associationInfo" @click.stop="onDelete(data)"></Icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, reactive, watch, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useGisStore } from "@/stores/modules/gis";
import { getLabelInfoByEquipId, addAssociation } from "@/api/gis.js";
import { cloneDeep } from "lodash";

import type { VisualMap, NavigationTreeNodeData, LabelType } from "../type";
import { removeLabel, createLabel, labelOnSelect } from "../hooks/index";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});
const emits = defineEmits(["onEditLabel", "onClose"]);
const gisStore = useGisStore();
const treeRef = ref();
const state = reactive({
  defaultProps: {
    children: "children",
    label: "name"
  },
  filterText: "" // 树搜索字段
});

// 关闭标签树
const onClose = () => {
  emits("onClose", 0);
};
// 导航树数据源
const navTreeData = computed(() => {
  return gisStore.navigationTree;
});

const treeSearch = () => {
  treeRef.value.filter(state.filterText);
};
const filterNode = (value: any, data: any) => {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
};

// 树节点点击
const handleNodeClick = (data: NavigationTreeNodeData) => {
  labelOnSelect(props.map, data.associationInfo?.associationObjectCode, false);
};

// 编辑
const onEdit = (data: NavigationTreeNodeData) => {
  emits("onEditLabel", data.associationInfo?.associationObjectCode);
};

// 删除
const onDelete = (data: NavigationTreeNodeData) => {
  const labelInfoMap = props.map?.get("labelInfoMap") || {};
  const label = labelInfoMap[data.associationInfo?.associationObjectCode];
  if (!label) {
    ElMessage.warning("标签不存在或已删除");
    return;
  }
  ElMessageBox.confirm("确定删除该标签吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      removeLabel(label, props.map);
    })
    .catch(() => {});
};

// 新增标签
const onAdd = async (data: NavigationTreeNodeData) => {
  const { id } = data;
  const res: { [key: string]: any } = await getLabelInfoByEquipId([id]);
  if (res.code == 200 && res.data) {
    const labelTypeMap = props.map?.get("labelTypeMap") || {};
    const { gisLabelConfig } = res.data[0];
    if (gisLabelConfig && labelTypeMap) {
      const featureType = labelTypeMap[gisLabelConfig.code];

      if (!featureType) {
        ElMessage.warning("请在地图参数中配置相应的显示标签类型和显示图层");
      } else {
        onAddHandler(featureType, data);
      }
    } else {
      ElMessage.warning("请先配置标签类型");
    }
  } else {
    ElMessage.error(res.msg);
  }
};

// 导航树新增
const onAddHandler = (featureType: LabelType, node: NavigationTreeNodeData) => {
  if (!featureType) return;
  const _featureType = cloneDeep(featureType); // 标签类型数据
  // 取树节点的设备名称
  _featureType.name = node.name;

  createLabel(props.map, _featureType, function (result: any, feature: any, drawFeature: any) {
    if (!result) {
      ElMessage.error("创建标签失败");
      return;
    }

    if (props.map && drawFeature) {
      props.map.removeInteraction(drawFeature);
    }
    let labelInfoMap = props.map?.get("labelInfoMap") || {};
    labelInfoMap[result.code] = result; // 存储绘制的标签信息
    props.map.set("labelInfoMap", labelInfoMap);
    let featureTypeGroup = props?.map.get("featureTypeGroup");
    featureTypeGroup[result.labelType.code].push(feature);
    props.map?.set("featureTypeGroup", featureTypeGroup);
    ElMessage.success("新增标签成功");
    // 新增关联关系
    addAssociation({
      associationType: 5,
      assetId: node.id,
      associationObjectCode: result.code,
      assetModel: node.nodeRelatedModel
    }).then(
      (res: any) => {
        if (!res) return;
        // 更新导航树及关联关系
        gisStore.fetchNavigationTree();
        ElMessage.success("保存成功");
      },
      (err: any) => {
        console.warn(err);
        ElMessage.error("保存失败");
      }
    );
  });
};

// 监听键盘ESC
document.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.map) {
    let drawFeature = props.map?.get("drawFeature");
    if (drawFeature) {
      props.map?.removeInteraction(drawFeature);
      drawFeature = null;
      props.map.set("drawFeature", null);
    }
  }
});

watch(
  () => state.filterText,
  val => {
    treeRef.value.filter(val);
  }
);

onMounted(() => {
  // 获取并更新导航树
  gisStore.fetchNavigationTree();
});
</script>

<style lang="scss" scoped>
.nav-tree {
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 500px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  background-color: var(--el-color-primary-light-8);
}
.title span {
  font-size: 16px;
  font-weight: bold;
}
.nav-tree .title {
  padding: 0 10px;
}
.title .icon {
  cursor: pointer;
}
.nav-tree-content {
  height: calc(100% - 50px);
  padding: 0 20px;
}
.nav-tree-content-filter {
  width: 100%;
  margin: 20px 0;
}
.tree-content {
  height: calc(100% - 92px);
}
.custom-tree-node {
  display: flex;
  align-items: center;
}
.custom-tree-node i {
  margin-left: 8px;
  visibility: hidden;
}
.el-tree-node__content:hover i {
  visibility: visible;
}
</style>
