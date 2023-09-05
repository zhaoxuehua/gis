import { defineStore } from "pinia";
function getLocalStorage() {
  let shipHeadLine: boolean | string | null = localStorage.getItem("shipTags");
  if (shipHeadLine) {
    shipHeadLine = JSON.parse(shipHeadLine)[1];
  }
  return Boolean(shipHeadLine);
}
export const useToolboxStore = defineStore({
  id: "toolbox",
  state: () => ({
    data: getLocalStorage()
  }),
  actions: {
    changeData(arg: boolean) {
      this.data = arg;
    }
  }
});
