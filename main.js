import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PROJECTS = [
  { name:'Portfolio-OS',   img:'assets/portfolio-os.jpg',   url:'https://portfolio-os-navy.vercel.app' },
  { name:"D'extensionz",   img:'assets/dextensionz.jpg',    url:'https://dextensionz-site.vercel.app' },
  { name:'Sandy · AI',     img:'assets/sandy.jpg',          url:'https://chain-recall.vercel.app' },
  { name:"D'oppebraids",   img:'assets/doppebraids.jpg',    url:'https://doppebraids-site-henna.vercel.app' },
  { name:'Prompt Gen',     img:'assets/ultimate-prompt.jpg',url:'https://prompts.tdotssolutionsz.com' },
  { name:'ThrowingTracker',img:'assets/throwing-tracker.jpg',url:'https://throwing-tracker.vercel.app' },
  { name:'Options Course', img:'assets/options-course.jpg', url:'https://optionstradingcourse.vercel.app' },
];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = innerWidth < 760;

function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }

if(!hasWebGL()){ document.body.classList.add('no-webgl'); hideLoader(); }
else { try { init(); } catch(err){ console.error('Arena init failed:', err); document.body.classList.add('no-webgl'); hideLoader(); } }

function hideLoader(){ const l=document.getElementById('loader'); if(l){ l.classList.add('gone'); setTimeout(()=>l.remove(),900); } }

/* ---------- textures ---------- */
function windowTexture(){
  const c=document.createElement('canvas'); c.width=128; c.height=256; const g=c.getContext('2d');
  g.fillStyle='#060b13'; g.fillRect(0,0,128,256);
  const cols=6, rows=14, pad=6, cw=(128-pad*(cols+1))/cols, ch=(256-pad*(rows+1))/rows;
  const lit=['#37E2E2','#8ff0ff','#FFB347','#FF2E9A','#dff6ff'];
  for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){
    const on=Math.random()<0.5;
    g.fillStyle = on ? lit[(Math.random()*lit.length)|0] : '#0c1622';
    g.globalAlpha = on ? (0.55+Math.random()*0.45) : 1;
    g.fillRect(pad+col*(cw+pad), pad+r*(ch+pad), cw, ch);
  }
  g.globalAlpha=1;
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function skyTexture(){
  const c=document.createElement('canvas'); c.width=8; c.height=256; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,256);
  grd.addColorStop(0,'#02040a'); grd.addColorStop(0.58,'#081525'); grd.addColorStop(0.85,'#0e2c48'); grd.addColorStop(1,'#123f57');
  g.fillStyle=grd; g.fillRect(0,0,8,256);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function gridTexture(){
  const c=document.createElement('canvas'); c.width=256; c.height=256; const g=c.getContext('2d');
  g.clearRect(0,0,256,256); g.strokeStyle='#37E2E2'; g.lineWidth=2; g.globalAlpha=0.5;
  g.beginPath(); g.moveTo(0,0); g.lineTo(256,0); g.moveTo(0,0); g.lineTo(0,256); g.stroke();
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
function labelSprite(text){
  const c=document.createElement('canvas'); c.width=512; c.height=96; const g=c.getContext('2d');
  g.fillStyle='rgba(0,0,0,0)'; g.fillRect(0,0,512,96);
  g.font='700 34px "Space Mono", monospace'; g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#EAF6FF'; g.fillText(text.toUpperCase(),256,48);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false});
  const s=new THREE.Sprite(m); s.scale.set(26,4.9,1); return s;
}

function init(){
  const canvas=document.getElementById('bg');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  scene.background=skyTexture();
  scene.fog=new THREE.FogExp2(0x05090f, 0.0031);

  const camera=new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 5000);

  scene.add(new THREE.HemisphereLight(0x2a4a70, 0x04060b, 0.32));
  scene.add(new THREE.AmbientLight(0x1a2740, 0.26));
  const key=new THREE.DirectionalLight(0x9fe8ff,0.35); key.position.set(60,120,40); scene.add(key);

  /* ---- city ---- */
  const winTex=windowTexture();
  const box=new THREE.BoxGeometry(1,1,1);
  const R=64, CLEAR=110;
  const count=isMobile?70:160;
  const tints=[0x0a1424,0x0b1830,0x0c1420,0x101a2c];
  for(let i=0;i<count;i++){
    let x,z,tries=0;
    do{ x=(Math.random()-0.5)*1000; z=(Math.random()-0.5)*1000; tries++; }
    while(Math.hypot(x,z)<CLEAR && tries<12);
    const w=6+Math.random()*16, d=6+Math.random()*16, h=18+Math.pow(Math.random(),1.6)*170;
    const em=winTex.clone(); em.needsUpdate=true; em.wrapS=em.wrapT=THREE.RepeatWrapping;
    em.repeat.set(Math.max(1,Math.round(w/5)), Math.max(2,Math.round(h/9)));
    const mat=new THREE.MeshStandardMaterial({
      color:tints[i%tints.length], roughness:.85, metalness:.15,
      emissive:0xffffff, emissiveMap:em, emissiveIntensity:0.45+Math.random()*0.35
    });
    const m=new THREE.Mesh(box,mat);
    m.position.set(x,h/2,z); m.scale.set(w,h,d);
    scene.add(m);
  }

  /* ---- ground + neon grid ---- */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),
    new THREE.MeshStandardMaterial({color:0x04070d,roughness:.35,metalness:.6}));
  ground.rotation.x=-Math.PI/2; scene.add(ground);
  const gtex=gridTexture(); gtex.repeat.set(90,90);
  const grid=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),
    new THREE.MeshBasicMaterial({map:gtex,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  grid.rotation.x=-Math.PI/2; grid.position.y=0.15; scene.add(grid);

  /* ---- screen ring ---- */
  const ring=new THREE.Group(); scene.add(ring);
  const screens=[]; const loader=new THREE.TextureLoader();
  const SY=52, step=(Math.PI*2)/PROJECTS.length;
  let loaded=0;
  PROJECTS.forEach((p,i)=>{
    const a=i*step;
    const px=Math.sin(a)*R, pz=Math.cos(a)*R;
    const big=i===0?1.28:1;
    const w=34*big, h=21*big;
    // glow frame (behind, slightly larger)
    const frame=new THREE.Mesh(new THREE.PlaneGeometry(w+2.4,h+2.4),
      new THREE.MeshBasicMaterial({color:0x37E2E2,toneMapped:false}));
    // screen
    const tex=loader.load(p.img, ()=>{ if(++loaded>=1) hideLoader(); });
    tex.colorSpace=THREE.SRGBColorSpace;
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
      new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:1.05,roughness:1,metalness:0}));
    screen.userData.url=p.url;
    const holder=new THREE.Group();
    frame.position.z=-0.15; holder.add(frame); holder.add(screen);
    const label=labelSprite(p.name); label.position.set(0,-(h/2)-4,0.2); holder.add(label);
    holder.position.set(px,SY,pz); holder.lookAt(0,SY,0);
    holder.userData.baseY=SY; holder.userData.phase=i*1.1;
    ring.add(holder); screens.push(screen);
  });
  // safety: hide loader even if a texture stalls
  setTimeout(hideLoader, 4000);

  /* ---- particles (haze) ---- */
  const pcount=isMobile?400:900; const ppos=new Float32Array(pcount*3);
  for(let i=0;i<pcount;i++){ ppos[i*3]=(Math.random()-0.5)*600; ppos[i*3+1]=Math.random()*220; ppos[i*3+2]=(Math.random()-0.5)*600; }
  const pgeo=new THREE.BufferGeometry(); pgeo.setAttribute('position',new THREE.BufferAttribute(ppos,3));
  const haze=new THREE.Points(pgeo,new THREE.PointsMaterial({color:0x8fe8ff,size:0.7,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
  scene.add(haze);

  /* ---- post ---- */
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), isMobile?0.5:0.62, 0.5, 0.26);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---- camera choreography ---- */
  const CENTER=new THREE.Vector3(0,SY-1,0);
  const START=new THREE.Vector3(150,22,190);
  const FRONT=new THREE.Vector3(0,SY,R);           // hero screen position
  const INTRO=reduced?0:5.6;
  let yaw=0, targetYaw=0, dragging=false, lastX=0, moved=0, downX=0;
  const clock=new THREE.Clock(); let elapsed=0;
  function ringPoint(y){ return new THREE.Vector3(Math.sin(y)*R, SY, Math.cos(y)*R); }
  function easeIO(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

  /* ---- interaction ---- */
  const ray=new THREE.Raycaster(); const ndc=new THREE.Vector2();
  canvas.addEventListener('pointerdown',e=>{ dragging=true; lastX=downX=e.clientX; moved=0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove',e=>{ if(!dragging)return; const dx=e.clientX-lastX; lastX=e.clientX; moved+=Math.abs(dx); targetYaw-=dx*0.006; });
  canvas.addEventListener('pointerup',e=>{ dragging=false;
    if(moved<6){ // treat as click
      ndc.x=(e.clientX/innerWidth)*2-1; ndc.y=-(e.clientY/innerHeight)*2+1;
      ray.setFromCamera(ndc,camera); const hit=ray.intersectObjects(screens,false)[0];
      if(hit&&hit.object.userData.url) window.open(hit.object.userData.url,'_blank','noopener');
    }
  });
  addEventListener('keydown',e=>{ if(e.key==='ArrowLeft')targetYaw-=step; else if(e.key==='ArrowRight')targetYaw+=step;
    else if(e.key==='Enter'){ const i=Math.round(-targetYaw/step); const p=PROJECTS[((i%PROJECTS.length)+PROJECTS.length)%PROJECTS.length]; if(p)window.open(p.url,'_blank','noopener'); } });

  /* ---- resize + pause ---- */
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); bloom.setSize(innerWidth,innerHeight); });
  let running=true;
  const hero=document.querySelector('.hero');
  if('IntersectionObserver' in window && hero){
    new IntersectionObserver(es=>{ running=es[0].isIntersecting; if(running&&!raf) loop(); },{threshold:0.02}).observe(hero);
  }
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running&&!raf) loop(); });

  /* ---- loop ---- */
  let raf=null;
  function loop(){
    if(!running){ raf=null; return; }
    raf=requestAnimationFrame(loop);
    const dt=clock.getDelta(); elapsed+=dt;
    if(INTRO>0 && elapsed<INTRO){
      const t=easeIO(elapsed/INTRO);
      camera.position.lerpVectors(START,CENTER,t);
      camera.lookAt(FRONT);
    } else {
      camera.position.copy(CENTER);
      if(!dragging) targetYaw += (reduced?0:0.0016);
      yaw += (targetYaw-yaw)*Math.min(1,dt*4);
      camera.lookAt(ringPoint(yaw));
    }
    // screen float
    ring.children.forEach(h=>{ h.position.y=h.userData.baseY+Math.sin(elapsed*0.9+h.userData.phase)*0.7; });
    haze.rotation.y += dt*0.01;
    composer.render();
  }
  loop();
}
