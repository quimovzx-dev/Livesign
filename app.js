const video = document.getElementById("camera");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const spaceBtn = document.getElementById("spaceBtn");
const backBtn = document.getElementById("backBtn");
const clearBtn = document.getElementById("clearBtn");

const letterEl = document.getElementById("letter");
const confidenceEl = document.getElementById("confidence");
const textEl = document.getElementById("text");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const cameraMessage = document.getElementById("cameraMessage");

let camera = null;
let stream = null;

let currentPrediction = null;
let currentConfidence = 0;

let stablePrediction = null;
let stableFrames = 0;

let text = "";

/*

* ---
* MEDIAPIPE HAND TRACKING
* ---

*/

const hands = new Hands({
locateFile: (file) => {
return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}";
}
});

hands.setOptions({
maxNumHands: 1,
modelComplexity: 1,
minDetectionConfidence: 0.65,
minTrackingConfidence: 0.65
});

hands.onResults(onResults);

/*

* ---
* CAMERA
* ---

*/

async function startCamera() {

try {

statusText.textContent = "Starting camera...";

stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: "user",
    width: {
      ideal: 1280
    },
    height: {
      ideal: 720
    }
  },
  audio: false
});

video.srcObject = stream;

await video.play();

cameraMessage.classList.add("hidden");

statusDot.classList.add("active");
statusText.textContent = "Camera active";

startBtn.textContent = "Camera Running";

/*
 * MediaPipe Camera utility
 */
camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({
      image: video
    });
  },
  width: 1280,
  height: 720
});

camera.start();

} catch (error) {

console.error(error);

statusText.textContent = "Camera permission denied";

alert(
  "Camera access is required.\n\n" +
  "Please allow camera permission in your browser."
);

}
}

/*

* ---
* LANDMARK PROCESSING
* ---

*/

function normalizeLandmarks(landmarks) {

const wrist = landmarks[0];

const points = landmarks.map(point => ({
x: point.x - wrist.x,
y: point.y - wrist.y,
z: point.z - wrist.z
}));

let scale = 0;

for (const p of points) {

const distance = Math.sqrt(
  p.x * p.x +
  p.y * p.y
);

scale = Math.max(scale, distance);

}

if (scale < 0.0001) {
scale = 1;
}

return points.map(p => ({
x: p.x / scale,
y: p.y / scale,
z: p.z / scale
}));
}

/*

* ---
* SIMPLE V1 CLASSIFIER
* 
* This is deliberately a placeholder classifier.
* 
* The next version will use a trained A-Z model.
* ---

*/

function classifySign(landmarks) {

const p = normalizeLandmarks(landmarks);

/*

* Finger tip indexes:
* 
* Thumb  = 4
* Index  = 8
* Middle = 12
* Ring   = 16
* Pinky  = 20
  */

const fingerTips = [8, 12, 16, 20];

let extended = 0;

for (const tip of fingerTips) {

if (p[tip].y < p[tip - 2].y) {
  extended++;
}

}

/*

* Basic prototype recognition.
* 
* This is NOT the final ASL classifier.
  */

if (extended === 0) {
return {
letter: "A",
confidence: 0.55
};
}

if (extended === 1) {
return {
letter: "I",
confidence: 0.52
};
}

if (extended === 2) {
return {
letter: "V",
confidence: 0.55
};
}

if (extended === 3) {
return {
letter: "W",
confidence: 0.55
};
}

if (extended === 4) {
return {
letter: "B",
confidence: 0.50
};
}

return null;
}

/*

* ---
* MEDIAPIPE RESULTS
* ---

*/

function onResults(results) {

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

if (
!results.multiHandLandmarks ||
results.multiHandLandmarks.length === 0
) {

letterEl.textContent = "—";
confidenceEl.textContent = "No hand detected";

stablePrediction = null;
stableFrames = 0;

return;

}

const landmarks = results.multiHandLandmarks[0];

drawConnectors(
ctx,
landmarks,
HAND_CONNECTIONS,
{
color: "#00ff9d",
lineWidth: 3
}
);

drawLandmarks(
ctx,
landmarks,
{
color: "#ffffff",
lineWidth: 1,
radius: 3
}
);

const result = classifySign(landmarks);

if (!result) {
return;
}

currentPrediction = result.letter;
currentConfidence = result.confidence;

/*

* Stability filter.
* 
* The same prediction must appear
* several frames before being displayed.
  */

if (currentPrediction === stablePrediction) {
stableFrames++;
} else {
stablePrediction = currentPrediction;
stableFrames = 1;
}

if (stableFrames >= 5) {

letterEl.textContent = currentPrediction;

confidenceEl.textContent =
  `${Math.round(currentConfidence * 100)}% confidence`;

}
}

/*

* ---
* TEXT CONTROLS
* ---

*/

function updateText() {

textEl.textContent = text || "—";
}

spaceBtn.addEventListener("click", () => {

if (!currentPrediction) {
return;
}

text += currentPrediction;

updateText();
});

backBtn.addEventListener("click", () => {

text = text.slice(0, -1);

updateText();
});

clearBtn.addEventListener("click", () => {

text = "";

updateText();
});

/*

* Start button
  */

startBtn.addEventListener("click", async () => {

if (!stream) {
await startCamera();
}

});

/*

* Keyboard controls
  */

document.addEventListener("keydown", event => {

if (event.code === "Space") {

event.preventDefault();

spaceBtn.click();

}

if (event.key === "Backspace") {

backBtn.click();

}

if (event.key.toLowerCase() === "c") {

clearBtn.click();

}
});
