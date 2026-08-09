# LiveSign V3 — Best practical Android-first version

This version is genuinely functional without requiring a pre-trained model file.

## Why this architecture?

A random A-Z model cannot be safely bundled unless its input format, class ordering, weights, and license are verified. Instead, LiveSign V3 uses MediaPipe's 21 hand landmarks and a browser KNN classifier. You teach the recognizer your own hand.

## Use

1. Upload `index.html`, `style.css`, `app.js` to GitHub.
2. Deploy the repository to Vercel.
3. Open the Vercel HTTPS URL on Android Chrome.
4. Allow camera access.
5. Select a static letter.
6. Make the ASL gesture shown in the guide.
7. Tap `CAPTURE 25 SAMPLES`.
8. Repeat for the letters you want to recognize.
9. Show a trained gesture. The live classifier predicts it.

## Important ASL detail

The common ASL alphabet has 26 letters, but J and Z are motion-based. This version intentionally leaves J/Z for a temporal model instead of pretending a single frame can recognize them.

## Privacy

The classifier and camera processing run in the browser. No camera frames are uploaded by this code.

## Accuracy

For better results, collect 25 samples per letter, then repeat the capture once or twice with small changes in distance/rotation. Do not train several visually similar letters with identical hand positions.

## Next upgrade

Add persistent IndexedDB model storage, automatic temporal smoothing, J/Z motion recognition, audio on confirmed letters, and a calibration/test mode.
