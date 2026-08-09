const $=id=>document.getElementById(id);
const video=$("video"), canvas=$("canvas"), ctx=canvas.getContext("2d");
const labels=[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const staticLetters=labels.filter(x=>x!=="J"&&x!=="Z");
const descriptions={
A:"Closed fist. Thumb rests alongside the index side.",
B:"Four fingers straight up together. Thumb crosses the palm.",
C:"Curve all fingers and thumb to form a C.",
D:"Index straight up. Other fingers curl with thumb touching them.",
E:"Curl all four fingers toward palm; thumb crosses in front.",
F:"Thumb and index form a circle; three fingers extend.",
G:"Index points sideways; thumb points alongside it.",
H:"Index and middle point sideways together.",
I:"Closed hand with pinky extended upward.",
K:"Index and middle up in a V-like shape; thumb between them.",
L:"Index up and thumb sideways, forming an L.",
M:"Three fingers folded over the thumb.",
N:"Two fingers folded over the thumb.",
O:"All fingers curve together with thumb to make O.",
P:"K-like handshape angled downward.",
Q:"Index and thumb point downward.",
R:"Index and middle cross while pointing upward.",
S:"Closed fist with thumb across the fingers.",
T:"Thumb tucked between index and middle.",
U:"Index and middle straight up together.",
V:"Index and middle up separated.",
W:"Index, middle and ring up.",
X:"Index finger hooked downward.",
Y:"Thumb and pinky extended; middle fingers curled."
};
const classifier=knnClassifier.create();
let stream=null,camera=null,current=null,text="",capturing=false,trained=new Set();

function populate(){
 const sel=$("classSelect");
 staticLetters.forEach(l=>{let o=document.createElement("option");o.value=l;o.textContent=l+" — "+descriptions[l];sel.appendChild(o)});
 labels.forEach(l=>{
   const d=document.createElement("div");d.className="card"+((l==="J"||l==="Z")?" motion":"");
   d.innerHTML=`<b>${l}</b><small>${descriptions[l]||"Motion letter — coming in the motion engine."}</small>`;
   $("cards").appendChild(d);
 });
 updateTarget(); updateCount();
}
populate();

$("classSelect").onchange=updateTarget;
function updateTarget(){let l=$("classSelect").value;$("targetLetter").textContent=l;$("targetHelp").textContent=descriptions[l]||"Motion letter";}

async function start(){
 try{
  $("status").textContent="Starting";stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
  video.srcObject=stream;await video.play();$("overlay").classList.add("off");$("dot").classList.add("on");$("status").textContent="Camera active";$("start").textContent="CAMERA RUNNING";
  camera=new Camera(video,{onFrame:async()=>hands.send({image:video}),width:1280,height:720});camera.start();
 }catch(e){console.error(e);$("status").textContent="Camera blocked";alert("Please allow camera permission for this website, then reload.");}
}
$("start").onclick=start;

const hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.7,minTrackingConfidence:.7});
hands.onResults(async r=>{
 canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!r.multiHandLandmarks?.length){$("letter").textContent="—";$("confidence").textContent="No hand detected";return}
 const lm=r.multiHandLandmarks[0];
 drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:"#00ff9d",lineWidth:3});drawLandmarks(ctx,lm,{color:"#fff",radius:3});
 const feature=landmarkTensor(lm);
 if(capturing) await addSample(feature,$("classSelect").value);
 if(classifier.getNumClasses()>0 && !capturing){
   const res=await classifier.predictClass(feature,3);
   if(res.confidences[res.label]>.72){current=res.label;$("letter").textContent=current;$("confidence").textContent=`${(res.confidences[res.label]*100).toFixed(1)}% • trained`; }
   else {$("letter").textContent="?";$("confidence").textContent="Low confidence — hold gesture steady";}
 }
 feature.dispose();
});

function landmarkTensor(lm){
 const w=lm[0];let p=lm.map(a=>[a.x-w.x,a.y-w.y,a.z-w.z]);let s=Math.max(...p.map(a=>Math.hypot(a[0],a[1])))||1;
 return tf.tensor([p.flatMap(a=>a.map(v=>v/s))]);
}
async function addSample(t,label){
 classifier.addExample(t,label);
}
let captureTimer=null,captureCount=0;
$("capture").onclick=()=>{
 if(!stream){alert("Start the camera first.");return}
 if(capturing)return;
 capturing=true;captureCount=0;$("capture").disabled=true;$("capture").textContent="CAPTURING…";
 $("captureStatus").textContent="Hold the gesture steady…";
 captureTimer=setInterval(()=>{
   captureCount++;$("progress").style.width=(captureCount/25*100)+"%";$("captureStatus").textContent=`Captured ${captureCount}/25`;
   if(captureCount>=25){clearInterval(captureTimer);capturing=false;$("capture").disabled=false;$("capture").textContent="CAPTURE 25 SAMPLES";trained.add($("classSelect").value);updateCount();$("captureStatus").textContent="Done. You can train this letter again for more variety."}
 },120);
};
function updateCount(){let n=trained.size;$("trained").textContent=`${n} / 24`;}
$("add").onclick=()=>{if(current){text+=current;render()}};
$("space").onclick=()=>{text+=" ";render()};
$("back").onclick=()=>{text=text.slice(0,-1);render()};
$("clear").onclick=()=>{text="";render()};
function render(){$("word").textContent=text||"—"}

$("reset").onclick=()=>{if(confirm("Delete all learned gestures?")){location.reload()}};
$("speak").onclick=()=>{if(!text)return; speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text))};
$("toggle").onclick=()=>{let c=$("cards"),hide=c.style.display==="none";c.style.display=hide?"grid":"none";$("toggle").textContent=hide?"HIDE":"SHOW"};

window.addEventListener("beforeunload",()=>stream?.getTracks().forEach(t=>t.stop()));
