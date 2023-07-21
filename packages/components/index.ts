import * as components from "./src/index";
export * from "./src/index";
import { App } from "vue";
import pinia from "./src/stores/index";

export default {
  install: (app: App) => {
    app.use(pinia);
    for (const c in components) {
      app.use(components[c as keyof typeof components]);
    }
  }
};
