"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={className}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        border: "none",
        outline: "none",
        padding: 2,
        transition: "background 0.2s",
        background: props.checked ? "#26A17B" : "#1A2235",
        boxShadow: props.checked ? "0 0 8px rgba(38,161,123,0.3)" : "inset 0 1px 3px rgba(0,0,0,0.3)",
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: props.checked ? "#FFFFFF" : "#4A5A70",
          transition: "transform 0.2s, background 0.2s",
          transform: props.checked ? "translateX(20px)" : "translateX(0px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
