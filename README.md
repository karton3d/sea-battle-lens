# Морской бой - Прототип игры для Snap Lens Studio

Прототип игры "Морской бой" для Snap Lens Studio с визуализацией игрового поля в виде грида.

## Структура проекта

```
2016_01_Play Everywhere_Sea_battle_lens/
├── Assets/
│   ├── GridGenerator.ts          # Скрипт для генерации грида
│   ├── ShipPlacer.ts             # Скрипт для размещения кораблей
│   └── ...
└── Support/
    └── StudioLib.d.ts            # TypeScript определения API Snap Lens Studio
```

## Установка и использование

### 1. Создание префаба ячейки

1. Откройте проект в Snap Lens Studio
2. Создайте новый 3D объект (например, Box):
   - В меню: `Objects > 3D Object > Box`
   - Или используйте существующий объект
3. Настройте размеры и материалы ячейки по вашему усмотрению
4. Сохраните объект как префаб:
   - Перетащите объект из Scene Hierarchy в папку Assets
   - Или используйте меню: `Assets > Create > Prefab`

### 2. Настройка скрипта GridGenerator

1. Добавьте скрипт `GridGenerator.ts` к объекту в сцене:
   - Создайте новый SceneObject (или используйте существующий)
   - В Inspector панели нажмите `Add Component > Script`
   - Выберите `GridGenerator.ts`

2. Настройте параметры в Inspector:
   - **Cell Prefab**: Перетащите созданный префаб ячейки
   - **Grid Size**: Размер грида (по умолчанию 10x10)
   - **Cell Size**: Размер одной ячейки (по умолчанию 1.0)
   - **Grid Parent**: (Опционально) Родительский объект для ячеек

### 3. Запуск

При запуске линзы грид будет автоматически сгенерирован в методе `onAwake()`.

## API скрипта GridGenerator

### Параметры (@input)

- `cellPrefab: ObjectPrefab` - Префаб ячейки грида
- `gridSize: number` - Размер грида (по умолчанию 10)
- `cellSize: number` - Размер одной ячейки (по умолчанию 1.0)
- `gridParent: SceneObject` - Родительский объект (опционально, если не задан, создается автоматически)

### Методы

- `generateGrid()` - Генерирует грид заданного размера
- `clearGrid()` - Очищает текущий грид
- `regenerateGrid(newSize?: number)` - Пересоздает грид с новым размером

### Пример использования в коде

```typescript
// Получить компонент GridGenerator
const gridGenerator = sceneObject.getComponent("Component.Script") as GridGenerator;

// Изменить размер грида и пересоздать
gridGenerator.regenerateGrid(15); // Создаст грид 15x15
```

## Особенности реализации

- Грид центрируется относительно начала координат
- Ячейки позиционируются с учетом размера ячейки (`cellSize`)
- Каждая ячейка получает уникальное имя: `Cell_X_Y`
- Родительский объект создается автоматически с именем "Grid", если не указан `gridParent`

## Документация

Подробная документация по API Snap Lens Studio находится в файле:
- `SNAP_LENS_STUDIO_API.md` - Релевантные части API для проекта

### 3. Настройка скрипта ShipPlacer

1. Добавьте скрипт `ShipPlacer.ts` к объекту в сцене:
   - Создайте новый SceneObject (или используйте существующий)
   - В Inspector панели нажмите `Add Component > Script`
   - Выберите `ShipPlacer.ts`

2. Создайте префабы кораблей:
   - Создайте 4 разных префаба для кораблей (1, 2, 3, 4 палубы)
   - Например, используйте Box объекты разной длины
   - Сохраните их как префабы в папке Assets

3. Настройте параметры в Inspector:
   - **Ship 1 Prefab**: Префаб однопалубного корабля
   - **Ship 2 Prefab**: Префаб двухпалубного корабля
   - **Ship 3 Prefab**: Префаб трехпалубного корабля
   - **Ship 4 Prefab**: Префаб четырехпалубного корабля
   - **Cell Size**: Должен совпадать с GridGenerator.cellSize
   - **Cell Spacing**: Должен совпадать с GridGenerator.cellSpacing
   - **Grid Size**: Должен совпадать с GridGenerator.gridSize

## API скриптов

### GridGenerator

#### Параметры (@input)
- `cellPrefab: ObjectPrefab` - Префаб ячейки грида
- `gridSize: number` - Размер грида (по умолчанию 10)
- `cellSize: number` - Размер одной ячейки (по умолчанию 1.0)
- `cellSpacing: number` - Расстояние между ячейками (по умолчанию 0.1)
- `gridParent: SceneObject` - Родительский объект (опционально)

#### Методы
- `generateGrid()` - Генерирует грид заданного размера
- `clearGrid()` - Очищает текущий грид
- `regenerateGrid(newSize?: number)` - Пересоздает грид с новым размером

### ShipPlacer

#### Параметры (@input)
- `ship1Prefab: ObjectPrefab` - Префаб однопалубного корабля
- `ship2Prefab: ObjectPrefab` - Префаб двухпалубного корабля
- `ship3Prefab: ObjectPrefab` - Префаб трехпалубного корабля
- `ship4Prefab: ObjectPrefab` - Префаб четырехпалубного корабля
- `cellSize: number` - Размер ячейки (должен совпадать с GridGenerator)
- `cellSpacing: number` - Расстояние между ячейками (должен совпадать с GridGenerator)
- `gridSize: number` - Размер грида (должен совпадать с GridGenerator)
- `shipsParent: SceneObject` - Родительский объект для кораблей (опционально)

#### Методы
- `placeTestShips()` - Размещает тестовые корабли на гриде
- `placeShip(shipPrefab, gridX, gridY, horizontal, parent, cellDistance)` - Размещает корабль
- `placeShipAtGrid(shipPrefab, gridX, gridY, horizontal)` - Размещает корабль по координатам грида
- `clearShips()` - Очищает все размещенные корабли

## Следующие шаги

1. Добавить интерактивность (обработка кликов по ячейкам)
2. Реализовать логику валидации размещения кораблей
3. Добавить визуальную обратную связь (подсветка ячеек)
4. Реализовать игровую логику (выстрелы, проверка попаданий)
5. Добавить UI элементы (счет, статус игры)

## Полезные ссылки

- [Snap Lens Studio Documentation](https://developers.snap.com/lens-studio/)
- [Scripting Overview](https://developers.snap.com/lens-studio/guides/scripting/scripting-overview)
- [Prefabs Guide](https://developers.snap.com/lens-studio/lens-studio-workflow/prefabs)
