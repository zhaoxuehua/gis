import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";

export const useUserStore = defineStore({
  id: "gis-user",
  state: (): UserState => ({
    token: "569_f6e85cd020c94276af8cbfb57eafc594",
    userInfo: { name: "admin" }
  }),
  getters: {},
  actions: {
    // Set Token
    setToken(token: string) {
      this.token = token;
      localStorage.setItem("sessionId", token);
    },
    // Set setUserInfo
    setUserInfo(userInfo: UserState["userInfo"]) {
      this.userInfo = userInfo;
    }
  }
});
