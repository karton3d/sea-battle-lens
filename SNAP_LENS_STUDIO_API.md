# Snap Lens Studio API - Релевантная документация для проекта "Морской бой"

## Оглавление
1. [BaseScriptComponent](#basescriptcomponent)
2. [SceneObject](#sceneobject)
3. [ObjectPrefab](#objectprefab)
4. [Transform](#transform)
5. [ScriptScene (global.scene)](#scriptscene-globalscene)
6. [Component](#component)
7. [Turn-Based Component](#turn-based-component)
8. [InteractionComponent](#interactioncomponent)

---

## BaseScriptComponent

Базовый класс для всех скриптов в Snap Lens Studio. Используется для создания пользовательских компонентов.

### Пример использования:

```typescript
// @component
export class MyScript extends BaseScriptComponent {
    @input
    myParameter: Type;
    
    onAwake() {
        // Инициализация при создании объекта
    }
    
    onStart() {
        // Вызывается после onAwake
    }
}
```

### Основные методы жизненного цикла:
- `onAwake()` - вызывается при создании объекта, раньше всех других событий
- `onStart()` - вызывается после всех onAwake событий
- `onUpdate()` - вызывается каждый кадр
- `onDestroy()` - вызывается при уничтожении объекта

### Декоратор @input:
Используется для создания входных параметров, которые можно настроить в Inspector панели Lens Studio.

```typescript
@input
cellPrefab: ObjectPrefab;

@input
gridSize: number = 10;
```

---

## SceneObject

Представляет объект в сцене. Каждый объект имеет Transform и может содержать компоненты.

### Основные методы:

#### Создание компонентов:
```typescript
createComponent<K extends keyof ComponentNameMap>(typeName: K): ComponentNameMap[K]
```

#### Работа с иерархией:
```typescript
getParent(): SceneObject | null
setParent(newParent: SceneObject): void
getChild(index: number): SceneObject
getChildrenCount(): number
```

#### Получение компонентов:
```typescript
getComponent<K extends keyof ComponentNameMap>(componentType: K): ComponentNameMap[K]
getComponents<K extends keyof ComponentNameMap>(componentType: K): ComponentNameMap[K][]
```

#### Уничтожение:
```typescript
destroy(): void
```

#### Получение Transform:
```typescript
getTransform(): Transform
```

### Пример:
```typescript
const sceneObject = global.scene.createSceneObject("MyObject");
const transform = sceneObject.getTransform();
transform.setLocalPosition(new vec3(0, 0, 0));
```

---

## ObjectPrefab

Класс для работы с префабами объектов. Префабы можно инстанцировать в сцене.

### Основные методы:

#### Синхронное создание экземпляра:
```typescript
instantiate(parent: SceneObject): SceneObject
```
Создает новый экземпляр префаба под указанным родительским объектом. Если parent равен null, объект создается без родителя.

#### Асинхронное создание экземпляра:
```typescript
instantiateAsync(
    parent: SceneObject,
    onSuccess: (sceneObject: SceneObject) => void,
    onFailure: (error: string) => void,
    onProgress: (progress: number) => void
): void
```

### Пример использования:
```typescript
@input
cellPrefab: ObjectPrefab;

const parent = global.scene.createSceneObject("Grid");
const cell = this.cellPrefab.instantiate(parent);
cell.name = "Cell_0_0";
```

### Документация:
- [Prefabs Guide](https://developers.snap.com/lens-studio/lens-studio-workflow/prefabs)

---

## Transform

Представляет трансформацию (позицию, вращение, масштаб) объекта в сцене.

### Основные методы:

#### Локальные координаты (относительно родителя):
```typescript
getLocalPosition(): vec3
setLocalPosition(pos: vec3): void
getLocalRotation(): quat
setLocalRotation(rotation: quat): void
getLocalScale(): vec3
setLocalScale(scale: vec3): void
```

#### Мировые координаты:
```typescript
getWorldPosition(): vec3
setWorldPosition(pos: vec3): void
getWorldRotation(): quat
setWorldRotation(rotation: quat): void
getWorldScale(): vec3
setWorldScale(scale: vec3): void
```

#### Матрицы трансформации:
```typescript
getWorldTransform(): mat4
getInvertedWorldTransform(): mat4
setLocalTransform(transformMat: mat4): void
setWorldTransform(transformMat: mat4): void
```

#### Получение SceneObject:
```typescript
getSceneObject(): SceneObject
```

### Пример:
```typescript
const transform = sceneObject.getTransform();
transform.setLocalPosition(new vec3(1, 0, 2));
transform.setLocalScale(new vec3(1, 1, 1));
```

---

## ScriptScene (global.scene)

Представляет сцену линзы. Доступен через `global.scene`.

### Основные методы:

#### Создание объектов:
```typescript
createSceneObject(name: string): SceneObject
```
Добавляет новый SceneObject с указанным именем в сцену.

#### Получение корневых объектов:
```typescript
getRootObject(index: number): SceneObject
getRootObjectsCount(): number
```

#### Создание текстур:
```typescript
createRenderTargetTexture(): Texture
createDepthStencilRenderTargetTexture(): Texture
```

#### Информация о камере:
```typescript
getCameraType(): string
// Возвращает "back" для задней камеры, "front" для передней
```

#### Состояние записи:
```typescript
isRecording(): boolean
```

### Свойства:
- `liveTarget: Texture` - Render Target для живой камеры
- `liveOverlayTarget: Texture` - Render Target без предсказательного движения
- `captureTarget: Texture` - Render Target записанного видео

### Пример:
```typescript
const gridObject = global.scene.createSceneObject("Grid");
const transform = gridObject.getTransform();
transform.setLocalPosition(new vec3(0, 0, 0));
```

---

## Component

Базовый класс для всех компонентов. Компоненты добавляют поведение к SceneObject.

### Основные методы:

#### Получение связанных объектов:
```typescript
getSceneObject(): SceneObject
getTransform(): Transform
```

#### Уничтожение:
```typescript
destroy(): void
```

### Свойства:
- `enabled: boolean` - включен/выключен компонент
- `isEnabledInHierarchy: boolean` - включен ли компонент в иерархии
- `sceneObject: SceneObject` - объект, к которому прикреплен компонент

### Типы компонентов:
- `ScriptComponent` - скриптовый компонент
- `Camera` - камера
- `LightSource` - источник света
- `MeshVisual` / `RenderMeshVisual` - визуализация меша
- `InteractionComponent` - компонент взаимодействия
- И многие другие...

### Пример:
```typescript
const sceneObject = global.scene.createSceneObject("MyObject");
const scriptComponent = sceneObject.createComponent("Component.Script");
```

---

## Типы данных

### vec3
Трехмерный вектор для позиций, масштабов и т.д.
```typescript
const position = new vec3(x, y, z);
```

### quat
Кватернион для вращений.
```typescript
const rotation = new quat(x, y, z, w);
```

### mat4
4x4 матрица трансформации.

---

---

## Turn-Based Component

Component for implementing turn-based multiplayer games in Snap Lens Studio. Allows players to take turns and share game state.

### Key Features:
- Turn management between two players
- Turn data storage and retrieval
- Turn history tracking
- Player flow objects (different UI for each player)
- Game over detection
- Turn submission and validation

### Component Inputs (from Scene.scene):
- `requireTurnSubmission: boolean` - Require explicit turn submission
- `allowChangingTurnVariablesAfterTurnSubmission: boolean` - Allow data changes after submission
- `useTurnLimit: boolean` - Enable turn limit
- `turnLimitInput: number` - Maximum number of turns
- `useTurnHistory: boolean` - Track turn history
- `turnsSavedLimitInput: number` - How many turns to save
- `tappableAreasInput: SceneObject[]` - Areas that can be tapped
- `user1FlowObjectsInputSO: SceneObject[]` - Objects shown to player 1
- `user2FlowObjectsInputSO: SceneObject[]` - Objects shown to player 2
- `gameOverObjectsInputSO: SceneObject[]` - Objects shown on game over
- `defaultTurnVariables: object` - Default variables stored with each turn

### Callbacks:
- `_onTurnStartResponses` - Called when a turn starts
- `_onTurnEndResponses` - Called when a turn ends
- `_onGameOverResponses` - Called when game ends

### Turn Data:
- Each turn can store associated data (game state, moves, etc.)
- Data persists between turns
- Can be retrieved from turn history

### Documentation Needed:
- ✅ Official Turn-Based component API reference - **FOUND**
- ✅ Turn data storage format - **RESEARCHED**
- ✅ Callback implementation (Response System) - **RESEARCHED**
- ✅ Player flow management - **RESEARCHED**

### Official Documentation:
- **Turn-Based Component**: https://developers.snap.com/lens-studio/features/games/turn-based
- **Turn-Based Player Info**: https://developers.snap.com/lens-studio/features/games/turn-based-player-info
- **Turn-Based Game Example**: https://developers.snap.com/lens-studio/examples/lens-examples/turn-based-game
- **Games Overview**: https://developers.snap.com/lens-studio/features/games/games-overview

### Detailed Research:
See `TURN_BASED_RESEARCH.md` for comprehensive research findings, integration guide, and implementation strategy.

### References:
- Component exists in `Scene.scene` as "Turn Based"
- Script Asset ID: `2485c892-b1f1-4924-9453-ce440bd2cdfb`
- SceneObject ID: `9129c439-40f1-4777-884d-a1e0f69039ca`

---

## InteractionComponent

Component for handling user interactions (taps, touches) on objects.

### Usage:
Add to SceneObject to make it tappable/interactable.

### Methods:
```typescript
// Get interaction component
const interaction = sceneObject.getComponent("Component.Interaction") as InteractionComponent;

// Check if tapped
// (Typically handled through events/callbacks)
```

### Setup:
1. Add InteractionComponent to SceneObject
2. Configure tap area/bounds
3. Handle tap events in script

### Documentation Needed:
- Official InteractionComponent API
- Event handling system
- Tap detection methods

---

## Полезные ссылки

- [Snap Lens Studio Documentation](https://developers.snap.com/lens-studio/)
- [Scripting Overview](https://developers.snap.com/lens-studio/guides/scripting/scripting-overview)
- [Prefabs Guide](https://developers.snap.com/lens-studio/lens-studio-workflow/prefabs)
- [Scene Setup](https://developers.snap.com/lens-studio/lens-studio-workflow/scene-set-up)
- [Turn-Based Games](https://developers.snap.com/lens-studio/) - *Need to find specific documentation*

---

## Примечания для проекта "Морской бой"

1. **GridGenerator.ts** использует:
   - `BaseScriptComponent` для создания скрипта
   - `@input` для параметров (cellPrefab, gridSize, cellSize)
   - `ObjectPrefab.instantiate()` для создания ячеек
   - `Transform.setLocalPosition()` для позиционирования
   - `global.scene.createSceneObject()` для создания родительского объекта

2. **Рекомендации:**
   - Создайте префаб ячейки (например, бокс) в Lens Studio
   - Назначьте префаб в параметр `cellPrefab` в Inspector
   - Настройте `gridSize` (по умолчанию 10x10)
   - Настройте `cellSize` для расстояния между ячейками

3. **Turn-Based Integration (Future):**
   - Turn-Based component exists in scene
   - Need to research API for integration
   - Will handle multiplayer turn flow
   - Store game state in turn data
