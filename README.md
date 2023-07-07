# ADM-GIS-UI

### 介绍

本项目是 GIS 基础引擎平台，包括 GIS 配置服务平台和地图组件库两个子项目，更多信息请移步： [GIS 基础引擎概要设计](https://ones.cn/wiki/#/team/EfNEn1EW/space/UbE5YW9t/page/WMZ6Fcdw)

### 目录

本项目是基于`pnpm + changesets`的`Monorepo`项目，`packages`中包含 2 个子项目，分别是 GIS 配置平台`platform`和地图组件库`components`。

```text
├─.changeset
├─.husky
├─.vscode
├─packages
│  ├─agmap                # 用于发布的组件包
│  ├─components           # 地图组件源代码
│  └─platform             # GIS平台源代码
├─ scripts
├─ .eslintignore          # 忽略 Eslint 校验
├─ .eslintrc.cjs          # Eslint 校验配置文件
├─ .gitignore             # 忽略 git 提交
├─ .prettierignore        # 忽略 Prettier 格式化
├─ .prettierrc.cjs        # Prettier 格式化配置
├─ .stylelintignore       # 忽略 stylelint 格式化
├─ .stylelintrc.cjs       # stylelint 样式格式化配置
├─ LICENSE                # 开源协议文件
├─ lint-staged.config.cjs # lint-staged 配置文件
├─ package.json           # 依赖包管理
├─ pnpm-workspace.yaml    # workspace配置文件
├─ postcss.config.cjs     # postcss 配置
├─ README.md              # README 介绍
└─ sconfig.json          # typescript 全局配置

```

### 开发

1. 安装依赖，根目录执行

```bash
pnpm install
```

2. 运行开发环境，根目录执行

```bash
pnpm run dev
```

实际是执行`platform`中`pnpm run dev`，

3. 构建打包，根目录执行`pnpm run build`，会依次打包`components`和`platform`2 个子项目

```bash
pnpm run build
```

### 发布版本

1. 生成 changeset 文件

- 根目录执行 `pnpm changeset`，选择本版类型（`patch`、`minor`、`major`，严格遵循 [semver](https://semver.org/) 规范），填写 `changelog` 后，会生成 `changeset` 文件
- 执行 `pnpm changeset version` 修改包的版本
- 执行 `pnpm install` 更新 lock 文件
- 执行 `git commit -a` 提交代码

2. 将地图组件发布到私有仓库步骤如下（发包详细步骤可参考：[​ 私有 npm 组件发布流程 ​](https://ones.cn/wiki/#/team/EfNEn1EW/page/AoaScqZU)）：

- 切换 npm 镜像地址为发布专用的 `releases` 地址
- 用户登录
- 命令行进入 `packages/agmap` 中，执行 `npm publish`
- 发布成功再将 npm 镜像地址切换为 `public`

3. 发布成功后，可在仓库中查找到刚发布的版本：http://192.168.15.94:8081/#browse/search/npm
