import { Login } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import { authMenuList } from "@/constant/authMenuList";
import { USER_BTNS_AUTH } from "@/constant/authButtonList";
import http from "@/api";

/**
 * @name 登录模块
 */
// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  return http.post<Login.ResLogin>(PORT1 + `/login`, params, { noLoading: true });
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  if (window.__POWERED_BY_WUJIE__) {
    console.log(window.$wujie.props?.authMenuList);
    return window.$wujie.props?.authMenuList;
  } else {
    return authMenuList;
  }
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  if (window.__POWERED_BY_WUJIE__) {
    console.log(window.$wujie.props?.authButtonList);
    return window.$wujie.props?.authButtonList;
  } else {
    return USER_BTNS_AUTH;
  }
};

// 用户户退出登录
export const logoutApi = () => {
  return http.post(PORT1 + `/logout`);
};
