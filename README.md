# Enterprise Data Grid Application

A modern, dataset-agnostic data grid application built with Vue 3, Quasar, and Express.js.

## Features

- **100% API-Based**: All grids use REST API data sources (no MySQL dependencies)
- **Generic Grid System**: Configuration-driven architecture supporting multiple REST APIs
- **Inline Editing**: Edit cells directly in the grid with type-specific editors
- **Expandable Rows**: View and edit detailed information in expandable panels
- **Bulk Operations**: Perform actions on multiple selected rows simultaneously
- **Advanced Filtering**: Search, filter, and sort data across columns
- **Column Management**: Show/hide, reorder, and resize columns
- **Responsive Design**: Built with Quasar UI framework for modern interfaces
- **Zero Hard-Coded Logic**: Completely data-agnostic - works with any REST API

## Tech Stack

### Frontend
- Vue 3 with Composition API
- Quasar Framework
- TanStack Table (Vue Table)
- TanStack Query (Vue Query)
- Pinia for state management
- TypeScript

### Backend
- Express.js
- Generic query builder for REST API data sources
- No database dependencies

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
├── client/              # Vue 3 frontend application
│   ├── src/
│   │   ├── components/  # Reusable Vue components
│   │   ├── pages/       # Page components (GenericGrid)
│   │   ├── lib/         # Utilities and API clients
│   │   └── stores/      # Pinia stores
├── server/              # Express.js backend
│   ├── generic-routes.ts        # Generic API endpoints
│   ├── generic-grid-service.ts  # Grid service layer
│   └── generic-query-builder.ts # Query builder for API data sources
├── shared/              # Shared types and configurations
│   ├── grid-config.ts   # Grid configurations
│   └── types.ts         # TypeScript type definitions
└── examples/            # Example implementations
```

## Adding a New Grid

To add a new grid, simply add a configuration to `shared/grid-config.ts`:

```typescript
export const GRID_CONFIGS: Record<string, GridConfig> = {
  myGrid: {
    id: 'myGrid',
    name: 'My Grid',
    icon: 'table_chart',
    displayName: 'item',
    displayNamePlural: 'items',
    dataSource: {
      type: 'api',
      api: {
        baseUrl: 'https://api.example.com',
        endpoints: {
          list: '/items',
          get: '/items/{id}',
          create: '/items',
          update: '/items/{id}',
          delete: '/items/{id}'
        }
      }
    },
    columns: [
      { id: 'id', label: 'ID', type: 'number', editable: false },
      { id: 'name', label: 'Name', type: 'string', editable: true },
      // ... more columns
    ],
    // ... other configuration
  }
}
```

No backend code changes required! The grid will automatically appear in the navigation.

## Configuration

Grid configurations support:
- REST API data sources with configurable endpoints
- Column definitions with types (string, number, date, boolean, select)
- Inline editing capabilities
- Expandable row panels
- Bulk operations (edit, delete, export)
- Search and filtering
- Permissions and access control

## Current Grids

The application comes with two example grids using the DummyJSON API:

1. **Users Grid** (`/grid/users`) - User management with full CRUD
2. **Products Grid** (`/grid/products`) - Product catalog

Both grids demonstrate the complete feature set without requiring any database setup.

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

## Architecture Principles

This application follows strict data-agnostic principles:

- ✅ No hard-coded field names in components
- ✅ No dataset-specific logic in business code
- ✅ All features work through configuration
- ✅ API-based data sources only
- ✅ Dynamic messages using grid config
- ✅ Zero MySQL dependencies

## License

MIT
