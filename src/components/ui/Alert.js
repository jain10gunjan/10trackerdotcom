"use client";

import { useState } from "react";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const baseStyles = {
  info: "text-blue-800 bg-blue-50 ",
  success: "text-green-800 bg-green-50 ",
  warning: "text-yellow-800 bg-yellow-50 ",
  error: "text-red-800 bg-red-50",
};

export default function Alert({
  type = "info",
  message,
  linkText,
  linkHref = "#",
  dismissible = true,
}) {
  const [visible, setVisible] = useState(true);
  const Icon = iconMap[type] || Info;
  const style = baseStyles[type];

  if (!visible) return null;

  return (
    <div
      className={`flex items-center p-4 mb-4 rounded-lg ${style}`}
      role="alert"
    >
      <Icon className="shrink-0 w-4 h-4" />
      <span className="sr-only">{type}</span>
      <div className="ms-3 text-sm font-medium">
        {message}{" "}
        {linkText && (
          <a
            href={linkHref}
            className="font-semibold underline hover:no-underline"
          >
            {linkText}
          </a>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          type="button"
          className="ms-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
