# Meme Fleet Battle 🚀

A viral, meme-filled AR Battleship game for Snap Lens Studio. Instead of traditional ships, players hunt for wacky 3D objects (cows, toilets, sneakers, flying eyes, etc.) using X-ray scanning mechanics.

## 🎮 Game Concept

**Meme Fleet Battle** is a turn-based strategy game that puts a fun, shareable twist on the classic Battleship formula:
- Hide and hunt for meme-worthy 3D objects on a grid
- Use UFO saucer X-ray scanning to reveal hidden objects
- Play solo or with a friend via Snap's Turn-Based system
- Viral, meme-focused aesthetic for maximum shareability

## 📋 Project Status

### ✅ Completed
- Grid generation system (10x10 configurable)
- Object placement system with collision detection
- Visual grid with proper spacing
- Objects positioned above grid

### 🚧 In Progress
- Random object placement algorithm
- Turn-Based multiplayer integration

### 📝 Planned
- Intro screen with game preview
- Single Player / Multiplayer menu
- Turn-based gameplay flow
- UFO scanning animations
- X-ray reveal effects
- Victory system

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed development plan and asset list.

## 🏗️ Project Structure

```
2016_01_Play Everywhere_Sea_battle_lens/
├── Assets/
│   ├── GridGenerator.ts          # Grid generation & object placement
│   ├── [Future scripts...]       # Game logic, UI, animations
│   └── [Prefabs...]              # 3D objects, UI elements
├── Support/
│   └── StudioLib.d.ts            # TypeScript definitions for Snap Lens Studio API
├── PROJECT_PLAN.md               # Detailed development plan & asset list
├── SNAP_LENS_STUDIO_API.md       # API documentation
└── README.md                      # This file
```

## 🚀 Quick Start

### 1. Setup Grid

1. Open project in Snap Lens Studio
2. Create a cell prefab (e.g., Box object)
3. Add `GridGenerator.ts` script to a SceneObject
4. Configure in Inspector:
   - **Cell Prefab**: Your cell prefab
   - **Grid Size**: 10 (default)
   - **Cell Size**: 10.0 (default)
   - **Cell Spacing**: 1.0 (default)
   - **Ship Prefabs**: Assign 1x1, 2x1, 3x1, 4x1 object prefabs

### 2. Create Object Prefabs

Create prefabs for meme objects:
- **1x1 objects**: Cow, Toilet, Sneaker, Flying Eye (4 types)
- **2x1 objects**: Extended versions (3 types)
- **3x1 objects**: Extended versions (2 types)
- **4x1 objects**: Longest version (1 type)

**Important:** Ensure visibility is **enabled** in all prefabs!

### 3. Run

The grid and test objects will be generated automatically on lens start.

## 📚 API Documentation

### GridGenerator Component

#### Inputs
- `cellPrefab: ObjectPrefab` - Prefab for grid cells
- `gridSize: number` - Grid size (default: 10)
- `cellSize: number` - Cell size (default: 1.0)
- `cellSpacing: number` - Spacing between cells (default: 0.1)
- `ship1Prefab: ObjectPrefab` - 1-cell object prefab
- `ship2Prefab: ObjectPrefab` - 2-cell object prefab
- `ship3Prefab: ObjectPrefab` - 3-cell object prefab
- `ship4Prefab: ObjectPrefab` - 4-cell object prefab
- `gridParent: SceneObject` - Parent for grid (optional)
- `shipHeightOffset: number` - Height offset for objects (default: 0.5)

#### Methods
- `generateGrid()` - Generates the grid
- `placeShip(gridX, gridY, length, horizontal)` - Places an object
- `clearGrid()` - Clears the grid
- `clearShips()` - Clears all objects

#### Example
```typescript
// Place a 4-cell horizontal object at position (0, 0)
gridGenerator.placeShip(0, 0, 4, true);
```

## 🎯 Development Roadmap

### Phase 1: Core Systems ✅
- [x] Grid generation
- [x] Object placement
- [ ] Random placement algorithm

### Phase 2: UI & Screens
- [ ] Intro screen
- [ ] Menu system
- [ ] Game setup screen

### Phase 3: Gameplay
- [ ] Turn-Based integration
- [ ] Cell interaction
- [ ] UFO scanning
- [ ] X-ray effects

### Phase 4: Polish
- [ ] Animations
- [ ] Sound effects
- [ ] Victory system
- [ ] Final testing

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for complete task breakdown.

## 📖 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete development plan, task list, and asset requirements
- **[SNAP_LENS_STUDIO_API.md](./SNAP_LENS_STUDIO_API.md)** - Relevant Snap Lens Studio API documentation

## 🛠️ Technical Details

### Requirements
- Snap Lens Studio (latest version)
- Turn-Based component (already in scene)
- TypeScript support enabled

### Known Issues
- ✅ **Fixed:** Object visibility must be enabled in prefabs
- Object placement currently uses fixed positions (randomization in progress)

### Performance Notes
- Optimize 3D models for mobile AR
- Use efficient particle effects
- Minimize texture sizes

## 🤝 Contributing

This is a prototype project. Development plan and asset requirements are documented in `PROJECT_PLAN.md`.

## 📄 License

[Add license information]

## 🔗 Links

- [Snap Lens Studio Documentation](https://developers.snap.com/lens-studio/)
- [Scripting Overview](https://developers.snap.com/lens-studio/guides/scripting/scripting-overview)
- [Prefabs Guide](https://developers.snap.com/lens-studio/lens-studio-workflow/prefabs)
- [Turn-Based Games](https://developers.snap.com/lens-studio/) - *Documentation needed*

---

**Game Title:** Meme Fleet Battle  
**Genre:** Turn-based Strategy / AR Battleship  
**Platform:** Snap Lens Studio (AR Lens)
