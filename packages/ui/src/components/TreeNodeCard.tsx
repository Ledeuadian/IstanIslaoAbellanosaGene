// ==========================================
// TREE NODE CARD COMPONENT
// Card displayed for each person in the tree
// ==========================================

import React from "react";
import type { Person } from "@tree/types";
import { PersonAvatar } from "./PersonAvatar";

interface TreeNodeCardProps {
  person: Person;
  zoomLevel?: "far" | "medium" | "close" | "profile";
  isExpanded?: boolean;
  hasChildren?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSelect?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function TreeNodeCard({
  person,
  zoomLevel = "medium",
  isExpanded = false,
  hasChildren = false,
  onExpand,
  onCollapse,
  onSelect,
  onEdit,
  className = "",
}: TreeNodeCardProps) {
  const baseClasses = "bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer";
  const selectedClasses = "ring-2 ring-blue-500 ring-offset-2";

  if (zoomLevel === "far") {
    // Minimal view - just names
    return (
      <div
        className={`${baseClasses} px-3 py-1.5 ${className}`}
        onClick={onSelect}
      >
        <p className="text-sm font-medium text-gray-900 truncate">
          {person.firstName} {person.lastName}
        </p>
      </div>
    );
  }

  if (zoomLevel === "medium") {
    // Medium view - avatar + name
    return (
      <div
        className={`${baseClasses} p-3 ${className}`}
        onClick={onSelect}
      >
        <PersonAvatar person={person} size="medium" showName />
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              isExpanded ? onCollapse?.() : onExpand?.();
            }}
            className="mt-2 w-full py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? "Hide" : "Show"} {hasChildren ? "+" : ""} children
          </button>
        )}
      </div>
    );
  }

  if (zoomLevel === "close") {
    // Close view - full details
    return (
      <div className={`${baseClasses} p-4 ${className}`} onClick={onSelect}>
        <div className="flex items-start gap-3">
          <PersonAvatar person={person} size="large" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">
              {person.firstName} {person.lastName}
            </h3>
            {person.birthDate && (
              <p className="text-sm text-gray-600">
                {person.gender === "male" ? "Born" : person.gender === "female" ? "Born" : "Born"}: {person.birthDate}
              </p>
            )}
            {person.birthPlace && (
              <p className="text-sm text-gray-500">{person.birthPlace}</p>
            )}
            {person.deathDate && (
              <p className="text-sm text-gray-600">Died: {person.deathDate}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                isExpanded ? onCollapse?.() : onExpand?.();
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Profile view - full details
  return (
    <div className={`${baseClasses} ${selectedClasses} p-6 max-w-sm ${className}`} onClick={onSelect}>
      <div className="flex flex-col items-center text-center">
        <PersonAvatar person={person} size="xlarge" />
        <h3 className="mt-4 font-bold text-xl text-gray-900">
          {person.firstName} {person.middleName && `${person.middleName} `}{person.lastName}
        </h3>
        {person.maidenName && person.gender === "female" && (
          <p className="text-sm text-gray-500">née {person.maidenName}</p>
        )}
        
        <div className="mt-4 space-y-2 text-sm">
          {person.birthDate && (
            <p><span className="font-medium">Born:</span> {person.birthDate}</p>
          )}
          {person.birthPlace && (
            <p><span className="font-medium">Birth Place:</span> {person.birthPlace}</p>
          )}
          {person.deathDate && (
            <p><span className="font-medium">Died:</span> {person.deathDate}</p>
          )}
          {person.deathPlace && (
            <p><span className="font-medium">Death Place:</span> {person.deathPlace}</p>
          )}
        </div>

        {person.bio && (
          <p className="mt-4 text-sm text-gray-600">{person.bio}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                isExpanded ? onCollapse?.() : onExpand?.();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {isExpanded ? "Collapse Tree" : "Expand Tree"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}