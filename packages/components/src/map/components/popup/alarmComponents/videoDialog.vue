<template>
  <div>
    <el-dialog
      title="视频"
      v-model="state.open"
      width="1000px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <div class="monitor-alarm-video-dialog">
        <div class="monitor-alarm-video-dialog-tree">
          <el-tree :data="state?.data" :props="state.defaultProps" @node-click="handleNodeClick"></el-tree>
        </div>

        <div class="monitor-alarm-video-dialog-video" ref="fullVideoRef">
          <div class="video" v-show="state?.src">
            <video
              ref="videoRef"
              style="width: 100%; height: 100%"
              :src="state?.src"
              class="videoClass"
              autoplay
              id="h5sVideo1"
              controls
            ></video>
          </div>

          <div class="palyBackContrls" v-if="state?.src">
            <!-- 播放 -->
            <div class="footer-item-icon" title="播放" @click="playPause('play')" v-if="state?.videoStatus == 'pause'">
              <Icon src="VideoPlay" :size="14"></Icon>
            </div>
            <!-- 暂停 -->
            <div class="footer-item-icon" title="停止" @click="playPause('pause')" v-if="state?.videoStatus == 'play'">
              <Icon src="VideoPause" :size="14"></Icon>
            </div>
            <!-- 重新加载 -->
            <div class="footer-item-icon" title="重新加载" @click="reStartEvent">
              <Icon src="RefreshLeft" :size="14"></Icon>
            </div>
            <!-- 全屏 -->
            <div class="footer-item-icon" title="全屏" @click="onFullScreen">
              <Icon src="FullScreen" :size="14"></Icon>
            </div>
            <el-select v-model="state.seekVal" size="small" class="speed" style="width: 100px">
              <el-option label="0.5" value="0.5"></el-option>
              <el-option label="1.0" value="1.0"></el-option>
              <el-option label="2.0" value="2.0"></el-option>
              <el-option label="4.0" value="4.0"></el-option>
              <el-option label="8.0" value="8.0"></el-option>
              <el-option label="16.0" value="16.0"></el-option>
            </el-select>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import Icon from "../../Icon.vue";
import { cameraList } from "../../../../api/device";

const state: {
  open: any;
  row: any;
  defaultProps: any;
  data: any;
  videoStatus: any;
  src: any;
  seekVal: any;
  sockEvent: any;
  currentNode: any;
} = reactive({
  open: false,
  row: null,
  defaultProps: {
    children: "children",
    label: "cameraName"
  },
  data: [],
  videoStatus: "play",
  src: "",
  seekVal: 1.0,
  sockEvent: null,
  currentNode: null
});

const videoRef = ref();
const fullVideoRef = ref();

const openDialog = (row: any) => {
  state.open = true;
  state.row = row;
  state.src = "";
  initList();
};

const onClose = () => {
  state.open = false;
};

const handleNodeClick = (node: any) => {
  videoRef.value && videoRef.value.pause();
  state.src = node.fileName;
  state.currentNode = node;
  state.seekVal = 1.0;
  videoRef.value.currentTime = 0;
  setTimeout(() => {
    videoRef.value && videoRef.value.play();
    state.videoStatus = "play";
  });
};

const playPause = (type: any) => {
  state.videoStatus = type;
  if (type == "play") {
    // 播放
    videoRef.value && videoRef.value.play();
  } else if (type == "pause") {
    // 暂停
    videoRef.value && videoRef.value.pause();
  }
};

// 全屏
const onFullScreen = () => {
  const documentElement = document as Document & {
    webkitFullscreenEnabled: boolean;
    webkitFullscreenElement: Element | null;
    webkitExitFullscreen: () => void;
    webkitRequestFullscreen: () => void;
    mozFullScreenEnabled: boolean;
    mozFullScreenElement: Element | null;
    msFullscreenEnabled: boolean;
    msFullscreenElement: Element | null; // 修正此处属性名
  };

  if (
    documentElement?.fullscreenEnabled ||
    documentElement?.webkitFullscreenEnabled ||
    documentElement?.mozFullScreenEnabled ||
    documentElement?.msFullscreenEnabled
  ) {
    if (
      documentElement?.fullscreenElement ||
      documentElement?.webkitFullscreenElement ||
      documentElement?.mozFullScreenElement ||
      documentElement?.msFullscreenElement
    ) {
      if (document?.exitFullscreen) {
        document?.exitFullscreen();
      } else if (documentElement?.webkitExitFullscreen) {
        documentElement?.webkitExitFullscreen();
      }
    } else {
      const element = fullVideoRef.value;
      if (element?.requestFullscreen) {
        element?.requestFullscreen();
      } else if (element?.webkitRequestFullscreen) {
        element?.webkitRequestFullscreen();
      }
    }
  } else {
    ElMessage.error("您的浏览器不支持全屏!");
  }
};

// 重新播放
const reStartEvent = () => {
  videoRef.value.currentTime = 0;
  videoRef.value && videoRef.value.play();
  state.videoStatus = "play";
};

const initList = async () => {
  const res: any = await cameraList(state.row.mid);
  if (res.code == 200) {
    state.data = res.data;
  }
};

watch(
  () => state.seekVal,
  val => {
    videoRef.value.playbackRate = val;
  },
  {
    deep: true
  }
);
defineExpose({
  openDialog
});
</script>

<style lang="scss">
.monitor-alarm-video-dialog {
  display: flex;
  width: 100%;
  height: 400px;
}
.monitor-alarm-video-dialog-tree {
  width: 250px;
  height: 400px;
}
.monitor-alarm-video-dialog-video {
  width: calc(100% - 250px);
  height: 400px;
}
.monitor-alarm-video-dialog-video .video {
  position: relative;
  width: 100%;
  height: calc(100% - 40px);
}
.monitor-alarm-video-dialog-video .palyBackContrls {
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
}
.footer-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  color: var(--el-color-primary);
  cursor: pointer;
  border: 1px solid var(--el-color-primary);
}
.monitor-alarm-video-dialog-video .video .opt-fullscreen {
  position: absolute;
  top: 0;
  z-index: 1;
  display: flex;
  align-content: center;
  justify-content: flex-end;
  width: 100%;
  height: 30px;
  padding: 5px 0;
  font-size: 20px;
}
.monitor-alarm-video-dialog-video .video .opt-fullscreen i {
  margin-right: 10px;
  color: var(--el-color-primary);
  cursor: pointer;
  visibility: hidden;
}
.monitor-alarm-video-dialog-video .video:hover {
  i {
    visibility: visible;
  }
}
.videoClass {
  object-fit: fill;
}
</style>
