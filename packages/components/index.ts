import * as components from "./src/index";
export * from "./src/index";
import { App } from "vue";
import { createPinia } from "pinia";

// 创建Pinia实例
const pinia = createPinia();

export default {
  install: (app: App) => {
    app.use(pinia);
    for (const c in components) {
      app.use(components[c as keyof typeof components]);
    }
  }
};
