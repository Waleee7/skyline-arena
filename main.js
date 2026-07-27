import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const PROJECTS = [
  { name:'Portfolio-OS',    img:'assets/portfolio-os.jpg',    vid:'assets/vid/portfolio-os.webm',   url:'https://portfolio-os-navy.vercel.app' },
  { name:"D'extensionz",    img:'assets/dextensionz.jpg',     vid:'assets/vid/dextensionz.webm',    url:'https://dextensionz-site.vercel.app' },
  { name:'Sandy · AI',      img:'assets/sandy.jpg',           vid:'assets/vid/sandy.webm',          url:'https://chain-recall.vercel.app' },
  { name:"D'oppebraids",    img:'assets/doppebraids.jpg',     vid:'assets/vid/doppebraids.webm',    url:'https://doppebraids-site-henna.vercel.app' },
  { name:'Prompt Generator',img:'assets/ultimate-prompt.jpg', vid:'assets/vid/ultimate-prompt.webm',url:'https://prompts.tdotssolutionsz.com' },
  { name:'ThrowingTracker', img:'assets/throwing-tracker.jpg',vid:'assets/vid/throwing-tracker.webm',url:'https://throwing-tracker.vercel.app' },
  { name:'Options Course',  img:'assets/options-course.jpg',  vid:'assets/vid/options-course.webm', url:'https://optionstradingcourse.vercel.app' },
];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = innerWidth < 760;
const N = PROJECTS.length, STEP = (Math.PI*2)/N, R = 60, SY = 50;

function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }
function hideLoader(){ const l=document.getElementById('loader'); if(l){ l.classList.add('gone'); setTimeout(()=>l.remove(),900); } }
const DESCS = [
  "A full desktop OS in the browser — Three.js, 20 apps, zero dependencies.",
  "A cinematic hair-brand storefront with a preview checkout. Live client.",
  "AI institutional memory for luxury hotels — built at the Anthropic Hackathon.",
  "A booking-forward storefront for a braided-hair studio.",
  "A structured prompt builder for image & video AI, on a custom domain.",
  "A training app for throwers — sessions, PRs, and workload.",
  "A gamified interactive options course with XP and badges.",
];
const setCaption = (i)=>{ const n=document.getElementById('arenaCaption'), d=document.getElementById('arenaDesc');
  if(n) n.textContent=PROJECTS[i].name; if(d) d.textContent=DESCS[i]||''; };

if(!hasWebGL()){ document.body.classList.add('no-webgl'); hideLoader(); }
else { try{ init(); }catch(err){ console.error('Arena init failed:',err); document.body.classList.add('no-webgl'); hideLoader(); } }

function gridTexture(){
  const c=document.createElement('canvas'); c.width=256; c.height=256; const g=c.getContext('2d');
  g.clearRect(0,0,256,256); g.strokeStyle='#37E2E2'; g.lineWidth=2; g.globalAlpha=.55;
  g.beginPath(); g.moveTo(0,0); g.lineTo(256,0); g.moveTo(0,0); g.lineTo(0,256); g.stroke();
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
function windowTexture(){
  const c=document.createElement('canvas'); c.width=192; c.height=448; const g=c.getContext('2d');
  g.fillStyle='#060a12'; g.fillRect(0,0,192,448);
  const cols=6, rows=18, pad=5, cw=(192-pad*(cols+1))/cols, ch=(448-pad*(rows+1))/rows;
  const lit=['#37E2E2','#8ff0ff','#dff6ff','#a9d8ff','#5fc9e8']; // cool only — no fire
  for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){ const on=Math.random()<.38;
    g.fillStyle=on?lit[(Math.random()*lit.length)|0]:'#0b1626'; g.globalAlpha=on?(.45+Math.random()*.5):1;
    g.fillRect(pad+col*(cw+pad),pad+r*(ch+pad),cw,ch); }
  g.globalAlpha=1; const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function labelSprite(text){
  const c=document.createElement('canvas'); c.width=512; c.height=96; const g=c.getContext('2d');
  g.font='700 34px "Space Mono", monospace'; g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#EAF6FF'; g.fillText(text.toUpperCase(),256,48);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false})); s.scale.set(24,4.5,1); return s;
}

function init(){
  const canvas=document.getElementById('bg');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.80;
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x05080f, 0.0024);
  const camera=new THREE.PerspectiveCamera(58, innerWidth/innerHeight, 0.1, 6000);

  // ---- REAL night-city HDRI (background + lighting) ----
  new RGBELoader().load(isMobile?'assets/env/city_1k.hdr':'assets/env/city_2k.hdr', tex=>{
    tex.mapping=THREE.EquirectangularReflectionMapping;
    scene.background=tex; scene.environment=tex; scene.backgroundIntensity=1.18;
    hideLoader();
  }, undefined, ()=>{ scene.background=new THREE.Color(0x060d18); hideLoader(); });
  setTimeout(hideLoader, 6000);
  scene.add(new THREE.AmbientLight(0x2a405c, 0.22));

  // ---- depth towers (sparse foreground silhouettes; the HDRI is the real far city) ----
  const winTex=windowTexture(); const box=new THREE.BoxGeometry(1,1,1);
  const towers=isMobile?24:44;
  for(let i=0;i<towers;i++){
    const ang=Math.random()*Math.PI*2, rad=150+Math.random()*360;
    const w=8+Math.random()*16, d=8+Math.random()*16, h=30+Math.pow(Math.random(),1.5)*210;
    const em=winTex.clone(); em.needsUpdate=true; em.wrapS=em.wrapT=THREE.RepeatWrapping;
    em.repeat.set(Math.max(1,Math.round(w/6)),Math.max(2,Math.round(h/12)));
    const m=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color:0x080f1c,roughness:.8,metalness:.2,
      emissive:0xffffff,emissiveMap:em,emissiveIntensity:.3+Math.random()*.28}));
    m.position.set(Math.sin(ang)*rad, h/2, Math.cos(ang)*rad); m.scale.set(w,h,d); scene.add(m);
  }

  // ---- ground + neon grid (reflects the real env) ----
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),
    new THREE.MeshStandardMaterial({color:0x05090f,roughness:.55,metalness:.35}));
  ground.rotation.x=-Math.PI/2; scene.add(ground);
  const gtex=gridTexture(); gtex.repeat.set(120,120);
  const grid=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),
    new THREE.MeshBasicMaterial({map:gtex,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  grid.rotation.x=-Math.PI/2; grid.position.y=.12; scene.add(grid);

  // ---- screen ring with live-site VIDEO textures ----
  const ring=new THREE.Group(); scene.add(ring);
  const screens=[]; const loader=new THREE.TextureLoader();
  PROJECTS.forEach((p,i)=>{
    const a=i*STEP, px=Math.sin(a)*R, pz=Math.cos(a)*R, big=i===0?1.22:1, w=32*big, h=20*big;
    const holder=new THREE.Group();
    const frame=new THREE.Mesh(new THREE.PlaneGeometry(w+2.2,h+2.2),
      new THREE.MeshBasicMaterial({color:0x37E2E2,toneMapped:false})); frame.position.z=-0.12; holder.add(frame);
    // video element (same-origin, muted, loop)
    const video=document.createElement('video');
    video.src=p.vid; video.loop=true; video.muted=true; video.playsInline=true; video.preload='auto'; video.setAttribute('playsinline','');
    const vtex=new THREE.VideoTexture(video); vtex.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:vtex,emissiveIntensity:0.8,roughness:1,metalness:0});
    // fallback: if video errors, use screenshot
    video.addEventListener('error',()=>{ loader.load(p.img,t=>{ t.colorSpace=THREE.SRGBColorSpace; mat.emissiveMap=t; mat.needsUpdate=true; }); });
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
    screen.userData={url:p.url,video,angle:a};
    holder.add(screen);
    const label=labelSprite(p.name); label.position.set(0,-(h/2)-3.4,0.2); holder.add(label);
    holder.position.set(px,SY,pz); holder.lookAt(0,SY,0); holder.userData.phase=i*1.1;
    ring.add(holder); screens.push(screen);
  });

  // ---- post ----
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), isMobile?0.34:0.38, 0.4, 0.55);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  // ---- scroll-driven cinematic camera ----
  const CENTER=new THREE.Vector3(0,SY,0);
  const HERO=new THREE.Vector3(0,SY+6,26);          // slightly above eye, looks toward the horizon (city reads)
  const DESCEND_START=new THREE.Vector3(0,SY+70,80);
  const INTRO=reduced?0:4.6;
  const START_YAW=-0.52;                            // off-axis so the city gap is behind the text, main screen beside it
  let yaw=START_YAW, targetYaw=START_YAW, dragging=false, lastX=0, moved=0;
  const clock=new THREE.Clock(); let elapsed=0;
  const ringPoint=(y)=>new THREE.Vector3(Math.sin(y)*R,SY,Math.cos(y)*R);
  const easeIO=(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function arenaProgress(){ const H=innerHeight; const len=innerHeight*3.2; return Math.min(1,Math.max(0,(scrollY-H*0.15)/len)); }

  // interaction
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
  if('IntersectionObserver' in window && sentinel){
    new IntersectionObserver(es=>{ running=!es[0].isIntersecting; if(running&&!raf) loop(); },{threshold:0}).observe(sentinel);
  }
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running&&!raf) loop(); });

  let lastCenter=-1;
  function loop(){
    if(!running){ raf=null; return; }
    raf=requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(),0.05); elapsed+=dt;
    const q=arenaProgress();

    if(INTRO>0 && elapsed<INTRO && scrollY<innerHeight*0.4){
      const t=easeIO(elapsed/INTRO);
      camera.position.lerpVectors(DESCEND_START,HERO,t); camera.lookAt(ringPoint(START_YAW));
    } else {
      // q 0..0.32: fly from HERO into exact CENTER ; q>0.32: orbit endlessly
      const dive=easeIO(Math.min(1,q/0.32));
      camera.position.lerpVectors(HERO,CENTER,dive);
      if(q>0.32 || dragging){ if(!dragging) targetYaw = START_YAW-(q-0.32)*Math.PI*5; }
      if(reduced && !dragging) targetYaw = START_YAW;
      yaw += (targetYaw-yaw)*Math.min(1,dt*4);
      camera.lookAt(ringPoint(yaw));
    }

    // play only the screen(s) near center; pause the rest (perf)
    let best=0,bestD=99;
    screens.forEach((s,i)=>{
      let d=Math.abs(((s.userData.angle - yaw + Math.PI)%(Math.PI*2)) - Math.PI);
      const v=s.userData.video;
      if(d<1.05){ if(v.paused) v.play().catch(()=>{}); } else if(!v.paused){ v.pause(); }
      if(d<bestD){bestD=d;best=i;}
    });
    if(best!==lastCenter){ lastCenter=best; setCaption(best); }

    ring.children.forEach(h=>{ h.position.y=SY+Math.sin(elapsed*0.8+h.userData.phase)*0.6; });
    composer.render();
  }
  loop();
}
