<!-- 导航树部分（点击、编辑、新增、删除） -->
<template>
  <div class="nav-tree" @click.stop>
    <div class="title">
      <div>
        <span>导航树</span>
        <el-button type="primary" size="small" circle class="title-btn" @click.stop="onImport"
          ><Icon src="Upload" title="导入" :size="14"></Icon
        ></el-button>
        <el-button type="primary" size="small" circle class="title-btn" @click.stop="onExport"
          ><Icon src="Download" title="导出" :size="14"></Icon
        ></el-button>
      </div>
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
          :expand-on-click-node="false"
          :default-expanded-keys="state.expandedKeys"
          node-key="id"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node" :class="{ active: !!data.associationInfo }">
              <span>{{ data.name }}</span>
              <span v-if="isEditShow && data.equipNodeFlag" @click.stop>
                <Icon src="Plus" :size="14" @click="onAdd(node, data)" v-if="!data.associationInfo"></Icon>
                <Icon src="EditPen" :size="14" v-if="data.associationInfo" @click.stop="onEdit(data)"></Icon>
                <Icon src="Delete" :size="14" v-if="data.associationInfo" @click.stop="onDelete(node, data)"></Icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
  <UploadMainFileDialog ref="uploadMainFilRef" :fileTitle="'导入设备信息文件'" sceneCode="gisTree"></UploadMainFileDialog>
</template>
<script lang="ts" setup>
import { computed, reactive, watch, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useGisStore } from "../../stores/modules/gis";
import { getLabelInfoByEquipId, addAssociation } from "../../api/gis.js";
import { cloneDeep } from "lodash";

import type { VisualMap, NavigationTreeNodeData, LabelType } from "../type";
import { removeLabel, createLabel, labelOnSelect } from "../hooks/index";
import Icon from "./Icon.vue";
import UploadMainFileDialog from "./uploadFile/uploadMainFile.vue";
import { fileNameMap, useExportExcel } from "./uploadFile/uploadFun";
import { tableDataExport } from "../../api/gis";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onEditLabel", "onClose"]);
const gisStore = useGisStore();
const treeRef = ref();
const state: { defaultProps: { [key: string]: any }; expandedKeys: any[]; filterText: string } = reactive({
  defaultProps: {
    children: "children",
    label: "name"
  },
  filterText: "", // 树搜索字段
  expandedKeys: [] // 已展开的节点键
});

const uploadMainFilRef = ref<InstanceType<typeof UploadMainFileDialog>>();

const onImport = () => {
  uploadMainFilRef.value?.openDialog();
};

const onExport = async () => {
  const formData = new FormData();
  formData.append("sceneCode", "gisTree");
  formData.append("queryStr", JSON.stringify({ appId: gisStore?.mapIdentificationConfig?.mapParams }));
  try {
    const res: any = await tableDataExport(formData);
    if (res?.code == 200) {
      useExportExcel(res?.data, `${fileNameMap["gisTreeExport"]}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// 关闭导航树
const onClose = () => {
  emits("onClose", props.index);
};
// 导航树数据源
const navTreeData = computed(() => {
  return gisStore.navigationTree;
});

const isEditShow = computed(() => {
  return gisStore.isEdit;
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
const timer: any = ref(null);
const onEdit = async (data: NavigationTreeNodeData) => {
  emits("onEditLabel", data.associationInfo?.associationObjectCode);
  timer.value = setTimeout(() => {
    labelOnSelect(props.map, data.associationInfo?.associationObjectCode, false);
    clearTimeout(timer);
    timer.value = null;
  }, 200);
};

// 删除
const onDelete = (node: { [key: string]: any }, data: NavigationTreeNodeData) => {
  getParentNode(node);
  const labelInfoMap = props.map?.get("labelInfoMap") || {};
  const label = labelInfoMap[data.associationInfo?.associationObjectCode];
  if (!label) {
    ElMessage.warning("标签不存在或已删除");
    return;
  }
  if (gisStore.isShowEditLabel) {
    ElMessage.warning("请先关闭编辑标签弹框");
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
const onAdd = async (node: { [key: string]: any }, data: NavigationTreeNodeData) => {
  const { id } = data;
  if (!id) return;
  getParentNode(node);
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

  createLabel(props.map, _featureType, false, function (result: any, feature: any, drawFeature: any) {
    if (!result) {
      ElMessage.error("新增标签失败");
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
        gisStore.fetchCollectRelation();
        ElMessage.success("新增标签成功");
      },
      (err: any) => {
        console.warn(err);
        // ElMessage.error("新增标签失败");
      }
    );
  });
};

// 查找父节点并存储展开节点
const getParentNode = (node: { [key: string]: any }) => {
  // 找父节点塞数据
  const parentNode: { [key: string]: any } = node?.parent;
  const parentNodeId: string | undefined = parentNode?.data?.id;
  if (parentNodeId) {
    state.expandedKeys = [parentNodeId];
  }
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

onMounted(() => {});
</script>

<style lang="scss" scoped>
.nav-tree {
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 500px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    padding: 0 20px;
    background-color: #f7f7fa;
    .title-btn {
      margin-left: 15px;
      i {
        margin: auto;
      }
    }
    span {
      font-size: 16px;
    }
    .icon {
      cursor: pointer;
    }
  }
}
.nav-tree-content {
  height: calc(100% - 60px);
  padding: 0 20px;
  .nav-tree-content-filter {
    width: 100%;
    margin: 20px 0;
  }
  .tree-content {
    height: calc(100% - 92px);
    .custom-tree-node {
      display: flex;
      align-items: center;
      color: #999999;
      &.active {
        color: #606266;
      }
      .highlight {
        color: var(--el-color-primary);
      }
    }
  }
}
.custom-tree-node i {
  margin-left: 8px;
  visibility: hidden;
}
.el-tree-node__content:hover i {
  visibility: visible;
}
</style>
