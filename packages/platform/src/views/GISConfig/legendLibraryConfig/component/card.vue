<template>
  <div>
    <el-card class="legend-card">
      <el-container>
        <el-header class="header-card">
          <div class="title">
            <el-tooltip effect="light" :content="info.legendName" placement="top-start">
              {{ info.legendName }}
            </el-tooltip>
          </div>
        </el-header>
        <el-main class="main-card">
          <div class="image-container">
            <el-upload action="#" :show-file-list="false" disabled>
              <div>
                <img :src="`/backend1/equip/gisLabel/type/getAllPathByFileName/${info?.legendPath}`" alt="" />
                <div class="upload-image-btn">
                  <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPLegendCONFIG_EDIT">
                    <span @click="editLegend">
                      <Icon src="EditPen" :size="16"></Icon>
                    </span>
                  </Auth>
                  <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPLegendCONFIG_DELETE">
                    <span @click="deleteLegend">
                      <Icon src="Delete" :size="16"></Icon>
                    </span>
                  </Auth>
                </div>
              </div>
            </el-upload>
          </div>
        </el-main>
      </el-container>
    </el-card>
    <CreateEditLegend ref="createEditLegend" @success-add="onReSearch"></CreateEditLegend>
  </div>
</template>

<script lang="ts" setup name="Card">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteLegendConfig } from "@/api/visconfig.js";
import CreateEditLegend from "./createEditLegend.vue";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  },
  research: {
    type: Function
  }
});
const emit = defineEmits(["successAdd"]);
const createEditLegend = ref();

const editLegend = () => {
  createEditLegend.value.openDialog(props?.info);
};
const deleteLegend = () => {
  ElMessageBox.confirm("确定删除?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const res: { [key: string]: any } = await deleteLegendConfig(props?.info?.id);
      if (res.code == 200) {
        ElMessage.success("删除成功");
        // 重新请求列表
        emit("successAdd");
      } else {
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {
      ElMessage.info("已取消操作");
    });
};

const onReSearch = () => {
  emit("successAdd");
};
</script>

<style lang="scss" scoped>
.legend-card {
  width: 200px;
  height: 230px;
  .header-card {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    .title {
      margin: auto;
      overflow: hidden;
      font-weight: bold;
      text-overflow: ellipsis; /* 设置省略号 */
      white-space: nowrap; /* 防止文字换行 */
    }
  }
  .main-card {
    position: relative;
    display: flex;
    height: 150px;
    padding: 20px;
    margin-top: 5px;
    overflow: hidden;
    cursor: pointer;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    .image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: auto;
    }
    .image-container img {
      width: 100px;
      height: 100px;
      margin: auto;
      object-fit: scale-down;
    }
    .upload-image-btn {
      position: absolute;
      top: 0;
      left: 0;
      display: inline-flex !important;
      align-items: center;
      justify-content: space-evenly !important;
      width: 100%;
      height: 100%;
      font-size: 20px;
      color: #ffffff;
      cursor: default;
      background-color: rgba($color: #000000, $alpha: 50%);
      opacity: 0;
      transition: opacity 0.3s;
      &:hover {
        opacity: 1;
      }
      span {
        display: inline-flex;
        cursor: pointer;
      }
      .svg-icon {
        font-size: 20px;
      }
    }
  }
}
</style>
