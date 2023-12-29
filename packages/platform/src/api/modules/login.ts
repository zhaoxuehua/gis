import { Login } from "@/api/interface/index";
import { authMenuList } from "@/constant/authMenuList";
import { USER_BTNS_AUTH } from "@/constant/authButtonList";
import http from "@/api";

/**
 * @name 登录模块
 */
// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  return http.post<Login.ResLogin>(`/login`, params, { noLoading: true });
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
