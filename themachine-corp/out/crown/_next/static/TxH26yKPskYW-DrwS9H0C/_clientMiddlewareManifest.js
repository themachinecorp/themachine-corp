self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/crown(?:\\/(_next\\/data\\/[^/]{1,}))?\\/_auth(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/_auth"
  },
  {
    "regexp": "^\\/crown(?:\\/(_next\\/data\\/[^/]{1,}))?\\/_auth\\/(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/_auth/"
  },
  {
    "regexp": "^\\/crown(?:\\/(_next\\/data\\/[^/]{1,}))?\\/auth\\/callback(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/auth/callback"
  },
  {
    "regexp": "^\\/crown(?:\\/(_next\\/data\\/[^/]{1,}))?\\/auth\\/callback\\/(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/auth/callback/"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()