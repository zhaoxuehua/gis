import { defineStore } from "pinia";
import type { toolboxDataType } from "../../map/type";
export const useToolboxStore = defineStore({
  id: "toolbox",
  state: () => ({
    data: [] as toolboxDataType
  }),
  actions: {
    changeData(arg: toolboxDataType) {
      this.data = arg;
    }
  }
});
