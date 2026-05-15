// ==========================================
// FAMILY TREE CANVAS COMPONENT
// 3D Canvas wrapper for React Three Fiber
// ==========================================

import React, { Suspense } from "react";

// Placeholder until React Three Fiber is set up
// This will be implemented in the web app

interface FamilyTreeCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

export function FamilyTreeCanvas({ children, className = "" }: FamilyTreeCanvasProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-b from-sky-100 to-sky-200 ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        {children || <PlaceholderContent />}
      </Suspense>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading 3D Tree...</p>
      </div>
    </div>
  );
}

function PlaceholderContent() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center p-8 bg-white/80 rounded-xl shadow-lg">
        <div className="text-6xl mb-4">🌳</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">3D Family Tree</h3>
        <p className="text-gray-600">
          Your family tree will be rendered here with infinite zoom and branching.
        </p>
      </div>
    </div>
  );
}