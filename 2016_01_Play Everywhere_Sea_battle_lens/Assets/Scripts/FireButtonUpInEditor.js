// @input Component.ScreenTransform screenTransform

// Move fire button up in editor for easier testing
if (global.deviceInfoSystem.isEditor()) {
    var bounds = script.screenTransform.anchors;
    bounds.bottom = 1;
    bounds.top = 3;
    script.screenTransform.anchors = bounds;
}
