import { W as jsxRuntimeExports } from "./server-U61-uJh3.js";
const palettes = [
  "linear-gradient(135deg, oklch(0.7 0.2 295), oklch(0.7 0.2 220))",
  "linear-gradient(135deg, oklch(0.75 0.18 30), oklch(0.65 0.22 350))",
  "linear-gradient(135deg, oklch(0.65 0.18 220), oklch(0.55 0.2 260))",
  "linear-gradient(135deg, oklch(0.65 0.18 150), oklch(0.55 0.2 200))",
  "linear-gradient(135deg, oklch(0.78 0.16 340), oklch(0.78 0.16 50))"
];
function Avatar({ name, src, size = 40, className = "" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  const bg = palettes[h % palettes.length];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `relative shrink-0 rounded-full overflow-hidden grid place-items-center text-white font-semibold ${className}`,
      style: { width: size, height: size, background: bg, fontSize: size * 0.4 },
      children: src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, className: "size-full object-cover" }) : initial
    }
  );
}
export {
  Avatar as A
};
