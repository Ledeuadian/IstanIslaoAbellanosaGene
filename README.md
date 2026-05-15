# Family Tree Abellanosa

An interactive 3D family tree website with infinite zoom, infinite branching, and smooth performance for large-scale family trees.

## 🌳 Features

- **3D Tree Visualization** - Organic tree-like branches rendered with Three.js
- **Infinite Zoom** - Zoom from overview to individual profiles
- **Infinite Branching** - Add unlimited descendants
- **Lazy Loading** - Only render visible nodes for performance
- **Viewport Culling** - Smart rendering based on camera position
- **Level of Detail** - Different views at different zoom levels
- **Complex Relationships** - Multiple marriages, adopted children, step-parents

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Three.js, React Three Fiber, TypeScript |
| State | Zustand |
| Styling | Tailwind CSS |
| Backend | NestJS, GraphQL |
| Database | Neo4j |
| Monorepo | Turborepo, pnpm |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Neo4j Database (local or [AuraDB](https://neo4j.com/cloud/aura-free/))

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env

# Start development servers
pnpm dev
```

### Development

```bash
# Start everything
pnpm dev

# Start frontend only
pnpm dev:web

# Start backend only
pnpm dev:api
```

## 📁 Project Structure

```
├── apps/
│   ├── web/          # React + Three.js frontend
│   └── api/          # NestJS + GraphQL backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── tree-engine/  # 3D tree layout engine
│   └── ui/           # Shared UI components
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🔍 Zoom Levels

| Zoom Level | What Shows |
|------------|-----------|
| Far | Names only |
| Medium | Photos + names |
| Close | Full details |
| Profile | Complete bio |

## 🗄️ Neo4j Graph Structure

### Nodes
- `(Person)` - Family members
- `(Family)` - Family groups
- `(Marriage)` - Marriage connections

### Relationships
- `(:Person)-[:PARENT_OF]->(:Person)`
- `(:Person)-[:MARRIED_TO]->(:Person)`
- `(:Person)-[:CHILD_OF]->(:Person)`

## 📄 License

Private - Family Tree Abellanosa
