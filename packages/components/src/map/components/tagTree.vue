<!-- 标签树部分（点击、编辑、新增、删除） -->
<template>
  <div class="tag-tree">
    <div class="title">
      <div>
        <span>标签树</span>
        <el-button type="primary" size="small" circle class="title-btn" @click.stop="onImport"
          ><Icon src="Upload" title="导入" :size="14"></Icon
        ></el-button>
        <el-button type="primary" size="small" circle class="title-btn" @click.stop="onExport"
          ><Icon src="Download" title="导出" :size="14"></Icon
        ></el-button>
      </div>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="tag-tree-content">
      <el-input
        placeholder="输入关键字进行过滤"
        v-model="state.filterText"
        clearable
        @keyup.enter="treeSearch"
        class="tag-tree-content-filter"
      >
      </el-input>
      <div class="tree-content">
        <el-tree
          :data="tagTreeData"
          :props="state.defaultProps"
          @node-click="handleNodeClick"
          :filter-node-method="filterNode"
          ref="treeRef"
          :expand-on-click-node="false"
          :default-expanded-keys="state.expandedKeys"
          node-key="code"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ data.name }}</span>
              <!-- 父节点可以新增即只有标签类型可以新增（子节点可以修改删除） -->
              <Icon src="Plus" :size="14" @click="onAdd(node, data)" v-if="data.isParent"></Icon>
              <Icon src="EditPen" :size="14" v-if="!data.isParent" @click.stop="onEdit(node, data)"></Icon>
              <Icon src="Delete" :size="14" v-if="!data.isParent" @click.stop="onDelete(node, data)"></Icon>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
  <UploadMainFileDialog ref="uploadMainFilRef" :fileTitle="'导入标签信息文件'" sceneCode="gisLabel"></UploadMainFileDialog>
</template>
<script lang="ts" setup>
import { computed, reactive, watch, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useGisStore } from "../../stores/modules/gis";
import type { VisualMap } from "../type";
import { removeLabel, createLabel, labelOnSelect } from "../hooks/index";
import Icon from "./Icon.vue";
import UploadMainFileDialog from "./uploadFile/uploadMainFile.vue";
import { fileNameMap, useExportExcel } from "./uploadFile/uploadFun";
import { tableDataExport } from "../../api/gis";

const gisStore = useGisStore();
const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onEditLabel", "onClose"]);
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
  formData.append("sceneCode", "gisLabel");
  formData.append("queryStr", JSON.stringify({ gisLabelInfoVo: { appId: gisStore?.mapIdentificationConfig?.mapParams } }));
  try {
    const res: any = await tableDataExport(formData);
    if (res?.code == 200) {
      useExportExcel(res?.data, `${fileNameMap["gisLabelExport"]}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// 关闭标签树
const onClose = () => {
  emits("onClose", props.index);
};
// 标签树数据源（需要的数据labelTypeMap   labelInfoMap  拼接节点与子节点 ）
const tagTreeData = computed(() => {
  if (!props.map) {
    return;
  }
  const labelTypeMap = props.map?.get("labelTypeMap") || {};
  const labelInfoMap = props.map?.get("labelInfoMap") || {};
  let tree: any = [];
  Object.entries(labelTypeMap)?.forEach(([key, object]: any) => {
    // 过滤是否挂载标签树的逻辑
    if (object.isHang) {
      const node = {
        ...object,
        pId: 0,
        isParent: true,
        children: []
      };
      Object.entries(labelInfoMap)?.forEach((labelInfo: any) => {
        let item = labelInfo[1];
        if (item?.labelType?.code == key) {
          node.children.push(item);
        }
      });
      tree.push(node);
    }
  });
  return tree;
});

const treeSearch = () => {
  treeRef.value.filter(state.filterText);
};
const filterNode = (value: any, data: any) => {
  if (!value) return true;
  return data.name.indexOf(value) !== -1;
};

// 树节点点击(定位+选中)
const handleNodeClick = (node: any) => {
  labelOnSelect(props.map, node.code, false);
};

const timer: any = ref(null);
// 编辑
const onEdit = (node: { [key: string]: any }, data: { [key: string]: any }) => {
  getParentNode(node);
  emits("onEditLabel", data.code);
  timer.value = setTimeout(() => {
    labelOnSelect(props.map, data.code, false);
    clearTimeout(timer);
    timer.value = null;
  }, 200);
};

// 删除
const onDelete = (node: { [key: string]: any }, data: { [key: string]: any }) => {
  getParentNode(node);
  const labelInfoMap = props.map?.get("labelInfoMap") || {};
  const label = labelInfoMap[data.code];
  if (!label) {
    ElMessage.warning("标签不存在");
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
const onAdd = (node: { [key: string]: any }, data: { [key: string]: any }) => {
  if (!data.id) return;
  const parentNodeCode = node?.data?.code;
  if (parentNodeCode) {
    state.expandedKeys = [parentNodeCode];
  }
  const labelTypeMap = props.map?.get("labelTypeMap") || {};
  let featureType: any;
  Object.values(labelTypeMap).forEach((labelInfo: any) => {
    if (labelInfo.id == data.id) {
      featureType = labelInfo;
      return;
    }
  });
  createLabel(props.map, featureType, true, function (result: any, feature: any, drawFeature: any) {
    if (!result) {
      ElMessage.error("新增标签失败");
      return;
    }
    // 创建成功后的回调逻辑
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
  });
};

// 查找父节点并存储展开节点
const getParentNode = (node: { [key: string]: any }) => {
  // 找父节点塞数据
  const parentNode: { [key: string]: any } = node.parent;
  const parentNodeCode: string | undefined = parentNode?.data?.code;
  if (parentNodeCode) {
    state.expandedKeys = [parentNodeCode];
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
.tag-tree {
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
  .tag-tree-content {
    height: calc(100% - 60px);
    padding: 0 20px;
    .tag-tree-content-filter {
      width: 100%;
      margin: 20px 0;
    }
    .tree-content {
      height: calc(100% - 92px);
      .custom-tree-node {
        display: flex;
        align-items: center;
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
