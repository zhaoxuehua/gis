import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
export const useTrackListStore = defineStore({
  id: "trackList",
  state: () => ({
    data: [] as any[]
  }),
  actions: {
    addData(arg: any) {
      // 如果不存在在加入
      arg.viewHide = true; // 增加一个属性
      const res = this.data.find(val => val.code == arg.code); // 重复性判断
      !res && this.data.push(arg);
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
