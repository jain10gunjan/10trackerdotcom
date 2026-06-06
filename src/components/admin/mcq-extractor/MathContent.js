"use client";

import { useEffect, useMemo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

export const MATHJAX_CONFIG = {
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
  },
  messageStyle: "none",
  showMathMenu: false,
};

function convertLatexTags(text) {
  if (!text) return text;
  return String(text)
    .replace(/\[latex\]/g, "$")
    .replace(/\[\/latex\]/g, "$");
}

export function MathHtml({ html, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  const normalizedHtml = useMemo(() => convertLatexTags(html), [html]);

  useEffect(() => {
    if (!ref.current || !normalizedHtml || typeof window === "undefined") return;
    const node = ref.current;
    const id = setTimeout(() => {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([node]).catch(() => {});
      }
    }, 50);
    return () => clearTimeout(id);
  }, [normalizedHtml]);

  if (!normalizedHtml) return null;
  return (
    <MathJax inline dynamic>
      <Tag
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: normalizedHtml }}
      />
    </MathJax>
  );
}

export function McqMathProvider({ children }) {
  return <MathJaxContext config={MATHJAX_CONFIG}>{children}</MathJaxContext>;
}
