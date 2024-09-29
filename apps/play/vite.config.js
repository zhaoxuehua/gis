import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import "./vite.init";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../packages/components/src", import.meta.url))
    }
  },
  define: { "process.env": {} },
  server: {
    open: true,
    port: 3000, // 启动端口号
    host: "0.0.0.0",
    proxy: {
      "/api": {
        // 请求接口中要替换的标识
        target: "http://192.168.15.27:8080", // 代理地址
        changeOrigin: true, // 是否允许跨域
        rewrite: path => path.replace(/^\/api/, "")
      },
      // '/ws': 'http://192.168.15.27',
      "/ws": {
        // 请求接口中要替换的标识
        // target: 'http://192.168.10.164:3500', // 代理地址
        target: "http://10.233.22.59:8080", // 代理地址
        changeOrigin: true // 是否允许跨域
      }
    }
  },
  build: {
    sourcemap: true
  }
});
