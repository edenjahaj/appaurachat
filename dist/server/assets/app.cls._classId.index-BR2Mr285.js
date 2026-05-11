import { W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { i as Route, N as Navigate } from "./router-CYx1i6QQ.js";
import { C as ChannelRail } from "./ChannelRail-Hgsponse.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./useLocation-Chz8CjD_.js";
import "./arrow-left-D1Xbmolz.js";
import "./sparkles-C84uWSkY.js";
import "./graduation-cap-Dkf2mlZQ.js";
import "./megaphone-B00_iPIF.js";
function ClassIndex() {
  const {
    classId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelRail, { classId, className: "md:hidden" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/app/cls/$classId/$channelSlug", params: {
      classId,
      channelSlug: "general"
    }, replace: true })
  ] });
}
export {
  ClassIndex as component
};
