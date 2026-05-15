// ==========================================
// GRAPHQL CLIENT
// Apollo Client configuration for the family tree API
// ==========================================

import { ApolloClient, InMemoryCache, HttpLink, gql, ApolloLink, from } from '@apollo/client';
import { useAuthStore } from '../store/authStore';

// Auth link to add Authorization header
const authLink = new ApolloLink((operation, forward) => {
  const token = useAuthStore.getState().token;
  
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

export const APOLLO_CLIENT = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

// ==========================================
// QUERIES
// ==========================================

export const GET_PERSONS = gql`
  query GetPersons {
    persons {
      id
      firstName
      middleName
      lastName
      maidenName
      gender
      birthDate
      deathDate
      birthPlace
      deathPlace
      photo
      bio
      generation
      positionX
      positionY
      positionZ
    }
  }
`;

export const GET_PERSON = gql`
  query GetPerson($id: String!) {
    person(id: $id) {
      id
      firstName
      middleName
      lastName
      maidenName
      gender
      birthDate
      deathDate
      birthPlace
      deathPlace
      photo
      bio
      notes
      generation
      positionX
      positionY
      positionZ
      createdAt
      updatedAt
    }
  }
`;

export const GET_TREE_ROOT = gql`
  query GetTreeRoot {
    treeRoot {
      id
      firstName
      lastName
      gender
      photo
      generation
    }
  }
`;

export const GET_TREE_CHILDREN = gql`
  query GetTreeChildren($parentId: String!) {
    treeChildren(parentId: $parentId) {
      id
      firstName
      lastName
      gender
      birthDate
      photo
      generation
    }
  }
`;

export const GET_TREE_PARENTS = gql`
  query GetTreeParents($childId: String!) {
    parents(childId: $childId) {
      id
      firstName
      lastName
      gender
      birthDate
      photo
      generation
    }
  }
`;

export const GET_TREE_SIBLINGS = gql`
  query GetTreeSiblings($personId: String!) {
    siblings(personId: $personId) {
      id
      firstName
      lastName
      gender
      birthDate
      photo
      generation
    }
  }
`;

export const GET_ALL_PARENT_CHILDREN = gql`
  query GetAllParentChildRelations {
    allParentChildRelations {
      parentId
      childId
    }
  }
`;

export const GET_TREE_STATS = gql`
  query GetTreeStats {
    treeStats {
      totalPeople
      totalGenerations
      maxDepth
    }
  }
`;

export const GET_DESCENDANTS = gql`
  query GetDescendants($rootId: String!, $maxDepth: Number) {
    descendants(rootId: $rootId, maxDepth: $maxDepth) {
      id
      firstName
      lastName
      gender
      birthDate
      generation
    }
  }
`;

export const SEARCH_PERSONS = gql`
  query SearchPersons($query: String!) {
    searchPersons(query: $query) {
      id
      firstName
      lastName
      gender
      generation
    }
  }
`;

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_PERSON = gql`
  mutation CreatePerson($input: CreatePersonInputGQL!, $parentId: String) {
    createPerson(input: $input, parentId: $parentId) {
      id
      firstName
      lastName
      gender
      photo
      positionX
      positionY
      positionZ
    }
  }
`;

export const UPDATE_PERSON = gql`
  mutation UpdatePerson($id: String!, $input: UpdatePersonInputGQL!) {
    updatePerson(id: $id, input: $input) {
      id
      firstName
      middleName
      lastName
      maidenName
      gender
      birthDate
      deathDate
      birthPlace
      deathPlace
      photo
      bio
      generation
      positionX
      positionY
      positionZ
    }
  }
`;

export const DELETE_PERSON = gql`
  mutation DeletePerson($id: String!) {
    deletePerson(id: $id)
  }
`;

export const UPDATE_PERSON_POSITION = gql`
  mutation UpdatePersonPosition($id: String!, $input: UpdatePersonPositionInputGQL!) {
    updatePersonPosition(id: $id, input: $input) {
      id
      positionX
      positionY
      positionZ
    }
  }
`;

export const GET_TREE_CHILDREN_FULL = gql`
  query GetTreeChildrenFull($parentId: String!) {
    treeChildren(parentId: $parentId) {
      id
      firstName
      lastName
      gender
      birthDate
      photo
      generation
      positionX
      positionY
      positionZ
    }
  }
`;

export const ADD_PARENT = gql`
  mutation AddParent($parentId: String!, $childId: String!, $type: String = "biological") {
    addParent(parentId: $parentId, childId: $childId, type: $type)
  }
`;

export const ADD_SPOUSE = gql`
  mutation AddSpouse($personId: String!, $spouseId: String!, $type: String = "married") {
    addSpouse(personId: $personId, spouseId: $spouseId, type: $type)
  }
`;

export const GET_ALL_SPOUSE_RELATIONS = gql`
  query GetAllSpouseRelations {
    allSpouseRelations {
      personId
      spouseId
    }
  }
`;

// ==========================================
// AUTH MUTATIONS & QUERIES
// ==========================================

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($username: String!, $password: String!, $email: String) {
    register(username: $username, password: $password, email: $email) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      token
      user {
        id
        username
        email
        role
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      role
    }
  }
`;
