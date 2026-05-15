// ==========================================
// GRAPHQL HOOKS
// Custom hooks for GraphQL data fetching
// ==========================================

import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  GET_PERSONS,
  GET_PERSON,
  GET_TREE_ROOT,
  GET_TREE_CHILDREN,
  GET_TREE_STATS,
  GET_DESCENDANTS,
  SEARCH_PERSONS,
  CREATE_PERSON,
  UPDATE_PERSON,
  DELETE_PERSON,
  ADD_PARENT,
  ADD_SPOUSE,
  GET_ALL_PARENT_CHILDREN,
  GET_ALL_SPOUSE_RELATIONS,
  UPDATE_PERSON_POSITION,
} from './client';
import type { Person, CreatePersonInput } from '@tree/types';

// ==========================================
// PERSON HOOKS
// ==========================================

export function usePersons() {
  const { data, loading, error, refetch } = useQuery(GET_PERSONS);
  
  // Normalize gender to lowercase (API returns "MALE" but types expect "male")
  const persons = (data?.persons ?? []).map((p: any) => ({
    ...p,
    gender: p.gender?.toLowerCase() || 'unknown'
  })) as Person[];
  
  return {
    persons,
    loading,
    error,
    refetch,
  };
}

export function usePerson(id: string | null) {
  const { data, loading, error } = useQuery(GET_PERSON, {
    variables: { id },
    skip: !id,
  });
  
  // Normalize gender to lowercase (API returns "MALE" but types expect "male")
  const person = data?.person ? {
    ...data.person,
    gender: data.person.gender?.toLowerCase() || 'unknown'
  } : null;
  
  return {
    person: person as Person | null,
    loading,
    error,
  };
}

// ==========================================
// TREE HOOKS (Lazy loading for infinite tree)
// ==========================================

export function useTreeRoot() {
  const { data, loading, error, refetch } = useQuery(GET_TREE_ROOT);
  return {
    rootNodes: (data?.treeRoot ?? []) as Person[],
    loading,
    error,
    refetch,
  };
}

export function useTreeChildren(parentId: string | null) {
  const { data, loading, error, refetch } = useQuery(GET_TREE_CHILDREN, {
    variables: { parentId },
    skip: !parentId,
  });
  return {
    children: (data?.treeChildren ?? []) as Person[],
    loading,
    error,
    refetch,
  };
}

export function useLazyTreeChildren() {
  const [fetchChildren, { data, loading, error }] = useLazyQuery(GET_TREE_CHILDREN);
  return {
    fetchChildren: (parentId: string) => fetchChildren({ variables: { parentId } }),
    children: (data?.treeChildren ?? []) as Person[],
    loading,
    error,
  };
}

export function useLazyDescendants() {
  const [fetchDescendants, { data, loading, error }] = useLazyQuery(GET_DESCENDANTS);
  return {
    fetchDescendants: (rootId: string, maxDepth: number = 3) =>
      fetchDescendants({ variables: { rootId, maxDepth } }),
    descendants: (data?.descendants ?? []) as Person[],
    loading,
    error,
  };
}

export function useTreeStats() {
  const { data, loading, error, refetch } = useQuery(GET_TREE_STATS);
  return {
    stats: data?.treeStats ?? { totalPeople: 0, totalGenerations: 0, maxDepth: 0 },
    loading,
    error,
    refetch,
  };
}

export function useParentChildRelations() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_PARENT_CHILDREN, {
    fetchPolicy: 'cache-and-network',
  });
  return {
    relations: (data?.allParentChildRelations ?? []) as { parentId: string; childId: string }[],
    loading,
    error,
    refetch,
  };
}

export function useSpouseRelations() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_SPOUSE_RELATIONS, {
    fetchPolicy: 'cache-and-network',
  });
  return {
    relations: (data?.allSpouseRelations ?? []) as { personId: string; spouseId: string }[],
    loading,
    error,
    refetch,
  };
}

export function useSearchPersons(query: string) {
  const { data, loading, error } = useQuery(SEARCH_PERSONS, {
    variables: { query },
    skip: query.length < 2,
  });
  return {
    results: (data?.searchPersons ?? []) as Person[],
    loading,
    error,
  };
}

// ==========================================
// MUTATION HOOKS
// ==========================================

export function useCreatePerson() {
  const [createPerson, { data, loading, error }] = useMutation(CREATE_PERSON, {
    refetchQueries: [{ query: GET_PERSONS }, { query: GET_TREE_STATS }, { query: GET_ALL_PARENT_CHILDREN }],
  });
  
  const wrappedCreatePerson = (input: CreatePersonInput, parentId?: string) => {
    console.log('[useCreatePerson] createPerson called with input:', JSON.stringify(input, null, 2));
    console.log('[useCreatePerson] parentId:', parentId);
    return createPerson({ variables: { input, parentId } });
  };
  
  return {
    createPerson: wrappedCreatePerson,
    result: data?.createPerson,
    loading,
    error,
  };
}

export function useAddParent() {
  const [addParent, { data, loading, error }] = useMutation(ADD_PARENT, {
    refetchQueries: [{ query: GET_PERSONS }, { query: GET_TREE_STATS }, { query: GET_ALL_PARENT_CHILDREN }],
  });
  return {
    addParent: (childId: string, parentId: string) => {
      return addParent({ variables: { childId, parentId } });
    },
    result: data?.addParent,
    loading,
    error,
  };
}

export function useAddSpouse() {
  const [addSpouse, { data, loading, error }] = useMutation(ADD_SPOUSE, {
    refetchQueries: [{ query: GET_PERSONS }, { query: GET_TREE_STATS }, { query: GET_ALL_PARENT_CHILDREN }, { query: GET_ALL_SPOUSE_RELATIONS }],
  });
  return {
    addSpouse: (personId: string, spouseId: string) => {
      return addSpouse({ variables: { personId, spouseId } });
    },
    result: data?.addSpouse,
    loading,
    error,
  };
}

export function useUpdatePerson() {
  const [updatePerson, { data, loading, error }] = useMutation(UPDATE_PERSON, {
    refetchQueries: [{ query: GET_PERSONS }],
  });
  return {
    updatePerson: (id: string, input: Partial<CreatePersonInput>) =>
      updatePerson({ variables: { id, input } }),
    result: data?.updatePerson,
    loading,
    error,
  };
}

export function useDeletePerson() {
  const [deletePerson, { data, loading, error }] = useMutation(DELETE_PERSON, {
    refetchQueries: [{ query: GET_PERSONS }, { query: GET_TREE_STATS }, { query: GET_ALL_PARENT_CHILDREN }],
  });
  return {
    deletePerson: (id: string) => deletePerson({ variables: { id } }),
    success: data?.deletePerson,
    loading,
    error,
  };
}

export function useUpdatePersonPosition() {
  const [updatePosition, { data, loading, error }] = useMutation(UPDATE_PERSON_POSITION, {
    refetchQueries: [{ query: GET_PERSONS }],
  });
  return {
    updatePosition: (id: string, positionX: number, positionY: number, positionZ: number) => {
      return updatePosition({
        variables: {
          id,
          input: { positionX, positionY, positionZ }
        }
      });
    },
    result: data?.updatePersonPosition,
    loading,
    error,
  };
}
