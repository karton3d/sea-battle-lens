# AI Image Generation Prompts Guide

## Prompt Structure (Universal)

Эффективный промпт состоит из 5 ключевых компонентов:

```
[SUBJECT] + [STYLE] + [COMPOSITION] + [LIGHTING] + [DETAILS/MODIFIERS]
```

### 1. SUBJECT (Что изображено)
- Главный объект или сцена
- Конкретные детали (форма, размер, количество)
- Действия или состояния

### 2. STYLE (Стиль)
- Художественный стиль: `minimalist`, `cartoon`, `realistic`, `flat design`, `3D render`
- Эпоха/направление: `retro`, `cyberpunk`, `vaporwave`, `memphis design`
- Референсы: `in the style of [artist/game]`

### 3. COMPOSITION (Композиция)
- Расположение: `centered`, `rule of thirds`, `symmetrical`
- Перспектива: `top-down view`, `isometric`, `front view`
- Фрейминг: `close-up`, `wide shot`, `full frame`

### 4. LIGHTING (Освещение)
- Тип: `soft lighting`, `dramatic lighting`, `neon glow`, `backlit`
- Время суток: `golden hour`, `night scene`, `daylight`
- Эффекты: `volumetric light`, `lens flare`, `rim light`

### 5. DETAILS/MODIFIERS (Детали)
- Цветовая палитра: `vibrant colors`, `pastel palette`, `monochrome`
- Текстуры: `glossy`, `matte`, `metallic`, `pixel art`
- Качество: `4K`, `high detail`, `sharp`, `clean lines`
- Атмосфера: `playful`, `mysterious`, `epic`, `cozy`

---

## Best Practices

### ✅ DO:
1. **Будьте конкретны** — "синий военный корабль" лучше чем "корабль"
2. **Указывайте стиль первым** — стиль сильно влияет на результат
3. **Используйте прилагательные** — они уточняют образ
4. **Добавляйте контекст** — для чего это изображение
5. **Экспериментируйте** — пробуйте разные формулировки

### ❌ DON'T:
1. Не используйте слишком много объектов (AI путается)
2. Не пишите противоречивые описания
3. Не полагайтесь на абстрактные понятия без визуальных деталей
4. Избегайте негативных формулировок (лучше описать что нужно, а не что не нужно)

---

## Negative Prompts (для Stable Diffusion, Midjourney)

Указывают что НЕ должно быть на изображении:

```
Negative: blurry, low quality, distorted, watermark, text, ugly, deformed
```

---

## Meme Fleet Battle — Welcome Screen Prompts

### Prompt 1: Meme Style (Recommended)
```
Game title screen for "Meme Fleet Battle", 
cartoon style with bold outlines, 
centered composition with game logo at top, 
vibrant neon colors on dark blue ocean background,
funny cartoon battleships with meme faces (trollface, doge, pepe) peeking from water,
pixel art water splashes, 
playful and humorous atmosphere,
mobile game UI style,
clean vector graphics,
4K, sharp edges
```

### Prompt 2: Retro Arcade
```
Retro arcade game welcome screen "Meme Fleet Battle",
80s synthwave aesthetic,
pixel art battleship silhouettes on gradient purple-pink sunset,
scanline effect overlay,
chrome metallic title text with glow,
grid perspective ocean floor,
vaporwave color palette,
nostalgic gaming atmosphere,
16-bit style
```

### Prompt 3: Modern Minimal
```
Minimalist mobile game splash screen,
flat design illustration,
top-down view of stylized ocean grid 10x10,
geometric battleship shapes in teal and coral colors,
clean sans-serif title "MEME FLEET" centered,
soft gradient background light blue to white,
subtle drop shadows,
modern app store style,
professional and clean
```

### Prompt 4: AR/Spectacles Style
```
Augmented reality game interface mockup,
futuristic holographic UI elements,
transparent grid floating in real space,
glowing cyan ship markers,
sci-fi military radar aesthetic,
dark background with neon accents,
Snapchat Spectacles style AR overlay,
sleek modern design,
high tech atmosphere
```

---

## Button/UI Element Prompts

### Play Button
```
Game UI button "PLAY", 
glossy 3D style,
bright yellow with orange gradient,
rounded rectangle shape,
bold white text with subtle shadow,
playful cartoon style,
isolated on transparent background,
mobile game aesthetic
```

### Hit/Miss Markers
```
Game icon set: hit and miss markers,
flat design style,
hit marker: red explosion with X symbol,
miss marker: blue water splash with circle,
bold outlines,
vector graphics,
game UI elements,
transparent background
```

---

## Tools Compatibility

| Tool | Best For | Notes |
|------|----------|-------|
| Midjourney | Artistic, stylized | Use `/imagine` + prompt |
| DALL-E 3 | Realistic, clean | Good with text in images |
| Stable Diffusion | Customizable | Use negative prompts |
| Nano Banana | Quick iterations | Russian-friendly |
| Leonardo.AI | Game assets | Has "Game Asset" mode |
| Ideogram | Text + images | Best for logos with text |

---

## Aspect Ratios for Mobile

| Use Case | Ratio | Resolution |
|----------|-------|------------|
| Portrait splash | 9:16 | 1080x1920 |
| Square icon | 1:1 | 1024x1024 |
| Landscape banner | 16:9 | 1920x1080 |
| App store preview | 9:19.5 | 1284x2778 (iPhone) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-01-11 | Initial guide with Meme Fleet Battle prompts |
