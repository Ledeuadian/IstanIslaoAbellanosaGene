import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { APOLLO_CLIENT } from './graphql/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={APOLLO_CLIENT}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)