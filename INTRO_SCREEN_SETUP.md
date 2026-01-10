# Intro Screen Setup Guide

## Overview

The `IntroScreen.ts` script has been created with the basic structure for the welcome screen. This document outlines what's been implemented and what needs to be set up in the scene.

## ✅ What's Implemented

### Script Features
- **Component Structure**: Full `IntroScreen` component with `@input` parameters
- **Screen Management**: Show/hide methods with state tracking
- **Button Handlers**: Methods for Single Player and Play with Friend buttons
- **Animations**: Basic fade in/out animations (scale-based)
- **Game Mode Initialization**: Placeholder methods for starting single/multiplayer games

### Input Parameters
- `backgroundObject`: Optional background scene object
- `titleObject`: Game title text/logo object
- `previewArea`: Area for game preview demo
- `singlePlayerButton`: Button for single player mode
- `playWithFriendButton`: Button for multiplayer mode
- `screenContainer`: Parent container for all intro elements
- `gameManager`: Reference to game manager (for starting games)
- `transitionDuration`: Animation duration (default: 0.5s)

## ⏳ What Needs Setup in Scene

### 1. Create Scene Objects

#### Screen Container
- Create a SceneObject named "IntroScreen" (or assign existing)
- This will be the parent for all intro elements
- Assign to `screenContainer` input

#### Background
- Create background object (Image, 3D plane, etc.)
- Add as child of screen container
- Assign to `backgroundObject` input (optional)

#### Game Title
- Create Text or Text3D object with "Meme Fleet Battle"
- Style it with meme/viral aesthetic
- Add as child of screen container
- Assign to `titleObject` input

#### Buttons
- Create two button objects:
  - "Single Player" button
  - "Play with Friend" button
- Add InteractionComponent to each button
- Add as children of screen container
- Assign to respective inputs

#### Preview Area (Optional)
- Create area for mini grid preview
- Could show animated grid with objects
- Add as child of screen container
- Assign to `previewArea` input

### 2. Setup Button Interactions

For each button, you need to:

1. **Add InteractionComponent**:
   - Select button object
   - Add Component > Interaction
   - Configure tap area

2. **Connect to Script**:
   - The script has methods `onSinglePlayerTap()` and `onPlayWithFriendTap()`
   - You'll need to connect button taps to these methods
   - This might require additional setup depending on InteractionComponent API

### 3. Connect Game Manager

- Create or identify the game manager object
- Assign to `gameManager` input
- The game manager should handle:
  - Game state initialization
  - Screen transitions
  - Game mode setup

## Usage

### Basic Setup
1. Add `IntroScreen.ts` script to a SceneObject
2. Assign all input parameters in Inspector
3. Ensure screen container is enabled on start
4. Buttons should trigger respective tap handlers

### Customization
- Adjust `transitionDuration` for faster/slower animations
- Modify animation methods for different effects
- Add additional UI elements as needed

## Next Steps

1. **Create UI Elements in Scene**:
   - Background
   - Title
   - Buttons
   - Preview area

2. **Test Button Interactions**:
   - Verify tap detection works
   - Test screen transitions
   - Check game mode initialization

3. **Enhance Animations**:
   - Replace basic scale animations with proper fade effects
   - Add particle effects
   - Add sound effects

4. **Connect to Game Flow**:
   - Implement `startSinglePlayerGame()`
   - Implement `startMultiplayerGame()`
   - Connect to game setup screen

## Notes

- The script uses basic scale animations as placeholders
- Proper animation system integration needed for production
- Button tap handling may need adjustment based on InteractionComponent API
- Game manager connection is placeholder - needs actual implementation

## Files

- **Script**: `Assets/Scripts/IntroScreen.ts`
- **Documentation**: This file
