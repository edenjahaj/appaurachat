import { W as jsxRuntimeExports } from "./server-U61-uJh3.js";
import { C as ConversationList } from "./ConversationList-BYTY9QYc.js";
import { M as MessageCircle } from "./message-circle-C2SfUIBS.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./router-CYx1i6QQ.js";
import "./Avatar-CxBchUvZ.js";
import "./plus-7Bfs70-e.js";
import "./star-BsOXsYFc.js";
import "./formatDistanceToNowStrict-DBgh6Ve6.js";
import "./en-US-CqQV4g4D.js";
function AppHome() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:w-[360px] border-r border-border flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConversationList, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:flex flex-1 items-center justify-center bg-[image:linear-gradient(180deg,var(--color-background),var(--color-secondary))]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-sm px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto size-20 rounded-3xl bg-[image:var(--gradient-aurora)] grid place-items-center mb-4 shadow-[var(--shadow-soft)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-10 text-white" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Welcome to AURA" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Select a conversation, find someone new, or share a story." })
    ] }) })
  ] });
}
export {
  AppHome as component
};
