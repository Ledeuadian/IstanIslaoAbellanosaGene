// ==========================================
// SIDEBAR COMPONENT
// Shows details of selected person with API integration
// ==========================================

import React, { useState, useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { useAuthStore } from '../store/authStore';
import { PersonAvatar, AddPersonModal, AddParentModal, AddSpouseModal, EditPersonModal } from '@tree/ui';
import { usePerson, usePersons, useCreatePerson, useDeletePerson, useAddParent, useAddSpouse, useUpdatePerson, useSpouseRelations, useParentChildRelations } from '../graphql/hooks';
import type { CreatePersonInput, Person } from '@tree/types';

export default function Sidebar() {
  const { 
    selectedNodeId, 
    editingNodeId,
    setEditingNodeId,
    setEditingPerson, 
    showAddModal, 
    setShowAddModal, 
    selectNode,
    showAddParentModal,
    setShowAddParentModal,
    showAddSpouseModal,
    setShowAddSpouseModal,
    editingPerson,
  } = useTreeStore();

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authUser = useAuthStore((s) => s.user);
  
  // Show editing person's info if editingNodeId is set, otherwise show selected person
  const effectiveNodeId = editingNodeId || selectedNodeId;
  const { person: selectedPerson, loading } = usePerson(effectiveNodeId);
  const { persons } = usePersons();
  const { createPerson } = useCreatePerson();
  const { deletePerson } = useDeletePerson();
  const { addParent } = useAddParent();
  const { addSpouse } = useAddSpouse();
  const { updatePerson } = useUpdatePerson();
  
  // Get spouse and parent-child relations
  const { relations: allSpouseRelations } = useSpouseRelations();
  const { relations: allParentChildRelations } = useParentChildRelations();
  
  // Get siblings (people who share at least one parent with selected person)
  const siblings = useMemo(() => {
    if (!selectedNodeId || !allParentChildRelations || !persons) return [];
    
    // Get parents of selected person
    const parentIds = allParentChildRelations
      .filter((r) => r.childId === selectedNodeId)
      .map((r) => r.parentId);
    
    if (parentIds.length === 0) return [];
    
    // Find all other children of these parents (excluding self)
    const siblingIds = new Set<string>();
    parentIds.forEach((parentId) => {
      allParentChildRelations
        .filter((r) => r.parentId === parentId && r.childId !== selectedNodeId)
        .forEach((r) => siblingIds.add(r.childId));
    });
    
    return persons.filter((p: Person) => siblingIds.has(p.id));
  }, [selectedNodeId, allParentChildRelations, persons]);
  
  // Get children of selected person
  const children = useMemo(() => {
    if (!selectedNodeId || !allParentChildRelations || !persons) return [];
    
    const childIds = allParentChildRelations
      .filter((r) => r.parentId === selectedNodeId)
      .map((r) => r.childId);
    
    return persons.filter((p: Person) => childIds.includes(p.id));
  }, [selectedNodeId, allParentChildRelations, persons]);
  
  // Get parents of selected person
  const parents = useMemo(() => {
    if (!selectedNodeId || !allParentChildRelations || !persons) return [];
    
    const parentIds = allParentChildRelations
      .filter((r) => r.childId === selectedNodeId)
      .map((r) => r.parentId);
    
    return persons.filter((p: Person) => parentIds.includes(p.id));
  }, [selectedNodeId, allParentChildRelations, persons]);
  
  // Get spouses of parents (to find the other parent who may not be directly linked)
  const parentSpouseIds = useMemo(() => {
    if (!allParentChildRelations || !persons) return [];
    
    // Get direct parent IDs
    const parentIds = parents.map((p) => p.id);
    
    // Find spouses of those parents
    const spouseIds = new Set<string>();
    parentIds.forEach((parentId) => {
      allParentChildRelations
        .filter((r) => r.parentId === parentId) // wrong, spouse relations, not parent-child
        ;
    });
    
    // Use spouse relations to find parent's spouses
    const parentSpouseIds = allSpouseRelations
      .filter((r) => parentIds.includes(r.personId) || parentIds.includes(r.spouseId))
      .map((r) => {
        if (parentIds.includes(r.personId)) return r.spouseId;
        return r.personId;
      });
    
    return [...new Set(parentSpouseIds)];
  }, [parents, allSpouseRelations]);
  
  const parentSpouses = useMemo(() => {
    if (parentSpouseIds.length === 0 || !persons) return [];
    return persons.filter((p: Person) => parentSpouseIds.includes(p.id));
  }, [parentSpouseIds, persons]);
  
  // Combine direct parents + spouses of parents (both are parents of selected)
  const allParents = useMemo(() => {
    const all = [...parents];
    parentSpouses.forEach((ps) => {
      if (!all.find((p) => p.id === ps.id)) {
        all.push(ps);
      }
    });
    return all;
  }, [parents, parentSpouses]);
  
  const getFather = () => {
    const father = allParents.find((p) => p.gender === "male");
    return father;
  };
  
  const getMother = () => {
    const mother = allParents.find((p) => p.gender === "female");
    return mother;
  };
  
  const getFullName = (person: Person) => 
    `${person.firstName}${person.middleName ? ` ${person.middleName}` : ""} ${person.lastName}`.trim();
  
  // Determine which person to actually select when clicking on a relation
  // This keeps the view on the main perspective when clicking on related persons
  const getActualSelection = (personId: string): string => {
    if (!selectedNodeId) return personId;
    
    // Build parent-child map
    const parentMap = new Map<string, string[]>();
    allParentChildRelations.forEach(({ parentId, childId }) => {
      if (!parentMap.has(childId)) parentMap.set(childId, []);
      parentMap.get(childId)!.push(parentId);
    });
    
    // Build spouse map
    const spouseMap = new Map<string, string[]>();
    allSpouseRelations.forEach(({ personId: pid, spouseId }) => {
      if (!spouseMap.has(pid)) spouseMap.set(pid, []);
      spouseMap.get(pid)!.push(spouseId);
    });
    
    // Find the nearest connected person to the current selection
    // Priority: selectedNodeId's children, selectedNodeId's spouses, selectedNodeId's parents
    const selectedParents = parentMap.get(selectedNodeId) ?? [];
    const selectedSpouses = spouseMap.get(selectedNodeId) ?? [];
    
    // If clicked person is a child of the current selection, keep current selection
    const clickedParents = parentMap.get(personId) ?? [];
    if (clickedParents.includes(selectedNodeId)) {
      return selectedNodeId;
    }
    
    // If clicked person is a spouse of the current selection, keep current selection
    if (selectedSpouses.includes(personId)) {
      return selectedNodeId;
    }
    
    // If clicked person is a parent of the current selection, keep current selection
    if (selectedParents.includes(personId)) {
      return selectedNodeId;
    }
    
    // If current selection is a spouse of the clicked person, keep current selection
    if (clickedParents.some(p => selectedSpouses.includes(p))) {
      return selectedNodeId;
    }
    
    // If clicked person shares a parent with current selection (siblings), keep current selection
    const selectedChildren = allParentChildRelations
      .filter(r => r.parentId === selectedNodeId)
      .map(r => r.childId);
    // Get parents of clicked person
    const clickedParentsSet = new Set(clickedParents);
    if (selectedChildren.some(childId => {
      const childParents = parentMap.get(childId) ?? [];
      return childParents.some(cp => clickedParentsSet.has(cp));
    })) {
      return selectedNodeId;
    }
    
    // Otherwise, select the clicked person normally
    return personId;
  };
  
  const handleSelectPerson = (personId: string) => {
    // Build spouse map to check if clicking a spouse
    const spouseMap = new Map<string, string[]>();
    allSpouseRelations.forEach(({ personId: pid, spouseId }) => {
      if (!spouseMap.has(pid)) spouseMap.set(pid, []);
      spouseMap.get(pid)!.push(spouseId);
    });
    
    // Check if clicked person is a spouse of current selection
    const currentSpouses = selectedNodeId ? (spouseMap.get(selectedNodeId) ?? []) : [];
    const isSpouseOfCurrent = currentSpouses.includes(personId);
    
    if (isSpouseOfCurrent) {
      // Set editingNodeId to show spouse info, but don't change selectedNodeId
      // This keeps the 3D view stable (no re-render of positions)
      setEditingNodeId(personId);
      // Toggle: if already editing this spouse, clear editing
      if (editingNodeId === personId) {
        setEditingNodeId(null);
      }
    } else {
      // Clicking on non-spouse (child, parent, sibling, or unrelated)
      // Clear editing and select the person normally
      setEditingNodeId(null);
      selectNode(personId);
    }
  };
  
  const renderRelationLink = (person: Person | undefined, label: string, fallbackLabel?: string) => {
    if (!person) {
      return fallbackLabel ? (
        <span className="text-gray-400 text-sm italic">{fallbackLabel}</span>
      ) : null;
    }
    return (
      <button
        onClick={() => handleSelectPerson(person.id)}
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
      >
        {getFullName(person)}
      </button>
    );
  };

  const selectedSpouseIds = useMemo(() => {
    if (!selectedNodeId) return [];
    return allSpouseRelations
      .filter((r) => r.personId === selectedNodeId || r.spouseId === selectedNodeId)
      .map((r) => r.personId === selectedNodeId ? r.spouseId : r.personId);
  }, [selectedNodeId, allSpouseRelations]);

  // Get the spouse(s) of the selected person
  const spouses = useMemo(() => {
    if (!selectedNodeId || !persons) return [];
    return persons.filter((p: Person) => selectedSpouseIds.includes(p.id));
  }, [selectedNodeId, selectedSpouseIds, persons]);

  // Determine default lastName and middleName for children
  // Male selected: child.lastName = his lastName, child.middleName = spouse's lastName (mother's maiden)
  // Female selected: child.lastName = spouse's lastName (father's), child.middleName = her lastName (mother's maiden)
  const [defaultLastName, defaultMiddleName] = useMemo(() => {
    if (!selectedPerson) return ["", ""];
    
    if (selectedPerson.gender === "male") {
      // Father is selected node
      const childLastName = selectedPerson.lastName || "";
      const mother = spouses.find((s: Person) => s.gender === "female");
      const childMiddleName = mother?.lastName || "";
      return [childLastName, childMiddleName];
    } else {
      // Mother is selected node
      const father = spouses.find((s: Person) => s.gender === "male");
      const childLastName = father?.lastName || selectedPerson.lastName || "";
      const childMiddleName = selectedPerson.lastName || "";
      return [childLastName, childMiddleName];
    }
  }, [selectedPerson, spouses]);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (selectedNodeId) {
      deletePerson(selectedNodeId);
      setShowDeleteConfirm(false);
      selectNode(null);
    }
  };

  // Handle Add Child - creates person and links to selected person as parent
  const handleAddChild = (data: CreatePersonInput) => {
    const parentId = selectedNodeId || undefined;
    const parentGeneration = selectedPerson?.generation ?? 0;
    const childGeneration = parentGeneration + 1;
    
    // Calculate position: place child below the parent with slight offset
    const parentPos = selectedPerson;
    const siblingCount = (selectedPerson as any)?._countChildren || 1;
    
    const input = {
      ...data,
      gender: data.gender.toUpperCase() as any,
      generation: childGeneration,
      positionX: (parentPos?.positionX ?? 0) + (siblingCount * 2), // offset to the right based on sibling count
      positionY: (parentPos?.positionY ?? 0) - 4, // below parent
      positionZ: parentPos?.positionZ ?? 0,
    };
    
    console.log('[Sidebar] handleAddChild called');
    console.log('[Sidebar] selectedPerson:', selectedPerson);
    console.log('[Sidebar] parentPos:', parentPos);
    console.log('[Sidebar] input:', input);
    console.log('[Sidebar] positionX calculated:', (parentPos?.positionX ?? 0) + (siblingCount * 2));
    console.log('[Sidebar] positionY calculated:', (parentPos?.positionY ?? 0) - 4);
    
    createPerson(input, parentId);
    setShowAddModal(false);
  };

  // Handle Add Parent - creates person and links as parent of selected person
  const handleAddParent = (data: CreatePersonInput) => {
    const parentGeneration = selectedPerson?.generation ?? 0;
    const newParentGeneration = parentGeneration - 1;
    
    // Calculate position: place parent above the selected person
    const parentPos = selectedPerson;
    
    createPerson(
      {
        ...data,
        gender: data.gender.toUpperCase() as any,
        generation: newParentGeneration,
        positionX: parentPos?.positionX ?? 0,
        positionY: (parentPos?.positionY ?? 0) + 4, // above child
        positionZ: parentPos?.positionZ ?? 0,
      },
      undefined
    ).then((result) => {
      const newPersonId = result?.data?.createPerson?.id;
      if (selectedNodeId && newPersonId) {
        addParent(selectedNodeId, newPersonId);
      }
    }).catch((err) => {
      console.error('[Sidebar] Error creating parent:', err);
    });
    setShowAddParentModal(false);
  };

  // Handle Add Spouse - creates person and links as spouse of selected person
  const handleAddSpouse = (data: CreatePersonInput) => {
    // Calculate position: place spouse next to the selected person (to the side)
    const spousePos = selectedPerson;
    
    createPerson(
      {
        ...data,
        gender: data.gender.toUpperCase() as any,
        generation: selectedPerson?.generation ?? 1,
        positionX: (spousePos?.positionX ?? 0) + 4, // to the right of selected person
        positionY: spousePos?.positionY ?? 0,
        positionZ: spousePos?.positionZ ?? 0,
      },
      undefined
    ).then((result) => {
      const newSpouseId = result?.data?.createPerson?.id;
      if (selectedNodeId && newSpouseId) {
        addSpouse(selectedNodeId, newSpouseId);
      }
    }).catch((err) => {
      console.error('[Sidebar] Error creating spouse:', err);
    });
    setShowAddSpouseModal(false);
  };

  // Handle Edit Person
  const handleEditPerson = async (data: Partial<CreatePersonInput>) => {
    console.log('[Sidebar] handleEditPerson called with data:', data);
    console.log('[Sidebar] selectedNodeId:', selectedNodeId);
    if (selectedNodeId) {
      try {
        const result = await updatePerson(selectedNodeId, {
          ...data,
          gender: data.gender?.toUpperCase() as any,
        });
        console.log('[Sidebar] updatePerson result:', result);
      } catch (err) {
        console.error('[Sidebar] Error updating person:', err);
      }
      setEditingPerson(null);
    }
  };

  // Open edit modal with fresh person data
  const handleOpenEdit = () => {
    if (selectedPerson) {
      setEditingPerson(selectedPerson);
    }
  };

  if (!selectedNodeId) {
    // Don't show anything when no person is selected - details appear on click
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedPerson) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">❓</div>
          <p>Person not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <PersonAvatar person={selectedPerson} size="xlarge" />

          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {selectedPerson.firstName} {selectedPerson.middleName && `${selectedPerson.middleName} `}{selectedPerson.lastName}
          </h2>

          {selectedPerson.maidenName && selectedPerson.gender === 'female' && (
            <p className="text-sm text-gray-500">née {selectedPerson.maidenName}</p>
          )}

          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
            <span className={`w-2 h-2 rounded-full ${
              selectedPerson.gender === 'male' ? 'bg-blue-500' :
              selectedPerson.gender === 'female' ? 'bg-pink-500' :
              selectedPerson.gender === 'other' ? 'bg-purple-500' : 'bg-gray-500'
            }`} />
            <span className="capitalize">{selectedPerson.gender || 'unknown'}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {selectedPerson.birthDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">Born</p>
              <p className="text-gray-900">{selectedPerson.birthDate}</p>
              {selectedPerson.birthPlace && (
                <p className="text-sm text-gray-500">{selectedPerson.birthPlace}</p>
              )}
            </div>
          )}

          {selectedPerson.deathDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">Died</p>
              <p className="text-gray-900">{selectedPerson.deathDate}</p>
              {selectedPerson.deathPlace && (
                <p className="text-sm text-gray-500">{selectedPerson.deathPlace}</p>
              )}
            </div>
          )}

          {selectedPerson.bio && (
            <div>
              <p className="text-sm font-medium text-gray-500">Bio</p>
              <p className="text-gray-700">{selectedPerson.bio}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Generation</p>
            <p className="text-gray-900">{selectedPerson.generation}</p>
          </div>
        </div>
        
        {/* Family Relations Section */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Family</h3>
          
          {/* Parents */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Parents</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Father:</span>
                {renderRelationLink(getFather(), 'father')}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Mother:</span>
                {renderRelationLink(getMother(), 'mother')}
              </div>
            </div>
          </div>
          
          {/* Spouse */}
          {spouses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Spouse</p>
              <div className="space-y-1">
                {spouses.map((spouse) => (
                  <div key={spouse.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectPerson(spouse.id)}
                      className="text-purple-600 hover:text-purple-800 hover:underline text-sm"
                    >
                      {getFullName(spouse)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Siblings */}
          {siblings.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Siblings ({siblings.length})</p>
              <div className="flex flex-wrap gap-1">
                {siblings.map((sibling) => (
                  <button
                    key={sibling.id}
                    onClick={() => handleSelectPerson(sibling.id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm bg-blue-50 px-2 py-0.5 rounded"
                  >
                    {sibling.firstName} {sibling.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Children */}
          {children.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Children ({children.length})</p>
              <div className="flex flex-wrap gap-1">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectPerson(child.id)}
                    className="text-green-600 hover:text-green-800 hover:underline text-sm bg-green-50 px-2 py-0.5 rounded"
                  >
                    {child.firstName} {child.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {/* Admin-only editing controls */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddParentModal(true)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + Add Parent
                </button>
                <button
                  onClick={() => setShowAddSpouseModal(true)}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  + Add Spouse
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenEdit}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Child
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Show login prompt for non-admins */}
          {!isAdmin && (
            <div className="p-3 bg-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-500">Log in to edit this person</p>
            </div>
          )}
        </div>


        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 mb-3">Are you sure you want to delete this person and all their relationships?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <AddPersonModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddChild}
        parentId={selectedNodeId}
        defaultLastName={defaultLastName}
        defaultMiddleName={defaultMiddleName}
      />

      <AddParentModal
        isOpen={showAddParentModal}
        onClose={() => setShowAddParentModal(false)}
        onSubmit={handleAddParent}
        childId={selectedNodeId}
      />

      <AddSpouseModal
        isOpen={showAddSpouseModal}
        onClose={() => setShowAddSpouseModal(false)}
        onSubmit={handleAddSpouse}
        personId={selectedNodeId}
      />

      {/* Edit Person Modal */}
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={() => setEditingPerson(null)}
          onSubmit={handleEditPerson}
        />
      )}
    </div>
  );
}
