"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  // 값에 따른 색상 그라디언트 (초록→노랑→빨강)
  const pct = _values[0] !== undefined ? (((_values[0] ?? min) - min) / (max - min)) * 100 : 50;
  const trackColor = pct < 40 ? "#26A17B" : pct < 70 ? "#FBBF24" : "#EF4444";

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        style={{
          position: "relative",
          width: "100%",
          height: 8,
          borderRadius: 4,
          background: "#1A2235",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
        }}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          style={{
            position: "absolute",
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, #26A17B, ${trackColor})`,
            boxShadow: `0 0 8px ${trackColor}40`,
          }}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          style={{
            display: "block",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFF, #E0E0E0)",
            border: `3px solid ${trackColor}`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${trackColor}30`,
            cursor: "grab",
            outline: "none",
          }}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
