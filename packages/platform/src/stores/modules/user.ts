import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";

export const useUserStore = defineStore({
  id: "gis-user",
  state: (): UserState => ({
    token: "",
    userInfo: { name: "admin" }
  }),
  getters: {},
  actions: {
    // Set Token
    setToken(token: string) {
      this.token = token;
    },
    // Set setUserInfo
    setUserInfo(userInfo: UserState["userInfo"]) {
      this.userInfo = userInfo;
    }
  }
});
