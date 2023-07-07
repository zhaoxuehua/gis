# AgMap 地图组件库

基于 `Vue3 + Openlayers` 开发，服务内部各业务平台的地图组件库。

## 使用

安装

```bash
pnpm install @adm-gis-ui/agmap
```

用法

```javascript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import Agmap from "@adm-gis-ui/agmap";
import "@adm-gis-ui/agmap/es/style.css";

const app = createApp(App)

app.use(Agmap)
app.mount('#app')


// index.vue
<ag-map></ag-map>
```
