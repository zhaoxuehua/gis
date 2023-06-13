export const authMenuList = [
  {
    path: "/home/index",
    name: "home",
    component: "/home/index",
    meta: {
      icon: "HomeFilled",
      title: "首页",
      isLink: "",
      isHide: false,
      isFull: false,
      isAffix: true,
      isKeepAlive: true
    }
  },
  {
    path: "/GISConfig",
    name: "GISConfig",
    redirect: "/GISConfig/layerConfig",
    meta: {
      icon: "Menu",
      title: "GIS配置",
      isLink: "",
      isHide: false,
      isFull: false,
      isAffix: false,
      isKeepAlive: true
    },
    children: [
      {
        path: "/GISConfig/layerConfig",
        name: "layerConfig",
        component: "/GISConfig/layerConfig/index",
        meta: {
          icon: "Menu",
          title: "图层配置",
          isLink: "",
          isHide: false,
          isFull: false,
          isAffix: false,
          isKeepAlive: true
        }
      },
      {
        path: "/GISConfig/labelTypeConfig",
        name: "labelTypeConfig",
        component: "/GISConfig/labelTypeConfig/index",
        meta: {
          icon: "Menu",
          title: "标签类型配置",
          isLink: "",
          isHide: false,
          isFull: false,
          isAffix: false,
          isKeepAlive: true
        }
      },
      {
        path: "/GISConfig/labelConfig",
        name: "labelConfig",
        component: "/GISConfig/labelConfig/index",
        meta: {
          icon: "Menu",
          title: "标签信息",
          isLink: "",
          isHide: false,
          isFull: false,
          isAffix: false,
          isKeepAlive: true
        }
      },
      {
        path: "/GISConfig/mapParamsConfig",
        name: "mapParamsConfig",
        component: "/GISConfig/mapParamsConfig/index",
        meta: {
          icon: "Menu",
          title: "地图参数配置",
          isLink: "",
          isHide: false,
          isFull: false,
          isAffix: false,
          isKeepAlive: true
        }
      }
    ]
  }
];
