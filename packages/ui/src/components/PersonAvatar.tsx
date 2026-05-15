// ==========================================
// PERSON AVATAR COMPONENT
// ==========================================

import React from "react";
import type { Person, Gender } from "@tree/types";

interface PersonAvatarProps {
  person: Person;
  size?: "small" | "medium" | "large" | "xlarge";
  showName?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const genderColors: Record<Gender, { bg: string; text: string }> = {
  male: { bg: "#3B82F6", text: "#DBEAFE" },
  female: { bg: "#EC4899", text: "#FCE7F3" },
  other: { bg: "#8B5CF6", text: "#EDE9FE" },
  unknown: { bg: "#6B7280", text: "#F3F4F6" },
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function PersonAvatar({
  person,
  size = "medium",
  showName = false,
  onClick,
  className = "",
}: PersonAvatarProps) {
  const dimension = sizeMap[size];
  const colors = genderColors[person.gender];

  const containerClass = `flex items-center gap-3 ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className}`;

  const avatar = (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden"
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: dimension * 0.35,
      }}
    >
      {person.photo ? (
        <img
          src={person.photo}
          alt={`${person.firstName} ${person.lastName}`}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(person.firstName, person.lastName)
      )}
    </div>
  );

  if (!showName) {
    return onClick ? (
      <button onClick={onClick} type="button" className={containerClass}>
        {avatar}
      </button>
    ) : (
      <div className={containerClass}>{avatar}</div>
    );
  }

  return onClick ? (
    <button onClick={onClick} type="button" className={`${containerClass} text-left`}>
      {avatar}
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {person.firstName} {person.lastName}
        </p>
        {person.birthDate && (
          <p className="text-sm text-gray-500">
            {person.birthDate}
            {person.deathDate && ` - ${person.deathDate}`}
          </p>
        )}
      </div>
    </button>
  ) : (
    <div className={containerClass}>
      {avatar}
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {person.firstName} {person.lastName}
        </p>
        {person.birthDate && (
          <p className="text-sm text-gray-500">
            {person.birthDate}
            {person.deathDate && ` - ${person.deathDate}`}
          </p>
        )}
      </div>
    </div>
  );
}