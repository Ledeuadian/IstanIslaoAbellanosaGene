// ==========================================
// RELATIONSHIP LINE COMPONENT
// For SVG-based relationship lines
// ==========================================

import React from "react";

interface RelationshipLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type?: "parent" | "spouse" | "sibling";
  dashed?: boolean;
  className?: string;
}

const typeColors = {
  parent: "#059669",   // Green for parent-child
  spouse: "#8B5CF6",   // Purple for marriage
  sibling: "#6366F1",  // Indigo for siblings
};

export function RelationshipLine({
  x1,
  y1,
  x2,
  y2,
  type = "parent",
  dashed = false,
  className = "",
}: RelationshipLineProps) {
  const color = typeColors[type];
  const strokeDasharray = dashed ? "8 4" : undefined;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={2}
      strokeDasharray={strokeDasharray}
      className={className}
    />
  );
}