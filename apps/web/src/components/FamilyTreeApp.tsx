// ==========================================
// MAIN FAMILY TREE APP COMPONENT
// ==========================================

import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';
import { useAuthStore } from '../store/authStore';
import { useTreeRoot, useTreeStats, useCreatePerson, usePersons } from '../graphql/hooks';
import { SearchBar, AddPersonModal } from '@tree/ui';
import LoginModal from './LoginModal';
import type { CreatePersonInput, Person } from '@tree/types';

const TreeScene = lazy(() => import('./TreeScene'));
const Sidebar = lazy(() => import('./Sidebar'));

// Custom camera controller for free panning
function CameraController() {
  const { camera, gl } = useThree();
  const dragState = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const isDraggingNodeRef = useRef(false);
  const isMobileRef = useRef(false);
  const lastPanTimeRef = useRef(0);
  const isPinchingRef = useRef(false);
  
  // Pinch-to-zoom state
  const pinchState = useRef({ 
    isPinching: false, 
    initialDistance: 0, 
    initialZoom: 0 
  });

  // Mobile detection
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep ref in sync with store
  const isDraggingNode = useTreeStore((s) => s.isDraggingNode);
  useEffect(() => {
    isDraggingNodeRef.current = isDraggingNode;
  }, [isDraggingNode]);

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    const canvas = gl.domElement;
    const isMobile = () => isMobileRef.current;
    const isPinching = () => isPinchingRef.current;
    
    // Faster lerp on mobile for snappier response
    const lerpFactor = () => isMobile() ? 0.2 : 0.1;
    
    const handlePointerDown = (e: PointerEvent) => {
      // Don't handle single pointer if we're in pinch mode or dragging node
      if (isDraggingNodeRef.current) return;
      if (isPinchingRef.current) return;
      
      if (e.button === 0) {
        dragState.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Don't pan during pinch zoom
      if (isPinchingRef.current) return;
      if (!dragState.current.isDragging) return;
      
      // Throttle on mobile for better performance
      const now = Date.now();
      if (isMobile() && now - lastPanTimeRef.current < 16) return; // ~60fps cap
      lastPanTimeRef.current = now;

      const dx = dragState.current.lastX - e.clientX;
      const dy = dragState.current.lastY - e.clientY;

      // Only pan if movement is significant (prevent jitter)
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

      // Pan the camera (move in opposite direction of drag)
      targetPosition.current.x += dx * 0.02;
      targetPosition.current.y -= dy * 0.02;
      
      // Also move the look-at point
      targetLookAt.current.x += dx * 0.02;
      targetLookAt.current.y -= dy * 0.02;

      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      dragState.current.isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (e) {
        // Ignore if capture already released
      }
    };

    // Touch event handlers for pinch-to-zoom
    const handleTouchStart = (e: TouchEvent) => {
      // If already pinching, ignore
      if (isPinchingRef.current) return;
      
      // Start pinch only with 2 fingers and not dragging a node
      if (e.touches.length === 2 && !isDraggingNodeRef.current) {
        e.preventDefault();
        isPinchingRef.current = true;
        pinchState.current.isPinching = true;
        pinchState.current.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
        pinchState.current.initialZoom = targetPosition.current.z;
        
        // Cancel any single-finger drag
        dragState.current.isDragging = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle pinch if we're in pinch mode with 2 fingers
      if (!isPinchingRef.current || e.touches.length !== 2) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = pinchState.current.initialDistance / currentDistance;
      const newZoom = Math.max(3, Math.min(500, pinchState.current.initialZoom * scale));
      
      // Smooth zoom transition
      targetPosition.current.z += (newZoom - targetPosition.current.z) * 0.3;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Only stop pinch if we actually had 2 fingers
      if (e.touches.length < 2 && isPinchingRef.current) {
        isPinchingRef.current = false;
        pinchState.current.isPinching = false;
      }
    };

    // Mouse wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 0.15 : -0.15;
      targetPosition.current.z = Math.max(3, Math.min(500, targetPosition.current.z + zoomDelta * 20));
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events for mobile - capture phase to prevent propagation
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Set initial targets
    targetPosition.current.set(0, 0, 20);
    targetLookAt.current.set(0, -8, 0);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl]);

  useFrame(() => {
    const lerpFactor = isMobileRef.current ? 0.2 : 0.1;
    
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, lerpFactor);
    
    // Smoothly interpolate look-at target
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(camera.position);
    currentLookAt.lerp(targetLookAt.current, lerpFactor);
    
    camera.lookAt(targetLookAt.current);
  });

  return null;
}

export function FamilyTreeApp() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const {
    viewport,
    zoomLevel,
    isLoading,
    error,
    searchQuery,
    showAddModal,
    selectedNodeId,
    rootPerson,
    zoom,
    zoomTo,
    pan,
    resetView,
    setSearchQuery,
    setShowAddModal,
    setLoading,
    setError,
    setRootPerson,
    setViewport,
    setHighlightedNodes,
    clearHighlightedNodes,
    selectNode,
  } = useTreeStore();

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // Load tree data from GraphQL API
  const { rootNodes, loading: rootLoading, error: rootError, refetch } = useTreeRoot();
  const { stats, loading: statsLoading } = useTreeStats();
  const { createPerson } = useCreatePerson();
  const { persons } = usePersons();

  // Handle loading and errors from API
  useEffect(() => {
    setLoading(rootLoading || statsLoading);
  }, [rootLoading, statsLoading, setLoading]);

  useEffect(() => {
    if (rootError) {
      setError(rootError.message);
    } else {
      setError(null);
    }
  }, [rootError, setError]);

  // Set root person when data loads
  useEffect(() => {
    if (rootNodes.length > 0 && !rootPerson) {
      // Find the patriarch (male in generation 0)
      const patriarch = rootNodes.find(n => n.gender === 'male') || rootNodes[0];
      setRootPerson(patriarch);
    }
  }, [rootNodes, rootPerson, setRootPerson]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query || query.length < 2) {
      clearHighlightedNodes();
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const matches = persons
      .filter((p: Person) => {
        const firstName = (p.firstName ?? '').toLowerCase();
        const middleName = (p.middleName ?? '').toLowerCase();
        const lastName = (p.lastName ?? '').toLowerCase();
        return (
          firstName.includes(lowerQuery) ||
          middleName.includes(lowerQuery) ||
          lastName.includes(lowerQuery)
        );
      })
      .map((p: Person) => p.id);
    
    setHighlightedNodes(matches);
    
    // Auto-select the first match
    if (matches.length > 0) {
      selectNode(matches[0]);
    }
  };

  const handleZoomIn = () => zoom(0.1);
  const handleZoomOut = () => zoom(-0.1);
  const handleZoomToFit = () => zoomTo(0.5);
  const handleReset = () => resetView();

  const handleAddPerson = (data: CreatePersonInput) => {
    createPerson({
      ...data,
      gender: data.gender.toUpperCase() as any,
    });
    setShowAddModal(false);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0" style={{ pointerEvents: 'auto', touchAction: 'none' }}>
        <Canvas
          camera={{
            position: [viewport.centerX, viewport.centerY, viewport.centerZ],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          className="family-tree-canvas"
        >
          <Suspense fallback={null}>
            {/* Warm ambient lighting */}
            <ambientLight intensity={0.7} color="#fff8e8" />

            {/* Soft directional sunlight */}
            <directionalLight position={[10, 15, 10]} intensity={1.2} color="#fff5e0" castShadow />

            {/* Fill light from opposite side */}
            <directionalLight position={[-10, -5, -10]} intensity={0.3} color="#e8f4ff" />

            {/* Subtle rim light */}
            <pointLight position={[0, -10, 15]} intensity={0.5} color="#ffe8cc" />

            {/* Soft warm sky glow */}
            <pointLight position={[0, 50, 0]} intensity={0.6} color="#fffbe6" />

            <TreeScene />
            
            {/* Custom camera controller replaces OrbitControls */}
            <CameraController />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2">
              <button
                onClick={() => setShowCredits(true)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <img src="/images/abellanosaClan.png" alt="Abellanosa Clan" className="h-8 w-auto" />
              </button>
            </div>

            <div className="hidden md:block bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2">
              <span className="text-sm text-gray-600">
                {stats.totalPeople} members · {stats.totalGenerations} generations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* User/Login Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-shadow"
                >
                  <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span className="text-sm text-gray-700">{user?.username}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{isAdmin ? 'Administrator' : user?.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        // Also clear tree store selections
                        useTreeStore.getState().selectNode(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
              >
                🔐 Login
              </button>
            )}
            
            <SearchBar
              onSearch={handleSearch}
              className="w-80 max-w-[calc(100vw-2rem)] relative"
            />
          </div>
        </div>

        {/* Sidebar - only show when a person is selected */}
        {selectedNodeId && (
          <div className="absolute top-28 md:top-20 left-0 right-0 md:left-auto md:right-4 w-full md:w-80 px-2 md:px-0" style={{ pointerEvents: 'auto' }}>
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
          </div>
        )}

        {/* Loading / Error */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20" style={{ pointerEvents: 'auto' }}>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg" style={{ pointerEvents: 'auto' }}>
            {error}
          </div>
        )}
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Credits Modal */}
      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative w-full max-w-2xl h-96 overflow-hidden bg-gradient-to-b from-amber-100 to-amber-50 rounded-2xl shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
            >
              ✕
            </button>

            {/* Scrolling credits */}
            <div className="h-full overflow-hidden relative">
              <div className="family-credits-scroll absolute inset-0 flex flex-col justify-start">
                <div className="h-96" /> {/* Spacer for initial position */}
                <div className="text-center px-8 py-12 space-y-16">
                  {/* Title */}
                  <div>
                    <img src="/images/abellanosaClan.png" alt="Abellanosa Clan" className="h-24 w-auto mx-auto mb-4" />
                    <h2 className="text-3xl font-serif font-bold text-amber-900 mb-6">Credits & Gratitude</h2>
                  </div>

                  {/* First paragraph */}
                  <p className="text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                    The Genealogy record is a labor of love of{" "}
                    <span className="font-semibold text-amber-900">Mario T. Abellanosa</span>.
                    Since 1960s, he has been gathering data from relatives, visiting places and
                    compiling them, which he dreamed to complete "before I die". The dream has
                    come true as of 1997. To him the Abellanosa are most indebted.
                  </p>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-16 bg-amber-300"></div>
                    <div className="text-amber-400">✨</div>
                    <div className="h-px w-16 bg-amber-300"></div>
                  </div>

                  {/* Second paragraph */}
                  <p className="text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                    "Encouragement and loving pressure came from{" "}
                    <span className="font-semibold text-amber-900">Felomino N. Bautista</span>{" "}
                    to publish this labor of Love."
                  </p>

                  {/* End spacer */}
                  <div className="h-32"></div>
                </div>
              </div>
            </div>

            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-amber-100 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-amber-50 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Inline styles for scrolling animation */}
      <style>{`
        @keyframes familyCreditsScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .family-credits-scroll {
          animation: familyCreditsScroll 20s linear forwards;
        }
      `}</style>
    </div>
  );
}
