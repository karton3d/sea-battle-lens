# Assets

## UI Buttons
| Name             | Action                   |
|------------------|--------------------------|
| Single Player    | Start single player mode |
| Play with Friend | Start multiplayer mode   |
| Reshuffle        | Re-randomize objects     |
| Start            | Begin game               |
| Play Again       | Restart game             |

## UI Text
| Name   | Content               |
|--------|-----------------------|
| Title  | "Fleet Yeet!"         |
| Status | Turn info, game state |
| Hint   | Player instructions   |
| Result | Hit/Miss/Destroyed    |

## Welcome Screen
| Element | Description |
|---------|-------------|
| Background | 3D scene with sky, hills, grid preview |
| Title | "FLEET YEET!" 3D text (gradient) |
| Grid Preview | Green cells with blue outlines, meme objects |
| Buttons | Single Player, Play with Friend |

## Turn Banner
| Element  | Description                    |
|----------|--------------------------------|
| Arrow    | Direction indicator            |
| Info Box | Turn number + hint             |
| Colors   | Red (player) / Blue (opponent) |

## Grids
| Element       | Description     |
|---------------|-----------------|
| Cell Prefab   | 10x10 grid cube |
| Player Grid   | Red border      |
| Opponent Grid | Blue border     |

## Objects (Ships)
| Size | Count | Examples                  |
|------|-------|---------------------------|
| 1×1  | 4     | Cow, Toilet, Sneaker, Eye |
| 1×2  | 3     | Sofa, Skateboard          |
| 1×3  | 2     | Car, Crocodile            |
| 1×4  | 1     | Train, Bus                |

## Markers
| Prefab      | Use                  |
|-------------|----------------------|
| Hit Marker  | Red X / explosion    |
| Miss Marker | Blue splash / circle |

## Environment (AR)
| Element    | Description               |
|------------|---------------------------|
| Alpha Mask | Square boundary for grids |
| Clouds     | Decorative 3D objects     |
| Birds      | Animated decorative       |
| Particles  | Ambient effects           |

## Effects
| Effect  | When                 |
|---------|----------------------|
| Scan    | UFO scanning cell    |
| X-ray   | Reveal hidden object |
| Destroy | Object destroyed     |
| Victory | Game won             |

## Audio
| Sound    | When             |
|----------|------------------|
| Tap      | Cell selected    |
| Hit      | Object hit       |
| Miss     | Empty cell       |
| Destroy  | Object destroyed |
| Win/Lose | Game over        |
