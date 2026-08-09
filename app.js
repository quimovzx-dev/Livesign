const $=id=>document.getElementById(id);
const video=$("video"), canvas=$("canvas"), ctx=canvas.getContext("2d");
const prediction=$("prediction"), confidence=$("confidence"), word=$("word");
const status=$("status"), dot=$("dot"), guide=$("guide");
let stream=null, camera=null, current=null, conf=0, stable=null, stableCount=0, text="";
let model=null;

// Put your trained TensorFlow.js model in /model/model.json.
// Expected input: 63 values (21 landmarks x/y/z), output: 26 classes A-Z.
// If the model is absent, the UI will remain in demo/landmark mode and clearly say so.
const MODEL_URL="model/model.json";
const LABELS="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const alphabetInfo={
 A:"Fist, thumb rests beside index",
 B:"Four fingers up, thumb across palm",
 C:"Curved hand like a C",
 D:"Index up, other fingers curl",
 E:"Fingers curled toward palm",
 F:"Index/thumb form circle, others up",
 G:"Index points sideways, thumb parallel",
 H:"Index + middle point sideways",
 I:"Pinky up",
 K:"Index and middle up, thumb between",
 L:"Index up + thumb sideways",
 M:"Three fingers over thumb",
 N:"Two fingers over thumb",
 O:"Fingers curved into O",
 P:"K-like shape pointing down",
 Q:"Index/thumb point down",
 R:"Crossed index and middle",
 S:"Closed fist, thumb across fingers",
 T:"Thumb tucked between fingers",
 U:"Index + middle together up",
 V:"Index + middle separated",
 W:"Three fingers up",
 X:"Index hooked",
 Y:"Thumb + pinky extended",
 Z:"Index draws a Z (motion)"
};

function buildGuide(){
 const box=$("alphabet");
 LABELS.forEach(l=>{
   const d=document.createElement("div"); d.className="letter-card";
   d.innerHTML=`<b>${l}</b><em>${alphabetInfo[l]||"Motion-based letter"}</em>`;
   box.appendChild(d);
 });
}
buildGuide();

async function loadModel(){
 try{
   model=await tf.loadLayersModel(MODEL_URL);
   confidence.textContent="Model loaded";
 }catch(e){
   console.warn("No trained model:",e);
   confidence.textContent="Model file not installed";
 }
}

const hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.65,minTrackingConfidence:.65});
hands.onResults(results=>{
 canvas.width=video.videoWidth; canvas.height=video.videoHeight; ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!results.multiHandLandmarks?.length){
   prediction.textContent="—"; confidence.textContent="No hand detected"; stable=null; stableCount=0; return;
 }
 const lm=results.multiHandLandmarks[0];
 drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:"#00ff9d",lineWidth:3});
 drawLandmarks(ctx,lm,{color:"#fff",lineWidth:1,radius:3});
 const features=normalize(lm);
 if(!model){prediction.textContent="—";confidence.textContent="Waiting for trained model";return;}
 const out=model.predict(tf.tensor([features]));
 const vals=Array.from(out.dataSync());
 let best=0; for(let i=1;i<vals.length;i++)if(vals[i]>vals[best])best=i;
 const letter=LABELS[best], c=vals[best];
 out.dispose();
 if(letter===stable)stableCount++;else{stable=letter;stableCount=1}
 if(stableCount>=5){current=letter;conf=c;prediction.textContent=letter;confidence.textContent=`${(c*100).toFixed(1)}% confidence`;}
});

function normalize(lm){
 const w=lm[0]; let p=lm.map(x=>[x.x-w.x,x.y-w.y,x.z-w.z]);
 let scale=Math.max(...p.map(v=>Math.hypot(v[0],v[1])))||1;
 return p.flatMap(v=>v.map(x=>x/scale));
}

async function start(){
 try{
   status.textContent="Starting"; stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
   video.srcObject=stream; await video.play(); guide.classList.add("off"); dot.classList.add("on"); status.textContent="Camera active";
   camera=new Camera(video,{onFrame:async()=>hands.send({image:video}),width:1280,height:720}); camera.start(); $("start").textContent="CAMERA RUNNING";
 }catch(e){status.textContent="Camera blocked";alert("Allow camera permission for this site, then reload.");}
}
function render(){word.textContent=text||"—"}
$("start").onclick=start;
$("add").onclick=()=>{if(current){text+=current;render()}};
$("space").onclick=()=>{text+=" ";render()};
$("delete").onclick=()=>{text=text.slice(0,-1);render()};
$("clear").onclick=()=>{text="";render()};
$("toggleGuide").onclick=()=>{const a=$("alphabet");const hidden=a.style.display==="none";a.style.display=hidden?"grid":"none";$("toggleGuide").textContent=hidden?"HIDE":"SHOW"};
document.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();$("space").click()}if(e.key==="Backspace")$("delete").click()});
loadModel();