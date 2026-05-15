// ==========================================
// 3D TREE SCENE
// Core Three.js scene for the family tree with lazy loading
// ==========================================

import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';
import { useAuthStore } from '../store/authStore';
import { usePersons, useLazyTreeChildren, useParentChildRelations, useSpouseRelations, useUpdatePersonPosition } from '../graphql/hooks';
import type { Person, ZoomLevel } from '@tree/types';
import { Text, useTexture } from '@react-three/drei';

// ==========================================
// DRAGGABLE TREE NODE 3D COMPONENT
// ==========================================

interface TreeNode3DProps {
  person: Person;
  position: [number, number, number];
  isRoot?: boolean;
  isSelected?: boolean;
  isEditing?: boolean; // Being edited via sidebar but not selected
  onClick?: () => void;
  onPositionChange?: (personId: string, position: [number, number, number]) => void;
}

function TreeNode3D({ person, position, isRoot, isSelected, isEditing, onClick, onPositionChange }: TreeNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const positionStartRef = useRef<[number, number, number] | null>(null);
  const zoomLevel = useTreeStore((s) => s.zoomLevel);
  const setCustomPosition = useTreeStore((s) => s.setCustomPosition);
  const setIsDraggingNode = useTreeStore((s) => s.setIsDraggingNode);
  const highlightedNodes = useTreeStore((s) => s.highlightedNodes);

  const isHighlighted = highlightedNodes.has(person.id);

  // Check if person has a photo
  const hasPhoto = person.photo && person.photo.length > 0;

  const nodeColor = useMemo(() => {
    if (isHighlighted) return '#22C55E'; // Green highlight
    switch (person.gender) {
      case 'male': return '#3B82F6';
      case 'female': return '#EC4899';
      default: return '#8B5CF6';
    }
  }, [person.gender, isHighlighted]);

  const nodeSize = isRoot ? 0.8 : 0.6;

  // Animate on hover / highlight pulse
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = hovered ? 1.15 : isHighlighted ? 1.1 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 8
    );
  });

  const label = zoomLevel === 'far'
    ? person.firstName
    : `${person.firstName} ${person.lastName}`;

  // Check admin permission for dragging
  const isAdmin = useAuthStore((s) => s.isAdmin);

  // Handle pointer down - start drag (admin only)
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    
    // Only allow dragging for admins
    if (!isAdmin) {
      onClick?.();
      return;
    }
    
    setIsDraggingNode(true);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = [...position];
    document.body.style.cursor = 'grabbing';
  }, [position, person.firstName, onClick, isAdmin]);

  // Handle pointer move - drag
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !positionStartRef.current) return;
      
      const dx = (e.clientX - dragStartRef.current.x) * 0.02;
      const dy = (e.clientY - dragStartRef.current.y) * -0.02;
      
      const newPosition: [number, number, number] = [
        positionStartRef.current[0] + dx,
        positionStartRef.current[1] + dy,
        positionStartRef.current[2]
      ];
      
      // Update local position immediately for visual feedback
      if (meshRef.current) {
        meshRef.current.parent!.position.set(...newPosition);
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!dragStartRef.current || !positionStartRef.current) return;
      
      const dx = (e.clientX - dragStartRef.current.x) * 0.02;
      const dy = (e.clientY - dragStartRef.current.y) * -0.02;
      
      const finalPosition: [number, number, number] = [
        positionStartRef.current[0] + dx,
        positionStartRef.current[1] + dy,
        positionStartRef.current[2]
      ];
      
      // Check if we actually moved
      const moved = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
      
      if (moved) {
        onPositionChange?.(person.id, finalPosition);
        setCustomPosition(person.id, finalPosition);
      } else {
        // If no movement, treat as click
        onClick?.();
      }
      
      setIsDragging(false);
      setIsDraggingNode(false);
      dragStartRef.current = null;
      positionStartRef.current = null;
      document.body.style.cursor = hovered ? 'pointer' : 'auto';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, person.id, person.firstName, onClick, onPositionChange, setCustomPosition, setIsDraggingNode]);

  return (
    <group position={position}>
      {/* Node sphere */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (!isDragging) {
            document.body.style.cursor = 'grab';
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!isDragging) {
            document.body.style.cursor = 'auto';
          }
        }}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[nodeSize, 32, 32]} />
        <meshStandardMaterial
          color={isDragging ? '#10B981' : isSelected ? '#F59E0B' : isEditing ? '#A78BFA' : nodeColor}
          emissive={isDragging ? '#10B981' : isSelected ? '#F59E0B' : isEditing ? '#A78BFA' : isHighlighted ? '#22C55E' : hovered ? nodeColor : '#000000'}
          emissiveIntensity={isDragging ? 0.5 : isSelected ? 0.4 : isEditing ? 0.3 : isHighlighted ? 0.5 : hovered ? 0.3 : 0}
          roughness={0.4}
          metalness={0.1}
          opacity={isDragging ? 0.9 : 1}
          transparent={isDragging}
        />
      </mesh>

      {/* Photo sprite on sphere - shows when photo exists */}
      {hasPhoto && <PhotoSphere person={person} nodeSize={nodeSize} zoomLevel={zoomLevel} />}

      {/* Photo placeholder ring */}
      {!hasPhoto && (
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[nodeSize * 0.85, nodeSize, 32]} />
          <meshStandardMaterial
            color={isSelected ? '#D97706' : '#1F2937'}
            opacity={0.5}
            transparent
          />
        </mesh>
      )}

      {/* Name label */}
      <Text
        position={[0, -nodeSize - 0.4, 0]}
        fontSize={zoomLevel === 'far' ? 0.2 : 0.25}
        color="#1F2937"
        anchorX="center"
        anchorY="top"
        maxWidth={3}
        textAlign="center"
      >
        {label}
      </Text>

      {/* Birth/death years (shown at medium zoom and closer) */}
      {zoomLevel !== 'far' && person.birthDate && (
        <Text
          position={[0, -nodeSize - 0.7, 0]}
          fontSize={0.15}
          color="#6B7280"
          anchorX="center"
          anchorY="top"
        >
          {person.birthDate.split('-')[0]}
          {person.deathDate ? ` - ${person.deathDate.split('-')[0]}` : ''}
        </Text>
      )}

      {/* Glow ring for selected, editing, or highlighted */}
      {(isSelected || isEditing || isHighlighted) && (
        <mesh>
          <ringGeometry args={[nodeSize * 1.1, nodeSize * 1.25, 32]} />
          <meshBasicMaterial color={isSelected ? '#F59E0B' : isEditing ? '#A78BFA' : '#22C55E'} opacity={0.6} transparent />
        </mesh>
      )}

      {/* Root crown */}
      {isRoot && (
        <mesh position={[0, nodeSize + 0.3, 0]}>
          <coneGeometry args={[0.3, 0.4, 6]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// PHOTO SPHERE COMPONENT
// Displays photo as a circular texture on the node
// ==========================================

function PhotoSphere({ person, nodeSize }: { person: Person; nodeSize: number; zoomLevel: ZoomLevel }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Load photo texture
  useEffect(() => {
    if (!person.photo) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw circular clipping mask
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image scaled to fill circle
      ctx.drawImage(img, 0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureRef.current = texture;
      setTextureLoaded(true);
    };
    img.src = person.photo;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [person.photo]);

  if (!textureLoaded || !person.photo) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, nodeSize + 0.02]}>
      <circleGeometry args={[nodeSize * 0.75, 64]} />
      <meshBasicMaterial 
        map={textureRef.current} 
        transparent 
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ==========================================
// BRANCH COMPONENT (Organic curves)
// ==========================================

interface BranchProps {
  start: [number, number, number];
  end: [number, number, number];
  thickness?: number;
  color?: string;
  depth?: number;
}

function Branch({ start, end, thickness = 0.08, color = '#8B5CF6', depth = 0 }: BranchProps) {
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);

    // Create organic-looking curve with control points
    const midY = (startVec.y + endVec.y) / 2;
    const control1 = new THREE.Vector3(startVec.x, midY - 0.5, startVec.z);
    const control2 = new THREE.Vector3(endVec.x, midY + 0.5, endVec.z);

    return new THREE.CubicBezierCurve3(startVec, control1, control2, endVec);
  }, [start, end]);

  const tubeGeometry = useMemo(() => {
    const adjustedThickness = Math.max(0.02, thickness * Math.pow(0.85, depth));
    return new THREE.TubeGeometry(curve, 20, adjustedThickness, 8, false);
  }, [curve, thickness, depth]);

  return (
    <mesh geometry={tubeGeometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// ==========================================
// SPOUSE CONNECTION COMPONENT (Horizontal line for married couples)
// ==========================================

interface SpouseConnectionProps {
  person1Pos: [number, number, number];
  person2Pos: [number, number, number];
}

function SpouseConnection({ person1Pos, person2Pos }: SpouseConnectionProps) {
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...person1Pos);
    const endVec = new THREE.Vector3(...person2Pos);

    // Create a horizontal curve connecting spouses
    const midX = (startVec.x + endVec.x) / 2;
    const midY = (startVec.y + endVec.y) / 2;
    const control1 = new THREE.Vector3(midX, startVec.y + 0.3, startVec.z);
    const control2 = new THREE.Vector3(midX, endVec.y + 0.3, endVec.z);

    return new THREE.CubicBezierCurve3(startVec, control1, control2, endVec);
  }, [person1Pos, person2Pos]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 12, 0.06, 8, false);
  }, [curve]);

  // Heart symbol at midpoint
  const midpoint: [number, number, number] = [
    (person1Pos[0] + person2Pos[0]) / 2,
    (person1Pos[1] + person2Pos[1]) / 2 + 0.5,
    0
  ];

  return (
    <>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#EC4899"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      {/* Heart indicator */}
      <mesh position={midpoint}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#EC4899"
          emissive="#EC4899"
          emissiveIntensity={0.3}
        />
      </mesh>
    </>
  );
}

// ==========================================
// SOFT GRADIENT BACKGROUND
// Calm, light background that follows camera
// ==========================================

function SoftGradientBackground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(camera.position.x, camera.position.y, camera.position.z - 80);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[600, 600]} />
      <shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vec2 uv = vUv;

            // Fresh green gradient (bottom to top)
            vec3 bottomColor = vec3(0.72, 0.92, 0.78);  // Soft green
            vec3 midColor = vec3(0.82, 0.96, 0.86);     // Light sage
            vec3 topColor = vec3(0.90, 0.98, 0.93);    // Very light mint

            float y = uv.y;
            vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.5, y));
            col = mix(col, topColor, smoothstep(0.5, 1.0, y));

            gl_FragColor = vec4(col, 1.0);
          }
        `}
        uniforms={{
          uTime: { value: 0 },
        }}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ==========================================
// SUBTLE DEPTH PARTICLES
// Gentle floating dots for spatial depth
// ==========================================

function DepthParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const count = 60;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 400 - 60;
      pos[i * 3 + 2] = -80 - Math.random() * 60;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.position.x = camera.position.x * 0.4;
      pointsRef.current.position.y = camera.position.y * 0.4;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        color="#b8d4c4"
        transparent
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  );
}

// ==========================================
// SOFT AMBIENT GLOW ORBS
// Large, faint light spheres for depth
// ==========================================

function AmbientGlowOrbs() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = camera.position.x * 0.5;
      groupRef.current.position.y = camera.position.y * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[-100, -50, -120]}>
        <sphereGeometry args={[60, 16, 16]} />
        <meshBasicMaterial color="#d4e8dc" transparent opacity={0.12} />
      </mesh>
      <mesh position={[120, -80, -100]}>
        <sphereGeometry args={[50, 16, 16]} />
        <meshBasicMaterial color="#cce0d8" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, -120, -140]}>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color="#e0ece6" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// ==========================================
// ATMOSPHERIC BACKGROUND
// ==========================================

function AtmosphericBackground() {
  return (
    <group>
      <SoftGradientBackground />
      <DepthParticles />
      <AmbientGlowOrbs />

      {/* Soft ambient lighting */}
      <ambientLight intensity={0.85} color="#e8f8ec" />
      <pointLight position={[-40, -30, 10]} intensity={0.5} color="#d0f0e0" />
      <pointLight position={[40, -50, 5]} intensity={0.4} color="#c8f0d8" />
    </group>
  );
}

// ==========================================
// LEGACY PARTICLE FIELD — kept for compatibility
// ==========================================

function ParticleField() {
  const count = 100;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200 - 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20;
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#c8e0d4" transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

// ==========================================
// MAIN TREE SCENE (with infinite zoom & lazy loading)
// ==========================================

function TreeScene() {
  const { selectedNodeId, selectNode, zoomLevel, rootPersonId, expandedNodes, toggleNode, customPositions, setCustomPosition, editingNodeId, setEditingNodeId } = useTreeStore();
  const { camera } = useThree();
  const { persons, loading } = usePersons();
  const { relations: parentChildRelations } = useParentChildRelations();
  const { relations: spouseRelations } = useSpouseRelations();
  const { updatePosition } = useUpdatePersonPosition();

  // Lazy load children when node is expanded
  const { fetchChildren } = useLazyTreeChildren();

  // Build parent-child map from Neo4j relationships
  const childMap = useMemo(() => {
    const map = new Map<string, string[]>();
    parentChildRelations.forEach(({ parentId, childId }) => {
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(childId);
    });
    return map;
  }, [parentChildRelations]);

  const parentMap = useMemo(() => {
    const map = new Map<string, string[]>();
    parentChildRelations.forEach(({ parentId, childId }) => {
      if (!map.has(childId)) map.set(childId, []);
      map.get(childId)!.push(parentId);
    });
    return map;
  }, [parentChildRelations]);

  const selectedPathIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedNodeId) return ids;

    // Add selected node and all ancestors (path to root)
    const stack = [selectedNodeId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || ids.has(current)) continue;
      ids.add(current);
      const parents = parentMap.get(current) ?? [];
      parents.forEach((parentId) => stack.push(parentId));
    }

    // Always show immediate children of selected node (they render when node is selected)
    const children = childMap.get(selectedNodeId) ?? [];
    children.forEach((childId) => ids.add(childId));

    return ids;
  }, [selectedNodeId, parentMap, childMap]);

  const visiblePeople = useMemo(() => {
    const visibleIds = new Set<string>();

    // Always show root person
    if (rootPersonId) {
      visibleIds.add(rootPersonId);
    }

    // Show the entire selected lineage path (ancestors → selected)
    selectedPathIds.forEach((id) => visibleIds.add(id));

    // Build spouse-to-spouse map and spouse list for selected path
    const spouseMap = new Map<string, string[]>();
    spouseRelations.forEach(({ personId, spouseId }) => {
      if (!spouseMap.has(personId)) spouseMap.set(personId, []);
      spouseMap.get(personId)!.push(spouseId);
    });
    selectedPathIds.forEach((id) => {
      const spouses = spouseMap.get(id) ?? [];
      spouses.forEach((spouseId) => visibleIds.add(spouseId));
    });

    // Show children of selected node AND their spouses
    if (selectedNodeId) {
      const allParentIds = [selectedNodeId, ...(spouseMap.get(selectedNodeId) ?? [])];
      allParentIds.forEach((parentId) => {
        const children = childMap.get(parentId) ?? [];
        children.forEach((childId) => {
          if (!visibleIds.has(childId)) {
            visibleIds.add(childId);
          }
        });
      });
    }

    return persons.filter((person) => visibleIds.has(person.id));
  }, [persons, rootPersonId, selectedPathIds, selectedNodeId, spouseRelations, childMap]);

  // Build node positions based on visible people (with parent-relative positioning)
  const nodePositions = useMemo(() => {
    const positions: Map<string, [number, number, number]> = new Map();
    const generationSpacing = 4;
    const siblingSpacing = 4;

    // Group by generation
    const byGen = new Map<number, Person[]>();
    visiblePeople.forEach(p => {
      if (!byGen.has(p.generation)) byGen.set(p.generation, []);
      byGen.get(p.generation)!.push(p);
    });

    // Sort generations from lowest to highest (parents before children)
    const sortedGens = Array.from(byGen.keys()).sort((a, b) => a - b);
    
    // Count children per parent for sibling positioning
    const childrenPerParent = new Map<string, number>();
    parentChildRelations.forEach(({ parentId, childId }) => {
      const existing = childrenPerParent.get(parentId) ?? 0;
      childrenPerParent.set(parentId, existing + 1);
    });
    
    // Track child index per parent for sibling offset
    const childIndexPerParent = new Map<string, number>();
    parentChildRelations.forEach(({ parentId, childId }) => {
      const idx = childIndexPerParent.get(parentId) ?? 0;
      childIndexPerParent.set(parentId, idx + 1);
      childIndexPerParent.set(childId, idx); // Store index for this child
    });
    
    // Process each generation in order (parents first)
    sortedGens.forEach((gen) => {
      const people = byGen.get(gen)!;
      
      // Find people who have parents (children) vs root-level people
      const children = people.filter(p => {
        return parentChildRelations.some(r => r.childId === p.id);
      });
      const roots = people.filter(p => !children.some(c => c.id === p.id));
      
      // Process root-level people (generation anchor points)
      if (roots.length > 0) {
        const totalWidth = (roots.length - 1) * siblingSpacing;
        let xOffset = -totalWidth / 2;
        
        roots.forEach((person, idx) => {
          console.log('[TreeScene] Processing root person:', person.firstName, person.lastName, 'positionX:', person.positionX, 'positionY:', person.positionY);
          
          if (customPositions.has(person.id)) {
            console.log('[TreeScene] Using customPosition for:', person.firstName);
            positions.set(person.id, customPositions.get(person.id)!);
          } else if (person.positionX !== undefined && person.positionX !== null && 
                     person.positionY !== undefined && person.positionY !== null) {
            console.log('[TreeScene] Using stored position for:', person.firstName, [person.positionX, person.positionY, person.positionZ]);
            positions.set(person.id, [person.positionX, person.positionY, person.positionZ ?? 0]);
          } else {
            console.log('[TreeScene] Using calculated position for:', person.firstName, 'at gen', gen);
            positions.set(person.id, [xOffset + idx * siblingSpacing, -gen * generationSpacing, 0]);
          }
        });
      }
      
      // Process children - position below their parent
      children.forEach(child => {
        // Find parent
        const parentRelation = parentChildRelations.find(r => r.childId === child.id);
        const parentId = parentRelation?.parentId;
        
        if (parentId) {
          const parentPos = positions.get(parentId);
          if (parentPos) {
            // Calculate sibling offset
            const siblings = childrenPerParent.get(parentId) ?? 1;
            const myIndex = childIndexPerParent.get(child.id) ?? 0;
            const offsetX = (myIndex - (siblings - 1) / 2) * siblingSpacing;
            
            const newPos: [number, number, number] = [
              parentPos[0] + offsetX,
              parentPos[1] - generationSpacing,
              parentPos[2]
            ];
            
            if (customPositions.has(child.id)) {
              positions.set(child.id, customPositions.get(child.id)!);
            } else if (child.positionX !== undefined && child.positionY !== undefined &&
                       (child.positionX !== 0 || child.positionY !== 0)) {
              positions.set(child.id, [child.positionX, child.positionY, child.positionZ || 0]);
            } else {
              positions.set(child.id, newPos);
            }
          } else {
            // Parent position not found yet - this shouldn't happen if parents are processed first
            positions.set(child.id, [0, -gen * generationSpacing, 0]);
          }
        } else {
          // No parent found, position at generation level
          const genPos = -gen * generationSpacing;
          if (customPositions.has(child.id)) {
            positions.set(child.id, customPositions.get(child.id)!);
          } else if (child.positionX !== undefined && child.positionY !== undefined &&
                     (child.positionX !== 0 || child.positionY !== 0)) {
            positions.set(child.id, [child.positionX, child.positionY, child.positionZ || 0]);
          } else {
            // Default: center horizontally at generation level
            const genPeople = visiblePeople.filter(p => p.generation === gen);
            const genIndex = genPeople.findIndex(p => p.id === child.id);
            const totalWidth = (genPeople.length - 1) * siblingSpacing;
            positions.set(child.id, [-totalWidth / 2 + genIndex * siblingSpacing, genPos, 0]);
          }
        }
      });
    });

    return positions;
  }, [visiblePeople, customPositions, parentChildRelations]);

  // Handle position change (drag end)
  const handlePositionChange = useCallback((personId: string, position: [number, number, number]) => {
    // Save to store for immediate UI update
    setCustomPosition(personId, position);
    // Save to database
    updatePosition(personId, position[0], position[1], position[2]);
  }, [setCustomPosition, updatePosition]);

  // Build branches using ACTUAL Neo4j parent-child relationships
  const branches = useMemo(() => {
    const result: Array<{
      start: [number, number, number];
      end: [number, number, number];
      depth: number;
    }> = [];

    // Use the real parent-child relationships from Neo4j
    childMap.forEach((childIds, parentId) => {
      const parentPos = nodePositions.get(parentId);
      if (!parentPos) return;

      childIds.forEach(childId => {
        const childPos = nodePositions.get(childId);
        if (childPos) {
          result.push({
            start: parentPos,
            end: childPos,
            depth: 0,
          });
        }
      });
    });

    return result;
  }, [childMap, nodePositions]);

  // Build spouse connections
  const spouseConnections = useMemo(() => {
    const result: Array<{
      person1Id: string;
      person2Id: string;
    }> = [];

    const visibleIds = new Set(visiblePeople.map((p) => p.id));

    // Create a set of already-seen connections to avoid duplicates
    const seen = new Set<string>();
    spouseRelations.forEach(({ personId, spouseId }) => {
      // Only show if at least one person in the pair is visible
      if (!visibleIds.has(personId) && !visibleIds.has(spouseId)) return;
      const key1 = `${personId}-${spouseId}`;
      const key2 = `${spouseId}-${personId}`;
      if (!seen.has(key1) && !seen.has(key2)) {
        seen.add(key1);
        result.push({ person1Id: personId, person2Id: spouseId });
      }
    });

    return result;
  }, [spouseRelations, visiblePeople]);

  // Handle node click - toggle expansion
  // When clicking a spouse, keep the same view context (same visible nodes and positions)
  // but allow editing the spouse via the sidebar by setting editingNodeId
  const handleNodeClick = useCallback((personId: string) => {
    // Build spouse-to-spouse map to find the main partner
    const spouseMap = new Map<string, string[]>();
    spouseRelations.forEach(({ personId: pid, spouseId }) => {
      if (!spouseMap.has(pid)) spouseMap.set(pid, []);
      spouseMap.get(pid)!.push(spouseId);
    });

    // Check if clicking on a spouse of the current selection
    const currentSpouses = selectedNodeId ? (spouseMap.get(selectedNodeId) ?? []) : [];
    const isSpouseOfCurrent = currentSpouses.includes(personId);

    if (isSpouseOfCurrent && selectedNodeId) {
      // Just set editingNodeId for sidebar display - NO state changes that affect tree positions
      setEditingNodeId(personId);
    } else {
      // Normal behavior - clear editing and select new person
      setEditingNodeId(null);
      selectNode(personId);
      if (!expandedNodes.has(personId)) {
        toggleNode(personId);
        fetchChildren(personId);
      }
    }
  }, [selectNode, expandedNodes, toggleNode, fetchChildren, spouseRelations, selectedNodeId, setEditingNodeId]);

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, -5, 20);
    camera.lookAt(0, -8, 0);
  }, [camera]);

  if (loading) {
    return (
      <>
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 10, 0]} intensity={1} />
      </>
    );
  }

  return (
    <>
      <AtmosphericBackground />

      {/* Invisible click catcher for deselecting - uses onPointerMissed on each node instead */}

      {/* Branches */}
      {branches.map((branch, index) => (
        <Branch
          key={`branch-${index}`}
          start={branch.start}
          end={branch.end}
          depth={branch.depth}
          thickness={0.12}
        />
      ))}

      {/* Spouse Connections */}
      {spouseConnections.map(({ person1Id, person2Id }, index) => {
        const pos1 = nodePositions.get(person1Id);
        const pos2 = nodePositions.get(person2Id);
        if (!pos1 || !pos2) return null;
        return (
          <SpouseConnection
            key={`spouse-${index}`}
            person1Pos={pos1}
            person2Pos={pos2}
          />
        );
      })}

      {/* Nodes */}
      {visiblePeople.map((person) => {
        const pos = nodePositions.get(person.id);
        if (!pos) return null;

        return (
          <TreeNode3D
            key={person.id}
            person={person}
            position={pos}
            isRoot={person.id === rootPersonId}
            isSelected={selectedNodeId === person.id}
            isEditing={editingNodeId === person.id}
            onClick={() => handleNodeClick(person.id)}
            onPositionChange={handlePositionChange}
          />
        );
      })}
    </>
  );
}

export default TreeScene;
