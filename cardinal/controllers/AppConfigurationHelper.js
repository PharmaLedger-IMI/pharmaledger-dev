const EVENT_PREFIX = "@event:";

export default class AppConfigurationHelper {


  static _prepareRoutesTree(menuPages, historyType) {
    let leafSearch = function (menu) {
      let tree = {};
      menu.forEach((leaf) => {
        let pageName = leaf.name.replace(/(\s+|-)/g, '').toLowerCase();

        if (!tree[pageName]) {
          let leafPath = leaf.path;
          switch (historyType) {
            case "browser":
            case "query":
              leafPath = leaf.path;
              break;
            case "hash":
              leafPath = "/#" + leaf.path;
              break;
          }
          tree[pageName] = {
            path: leafPath
          };
        }

        if (typeof leaf.children === 'object' && Array.isArray(leaf.children.items)) {
          tree[pageName].children = {type: "known", items: leafSearch(leaf.children.items)};
        }
        else if (typeof leaf.children === "string" && leaf.children.indexOf(EVENT_PREFIX) === 0) {
          let eventName = leaf.children.substring(EVENT_PREFIX.length);
          tree[pageName].children = {type: "event", event: eventName};
        }
      });
      return tree;
    };

    return leafSearch(menuPages);
  }


  static _prepareConfiguration(rawConfig, websiteBase) {

    let configuration = {};
    configuration.baseUrl = websiteBase;

    let basePagesUrl = websiteBase + rawConfig.basePagesUrl;

    if (rawConfig.modals) {
      configuration.modals = {};
      if (Object.keys(rawConfig.modals).length) {
        for (let key in rawConfig.modals) {
          configuration.modals[key] = basePagesUrl + rawConfig.modals[key];
        }
      }
    }

    if (!rawConfig.menu || !rawConfig.menu.defaultMenuConfig) {
      throw new Error("Default menu configuration is missing");
    }

    let defaultMenuConfig = rawConfig.menu.defaultMenuConfig;

    if (rawConfig.profile) {
      configuration.profile = rawConfig.profile;
    }

    let filterIndexedItems = function (menuItems) {
      for (let i = 0; i < menuItems.length; i++) {
        if (menuItems[i].children && menuItems[i].children.items) {
          filterIndexedItems(menuItems[i].children.items);
        } else {
          if (typeof menuItems[i].indexed !== "undefined" && menuItems[i].indexed.toString() === "false") {
            menuItems.splice(i, 1);
          }
        }
      }
      return menuItems;
    };

    let fillOptionalPageProps = function (navigationPages, pathPrefix) {
      navigationPages.forEach(page => {

        if (!page.path) {
          let pageName = page.name.toLowerCase();
          let pagePath = pageName.toLowerCase().replace(/\s+/g, '-');
          pagePath = pagePath.replace(/[:\/]/g, '');
          page.path = pagePath;
        }

        if (page.path.indexOf("/") !== 0) {
            page.path = "/" + page.path;
        }

        if (pathPrefix) {
          page.path = pathPrefix  + page.path;
        }

        if (page.children) {
          page.type = "abstract";
          if (!page.icon) {
            page.icon = defaultMenuConfig.icon;
          }
        } else {
          for (let prop in defaultMenuConfig) {
            if (!page.hasOwnProperty(prop)) {
              page[prop] = defaultMenuConfig[prop];
            }
          }

          if (page.component === "psk-page-loader") {
            if (!page.componentProps) {
              page.componentProps = {};
            }
            //page.componentProps.options = page.options;
            Object.assign(page.componentProps, page.options);
            if (page.pageSrc) {
              if (page.pageSrc.startsWith("http")) {
                page.componentProps.pageUrl = page.pageSrc;
              }
              else {
                page.componentProps.pageUrl = basePagesUrl + page.pageSrc;
              }
            } else {
              let filename = page.name.replace(/[:.!?]/g, "").replace(/\s/g, '-').toLowerCase();

              let prefix = "";
              if (pathPrefix) {
                prefix = pathPrefix.replace(/^\//, '');
              }
              page.componentProps.pageUrl = basePagesUrl + prefix + "/" + filename + ".html";
            }
          }
        }

        if (typeof page.children === "object" && Array.isArray(page.children)) {
          page.children = {type: "known", items: JSON.parse(JSON.stringify(page.children))};
          fillOptionalPageProps(page.children.items, page.path);
        }
        else {
          if (typeof page.children === "string" && page.children.indexOf(EVENT_PREFIX) == 0) {
            let eventName = page.children.substring(EVENT_PREFIX.length);
            page.children = {type: "event", event: eventName};
            page.component = "psk-ssapp-loader";
          }
        }
      });
      return navigationPages
    };

    configuration.routes = fillOptionalPageProps(rawConfig.menu.pages);

    configuration.historyType = "browser";
    let historyType = rawConfig.menu.defaultMenuConfig.historyType;
    if (historyType === "hash" ||
      historyType === "query") {
      configuration.historyType = historyType;
    }

    if (historyType === "query") {
      let pagePrefix = "?";
      if (rawConfig.menu.defaultMenuConfig.pagePrefix) {
        pagePrefix = rawConfig.menu.defaultMenuConfig.pagePrefix;
      }
      let addPathPrefix = function (pages) {
        pages.forEach(page => {
          let pagePath = page.path;
          if (pagePath.indexOf("/") === 0) {
            pagePath = pagePath.substr(1);
          }
          page.path = `${pagePrefix}${pagePath}`;
          if (page.children) {
            addPathPrefix(page.children.items);
          }
        });
      };
      addPathPrefix(configuration.routes);
    }

    let getPagesTags = function (routes) {
      let tagsDictionary = [];

      function iterateThroughRoutes(routes) {
        routes.forEach((route) => {
            if (Object.prototype.hasOwnProperty.call(route, 'tags')) {

              let routeTags = route['tags'].split(",").map(tag => tag.trim());

              routeTags.forEach((tag)=>{
                //we don't care if we overwrite a previous path
                tagsDictionary[tag] = route.path;
              })

            }
            if (typeof route.children === 'object' && Array.isArray(route.children.items)) {
              iterateThroughRoutes(route.children.items);
            }
          }
        )
      }

      iterateThroughRoutes(routes);

      return tagsDictionary;
    };

    let routes = JSON.parse(JSON.stringify(configuration.routes));
    configuration.menu = filterIndexedItems(routes);
    configuration.tags = getPagesTags(routes);
    configuration.pagesHierarchy = AppConfigurationHelper._prepareRoutesTree(configuration.routes, historyType);
    return configuration;
  }
}
