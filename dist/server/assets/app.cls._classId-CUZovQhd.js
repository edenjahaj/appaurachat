import { W as jsxRuntimeExports, a1 as Outlet } from "./server-U61-uJh3.js";
import { C as ChannelRail } from "./ChannelRail-Hgsponse.js";
import { g as Route } from "./router-CYx1i6QQ.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./useLocation-Chz8CjD_.js";
import "./arrow-left-D1Xbmolz.js";
import "./sparkles-C84uWSkY.js";
import "./graduation-cap-Dkf2mlZQ.js";
import "./megaphone-B00_iPIF.js";
function ClassLayout() {
  const {
    classId
  } = Route.useParams();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelRail, { classId, className: "hidden md:flex" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] });
}
export {
  ClassLayout as component
};
