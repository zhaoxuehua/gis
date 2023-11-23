import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { useGisStore } from "./gis";

export const useTrackListStore = defineStore({
  id: "trackList",
  state: () => ({
    data: [] as any[]
  }),
  actions: {
    addData(arg: any) {
      const gisStore = useGisStore();
      // 如果不存在在加入
      arg.viewHide = true; // 增加一个属性
      const hasIndex = this.data?.findIndex(val => val.code == arg.code);
      // 重复了需要更新数据
      if (hasIndex !== -1) {
        this.data[hasIndex] = arg;
        gisStore?.updateTrackColor(arg?.color, "add");
      } else {
        this.data?.push(arg); // 没重复时添加进列表
      }

      if (this.data.length > 5) {
        //如果插入后大于5条，删除该条
        this.data.pop();
        ElMessage.warning("轨迹列表最多5条");
        return false;
      } else {
        return true;
      }
    }
  }
});
