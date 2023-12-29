export type AsideThemeType = "dark";

export const asideTheme: Record<AsideThemeType, { [key: string]: string }> = {
  dark: {
    "--el-menu-bg-color": "#1c2f38",
    "--el-sub-menu-bg-color": "var(--el-color-primary-dark-9)",
    "--el-menu-hover-bg-color": "var(--el-color-primary-dark-6)",
    "--el-menu-active-bg-color": "var(--el-color-primary)",
    "--el-menu-text-color": "#ffffff",
    "--el-menu-active-color": "#ffffff",
    "--el-menu-hover-text-color": "#ffffff"
  }
};
