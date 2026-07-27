import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PROJECTS = [
  { name:'Portfolio-OS',    vid:'assets/vid/portfolio-os.webm',   img:'assets/portfolio-os.jpg',   url:'https://portfolio-os-navy.vercel.app' },
  { name:"D'extensionz",    vid:'assets/vid/dextensionz.webm',    img:'assets/dextensionz.jpg',    url:'https://dextensionz-site.vercel.app' },
  { name:'Sandy · AI',      vid:'assets/vid/sandy.webm',          img:'assets/sandy.jpg',          url:'https://chain-recall.vercel.app' },
  { name:"D'oppebraids",    vid:'assets/vid/doppebraids.webm',    img:'assets/doppebraids.jpg',    url:'https://doppebraids-site-henna.vercel.app' },
  { name:'Prompt Generator',vid:'assets/vid/ultimate-prompt.webm',img:'assets/ultimate-prompt.jpg',url:'https://prompts.tdotssolutionsz.com' },
  { name:'ThrowingTracker', vid:'assets/vid/throwing-tracker.webm',img:'assets/throwing-tracker.jpg',url:'https://throwing-tracker.vercel.app' },
  { name:'Options Course',  vid:'assets/vid/options-course.webm', img:'assets/options-course.jpg', url:'https://optionstradingcourse.vercel.app' },
];
const DESCS = [
  "A full desktop OS in the browser — Three.js, 20 apps, zero dependencies.",
  "A cinematic hair-brand storefront with a preview checkout. Live client.",
  "AI institutional memory for luxury hotels — built at the Anthropic Hackathon.",
  "A booking-forward storefront for a braided-hair studio.",
  "A structured prompt builder for image & video AI, on a custom domain.",
  "A training app for throwers — sessions, PRs, and workload.",
  "A gamified interactive options course with XP and badges.",
];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = innerWidth < 760;
const N = PROJECTS.length, STEP = (Math.PI*2)/N;
const R = 60;    // jumbotron ring radius
const SY = 40;   // jumbotron height

const setCaption = (i)=>{ const n=document.getElementById('arenaCaption'), d=document.getElementById('arenaDesc');
  if(n) n.textContent=PROJECTS[i].name; if(d) d.textContent=DESCS[i]||''; };
function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }
function hideLoader(){ const l=document.getElementById('loader'); if(l){ l.classList.add('gone'); setTimeout(()=>l.remove(),900); } }

if(!hasWebGL()){ document.body.classList.add('no-webgl'); hideLoader(); }
else { try{ init(); }catch(err){ console.error('Arena init failed:',err); document.body.classList.add('no-webgl'); hideLoader(); } }

/* ---------- textures ---------- */
function skyDome(){
  const c=document.createElement('canvas'); c.width=16; c.height=512; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,512);
  grd.addColorStop(0.00,'#1a1636');  // deep upper dusk
  grd.addColorStop(0.32,'#3b2f60');
  grd.addColorStop(0.55,'#6b4a78');  // lavender/pink
  grd.addColorStop(0.74,'#b06a72');  // warm horizon
  grd.addColorStop(0.88,'#d79a72');
  grd.addColorStop(1.00,'#123a44');  // teal ground haze
  g.fillStyle=grd; g.fillRect(0,0,16,512);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.LinearFilter; return t;
}
function crowdTexture(){
  const c=document.createElement('canvas'); c.width=1024; c.height=256; const g=c.getContext('2d');
  g.fillStyle='#0a1a1e'; g.fillRect(0,0,1024,256);
  const cols=['#17b7b0','#3fe0d6','#e8fbfa','#0f5d63','#c9a24b','#20303a'];
  for(let i=0;i<5200;i++){ g.fillStyle=cols[(Math.random()*cols.length)|0]; g.globalAlpha=.5+Math.random()*.5;
    g.fillRect(Math.random()*1024, Math.random()*256, 3, 3); }
  g.globalAlpha=1; const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.colorSpace=THREE.SRGBColorSpace; return t;
}
function fieldTexture(){
  const c=document.createElement('canvas'); c.width=1024; c.height=560; const g=c.getContext('2d');
  // stripes of turf
  for(let i=0;i<12;i++){ g.fillStyle=(i%2)?'#1f7a3d':'#1a6d36'; g.fillRect(i*(1024/12),0,1024/12+1,560); }
  g.strokeStyle='#eafff4'; g.lineWidth=4; g.globalAlpha=.9;
  for(let i=0;i<=10;i++){ const x=60+i*(904/10); g.beginPath(); g.moveTo(x,40); g.lineTo(x,520); g.stroke(); }
  g.strokeRect(60,40,904,480); // sidelines
  g.globalAlpha=1; const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function labelSprite(text){
  const c=document.createElement('canvas'); c.width=512; c.height=96; const g=c.getContext('2d');
  g.font='700 34px "Space Mono", monospace'; g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#eafffb'; g.fillText(text.toUpperCase(),256,48);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false})); s.scale.set(22,4.1,1); return s;
}

function init(){
  const canvas=document.getElementById('bg');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.95;
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x1a2536, 0.0016);

  const camera=new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 4000);

  // sky dome (dusk through the roof)
  const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),
    new THREE.MeshBasicMaterial({map:skyDome(),side:THREE.BackSide,fog:false,depthWrite:false}));
  scene.add(sky);

  // lights
  scene.add(new THREE.HemisphereLight(0x8a7fb0, 0x0c2a30, 0.9));
  scene.add(new THREE.AmbientLight(0x2a3a4a, 0.4));
  const teal=new THREE.PointLight(0x37e2d6, 1.1, 400, 1.4); teal.position.set(0,70,0); scene.add(teal);
  const warm=new THREE.DirectionalLight(0xffd9a8, 0.5); warm.position.set(-120,120,80); scene.add(warm);

  // ---- field ----
  const field=new THREE.Mesh(new THREE.PlaneGeometry(120,66),
    new THREE.MeshStandardMaterial({map:fieldTexture(),roughness:.9,metalness:0}));
  field.rotation.x=-Math.PI/2; field.position.y=0.1; scene.add(field);

  // ---- stadium bowl (tiered seating w/ crowd) ----
  const cTex=crowdTexture();
  function tier(rt,rb,h,y){
    const t=cTex.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(30, 1);
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,80,1,true),
      new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0x0d2b30,emissiveIntensity:.5,roughness:.9,metalness:.05,side:THREE.BackSide}));
    m.position.y=y; scene.add(m);
  }
  tier(92,70,26,13);    // lower bowl
  tier(120,96,30,34);   // upper bowl
  // teal ring rails (glow)
  [ [72,2.5], [98,26.5], [124,48] ].forEach(([r,y])=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.5,8,120),
      new THREE.MeshBasicMaterial({color:0x37e2d6,toneMapped:false})); ring.rotation.x=Math.PI/2; ring.position.y=y; scene.add(ring);
  });

  // ---- translucent domed roof + truss ----
  const dome=new THREE.Mesh(new THREE.SphereGeometry(140,40,24,0,Math.PI*2,0,Math.PI*0.42),
    new THREE.MeshStandardMaterial({color:0x9fb0d8,transparent:true,opacity:0.07,roughness:.4,metalness:.1,side:THREE.DoubleSide}));
  dome.position.y=52; scene.add(dome);
  const rimTruss=new THREE.Mesh(new THREE.TorusGeometry(132,1.4,10,140),
    new THREE.MeshBasicMaterial({color:0x9fe8e2,toneMapped:false})); rimTruss.rotation.x=Math.PI/2; rimTruss.position.y=70; scene.add(rimTruss);
  for(let i=0;i<18;i++){ const a=i*(Math.PI*2/18);
    const beam=new THREE.Mesh(new THREE.BoxGeometry(1,1,132), new THREE.MeshStandardMaterial({color:0x2b3550,emissive:0x14343a,emissiveIntensity:.4,roughness:.6}));
    beam.position.set(Math.sin(a)*66, 92, Math.cos(a)*66); beam.rotation.y=a; beam.rotation.x=-0.62; scene.add(beam); }

  // ---- jumbotron screens (7 live-site videos) ----
  const ring=new THREE.Group(); scene.add(ring); const screens=[]; const loader=new THREE.TextureLoader();
  PROJECTS.forEach((p,i)=>{
    const a=i*STEP, px=Math.sin(a)*R, pz=Math.cos(a)*R, big=i===0?1.2:1, w=34*big, h=20*big;
    const holder=new THREE.Group();
    const frame=new THREE.Mesh(new THREE.PlaneGeometry(w+2.4,h+2.4), new THREE.MeshBasicMaterial({color:0x37e2d6,toneMapped:false})); frame.position.z=-0.12; holder.add(frame);
    const backer=new THREE.Mesh(new THREE.PlaneGeometry(w+1.2,h+1.2), new THREE.MeshBasicMaterial({color:0x03141a})); backer.position.z=-0.06; holder.add(backer);
    const video=document.createElement('video'); video.src=p.vid; video.loop=true; video.muted=true; video.playsInline=true; video.preload='auto'; video.setAttribute('playsinline','');
    const vtex=new THREE.VideoTexture(video); vtex.colorSpace=THREE.SRGBColorSpace; vtex.anisotropy=8;
    const mat=new THREE.MeshBasicMaterial({map:vtex, toneMapped:true}); // crisp, no emissive wash
    video.addEventListener('error',()=>{ loader.load(p.img,t=>{ t.colorSpace=THREE.SRGBColorSpace; mat.map=t; mat.needsUpdate=true; }); });
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); screen.userData={url:p.url,video,angle:a}; holder.add(screen);
    const label=labelSprite(p.name); label.position.set(0,-(h/2)-3.2,0.2); holder.add(label);
    holder.position.set(px,SY,pz); holder.lookAt(0,SY*0.55,0); holder.userData.phase=i*1.1;
    ring.add(holder); screens.push(screen);
  });
  setTimeout(hideLoader, 1500);

  // ---- post ----
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), isMobile?0.3:0.34, 0.5, 0.62);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  // ---- scroll-driven camera ----
  const CENTER=new THREE.Vector3(0,18,0);            // on the field
  const HERO=new THREE.Vector3(0,30,40);             // establishing: bowl + jumbotrons + dusk roof
  const DESCEND_START=new THREE.Vector3(0,96,120);
  const INTRO=reduced?0:4.6;
  const START_YAW=-0.5;
  let yaw=START_YAW, targetYaw=START_YAW, dragging=false, lastX=0, moved=0;
  const clock=new THREE.Clock(); let elapsed=0;
  const ringPoint=(y)=>new THREE.Vector3(Math.sin(y)*R, SY, Math.cos(y)*R);
  const easeIO=(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const arenaProgress=()=>{ const H=innerHeight,len=innerHeight*3.2; return Math.min(1,Math.max(0,(scrollY-H*0.15)/len)); };

  const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;moved=0;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;moved+=Math.abs(dx);targetYaw-=dx*0.006;});
  canvas.addEventListener('pointerup',e=>{dragging=false; if(moved<6){ ndc.x=(e.clientX/innerWidth)*2-1; ndc.y=-(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(ndc,camera); const hit=ray.intersectObjects(screens,false)[0]; if(hit&&hit.object.userData.url) window.open(hit.object.userData.url,'_blank','noopener'); }});
  addEventListener('keydown',e=>{ if(e.key==='ArrowLeft')targetYaw-=STEP; else if(e.key==='ArrowRight')targetYaw+=STEP; });
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); bloom.setSize(innerWidth,innerHeight); });

  let running=true, raf=null;
  const sentinel=document.getElementById('arenaEnd');
  if('IntersectionObserver' in window && sentinel) new IntersectionObserver(es=>{ running=!es[0].isIntersecting; if(running&&!raf) loop(); },{threshold:0}).observe(sentinel);
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running&&!raf) loop(); });

  let lastCenter=-1;
  function loop(){
    if(!running){ raf=null; return; }
    raf=requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(),0.05); elapsed+=dt;
    const q=arenaProgress();
    if(INTRO>0 && elapsed<INTRO && scrollY<innerHeight*0.4){
      const t=easeIO(elapsed/INTRO); camera.position.lerpVectors(DESCEND_START,HERO,t); camera.lookAt(ringPoint(START_YAW));
    } else {
      const dive=easeIO(Math.min(1,q/0.32));
      camera.position.lerpVectors(HERO,CENTER,dive);
      if(q>0.32 || dragging){ if(!dragging) targetYaw=START_YAW-(q-0.32)*Math.PI*5; }
      if(reduced && !dragging) targetYaw=START_YAW;
      yaw += (targetYaw-yaw)*Math.min(1,dt*4);
      camera.lookAt(ringPoint(yaw));
    }
    let best=0,bestD=99;
    screens.forEach((s,i)=>{ let d=Math.abs(((s.userData.angle-yaw+Math.PI)%(Math.PI*2))-Math.PI); const v=s.userData.video;
      if(d<1.05){ if(v.paused) v.play().catch(()=>{}); } else if(!v.paused){ v.pause(); } if(d<bestD){bestD=d;best=i;} });
    if(best!==lastCenter){ lastCenter=best; setCaption(best); }
    ring.children.forEach(h=>{ h.position.y=SY+Math.sin(elapsed*0.7+h.userData.phase)*0.5; });
    composer.render();
  }
  loop();
}
