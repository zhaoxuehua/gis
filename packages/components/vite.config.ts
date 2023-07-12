import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import DefineOptions from "unplugin-vue-define-options/vite";
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
  build: {
    //压缩
    //minify: false,
    rollupOptions: {
      //忽略不需要打包的文件
      external: ["vue"],
      input: ["index.ts"],
      output: [
        {
          //打包格式
          format: "es",
          //打包后文件名
          entryFileNames: "[name].mjs",
          //让打包目录和我们目录对应
          preserveModules: true,
          exports: "named",
          //配置打包根目录
          dir: "../agmap/es"
        },
        {
          //打包格式
          format: "cjs",
          //打包后文件名
          entryFileNames: "[name].js",
          //让打包目录和我们目录对应
          preserveModules: true,
          exports: "named",
          //配置打包根目录
          dir: "../agmap/lib"
        }
      ]
    },
    lib: {
      entry: "./index.ts",
      name: "agmap"
    }
  },
  plugins: [
    vue(),
    dts({
      entryRoot: "src",
      outputDir: ["../agmap/es/src", "../agmap/lib/src"],
      //指定使用的tsconfig.json为我们整个项目根目录下,如果不配置,你也可以在components下新建tsconfig.json
      tsConfigFilePath: "./tsconfig.json"
    }),
    DefineOptions()
  ]
});
