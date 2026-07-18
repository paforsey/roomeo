import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const host = document.querySelector('[data-roomie-cast]');
if (host) {
  const stage = host.querySelector('.cast-stage');
  const canvas = host.querySelector('.cast-canvas');
  const info = host.querySelector('.cast-role-info');
  const indexNode = host.querySelector('[data-cast-index]');
  const nameNode = host.querySelector('[data-cast-name]');
  const sloganNode = host.querySelector('[data-cast-slogan]');
  const counter = host.querySelector('[data-cast-counter]');
  const roles = [
    { slug:'cat', name:'The Cat', slogan:"I don't live here. I'm just a recurring guest in your life.", window:'rect', size:[2.62,2.42] },
    { slug:'owl', name:'The Owl', slogan:"I'm not being rude, I'm just practicing the fine art of existing without being perceived.", window:'rect', size:[2.62,2.42] },
    { slug:'beaver', name:'The Beaver', slogan:"I'm not controlling, I'm just the only one here with a frontal lobe.", window:'arch', size:[2.62,2.58] },
    { slug:'bunny', name:'The Bunny', slogan:"Living alone is for people with boring secrets. Anyway, is it okay if 8 people come over for a few drinks?", window:'rect', size:[2.62,2.42] },
    { slug:'fox', name:'The Fox', slogan:"I know I haven't done my dishes, but look at this vintage lamp I found on the sidewalk!", window:'arch', size:[2.62,2.58] },
    { slug:'turtle', name:'The Turtle', slogan:"I'm not stuck at home. I'm thriving in my ecosystem. Also, is that my specialized mug you're touching?", window:'rect', size:[2.62,2.42] },
  ];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f8f2e8', 30, 80);
  const camera = new THREE.OrthographicCamera(-10,10,6,-6,.1,100);
  const house = new THREE.Group(); house.position.y = -3.6; scene.add(house);
  const mat = (color, rough=.9) => new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:0 });
  // Let the facade disappear into the page; the windows and roof define the house.
  const wallMat = new THREE.MeshBasicMaterial({color:'#eadbcf',toneMapped:false});
  const sillMat = mat('#bd8977',.82);
  const frameMat = mat('#a97061',.84);
  const roofMat = mat('#b96f5b',.82);
  const roomPalette = ['#f5e8dc','#eedfd4','#f7eadc','#edddd2','#f3e3d7','#efe2d8'];
  scene.add(new THREE.HemisphereLight('#fffaf2','#f2b18d',1.35));
  const sun = new THREE.DirectionalLight('#fff4e5',2.15); sun.position.set(-5,11,10); sun.castShadow=true; scene.add(sun);

  const body = new THREE.Mesh(new THREE.BoxGeometry(13.55,6.8,4.2), wallMat);
  body.position.set(0,3.4,0); house.add(body);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(13.8,.1,.34),wallMat);
  plinth.position.set(0,.05,2.12); house.add(plinth);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-7.3,0); roofShape.lineTo(-2.15,2.02); roofShape.lineTo(2.15,2.02); roofShape.lineTo(7.3,0); roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape,{depth:4.35,bevelEnabled:false}); roofGeo.translate(0,0,-2.18);
  const roof = new THREE.Mesh(roofGeo, roofMat); roof.position.y=6.82; roof.castShadow=true; roof.receiveShadow=true; house.add(roof);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(14.75,.13,.36), frameMat); eave.position.set(0,6.8,2.22); house.add(eave);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(14.72,.055,.18),frameMat); fascia.position.set(0,6.72,2.34); house.add(fascia);
  const chimneyBase=new THREE.Mesh(new THREE.BoxGeometry(.86,.72,.34),wallMat); chimneyBase.position.set(-4.05,8.12,2.31); house.add(chimneyBase);
  [-4.21,-3.89].forEach(x=>{const stack=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,.5,20),frameMat);stack.position.set(x,8.64,2.42);house.add(stack);});
  const smoke=[];
  for(let i=0;i<10;i++){
    const smokeMaterial=new THREE.MeshBasicMaterial({color:'#bba99b',transparent:true,opacity:0,depthWrite:false,toneMapped:false});
    const puff=new THREE.Mesh(new THREE.SphereGeometry(1,18,18),smokeMaterial);
    puff.userData={phase:i/10,baseX:i%2?-3.89:-4.21}; puff.position.z=2.43; house.add(puff); smoke.push(puff);
  }
  const edgeMat = wallMat;
  const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(.13,6.82,.22), edgeMat); leftEdge.position.set(-6.775,3.4,2.2); house.add(leftEdge);
  const rightEdge = leftEdge.clone(); rightEdge.position.x=6.775; house.add(rightEdge);

  function shapeFor(type,w,h) {
    const s = new THREE.Shape();
    if (type === 'arch') { s.moveTo(-w/2,-h/2); s.lineTo(-w/2,h*.12); s.absarc(0,h*.12,w/2,Math.PI,0,true); s.lineTo(w/2,-h/2); s.closePath(); }
    else { s.moveTo(-w/2,-h/2); s.lineTo(w/2,-h/2); s.lineTo(w/2,h/2); s.lineTo(-w/2,h/2); s.closePath(); }
    return s;
  }

  function cutoutTexture(path, done) {
    const img = new Image(); img.onload = () => {
      const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0); const image=ctx.getImageData(0,0,c.width,c.height); const px=image.data;
      const isOrange=i=>{const r=px[i],g=px[i+1],b=px[i+2],a=px[i+3];return a>20&&r>232&&g>66&&g<148&&b<88&&r-g>108;};
      for(let p=0;p<c.width*c.height;p++) if(isOrange(p*4)) px[p*4+3]=0;
      const isLooseOrange=i=>{const r=px[i],g=px[i+1],b=px[i+2],a=px[i+3];return a>20&&r>135&&r>g*1.28&&r>b*1.42&&g<190&&b<145;};
      const bgSeen=new Uint8Array(c.width*c.height), bgStack=[];
      for(let x=0;x<c.width;x++){bgStack.push(x,(c.height-1)*c.width+x);} for(let y=1;y<c.height-1;y++){bgStack.push(y*c.width,y*c.width+c.width-1);}
      while(bgStack.length){const n=bgStack.pop(); if(n<0||n>=bgSeen.length||bgSeen[n]||!isLooseOrange(n*4)) continue; bgSeen[n]=1; px[n*4+3]=0; const x=n%c.width; if(x>0) bgStack.push(n-1); if(x<c.width-1) bgStack.push(n+1); if(n>=c.width) bgStack.push(n-c.width); if(n<bgSeen.length-c.width) bgStack.push(n+c.width);}
      // The source cards occasionally leave one-pixel fragments after the orange key.
      // Drop only tiny disconnected islands so the character stays intact.
      const seen=new Uint8Array(c.width*c.height), dirs=[1,-1,c.width,-c.width];
      for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) { const start=y*c.width+x; if(seen[start]||px[start*4+3]<=24) continue; const stack=[start], island=[]; seen[start]=1;
        while(stack.length){const n=stack.pop(); island.push(n); const nx=n%c.width, ny=(n/c.width)|0; for(const d of dirs){const q=n+d; if(q<0||q>=seen.length||seen[q]||((d===1||d===-1)&&((q%c.width)-nx)!==d)) continue; if(px[q*4+3]>24){seen[q]=1;stack.push(q);}}}
        if(island.length<1200) for(const n of island) px[n*4+3]=0;
      }
      ctx.putImageData(image,0,0); let minX=c.width,minY=c.height,maxX=0,maxY=0;
      for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(px[(y*c.width+x)*4+3]>24){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      const pad=18; minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(c.width,maxX+pad);maxY=Math.min(c.height,maxY+pad);
      const crop=document.createElement('canvas'); crop.width=maxX-minX; crop.height=maxY-minY; crop.getContext('2d').drawImage(c,minX,minY,crop.width,crop.height,0,0,crop.width,crop.height);
      const tex=new THREE.CanvasTexture(crop); tex.colorSpace=THREE.SRGBColorSpace; done(tex,crop.width/crop.height);
    }; img.src=path;
  }

  const rooms=[];
  roles.forEach((role,i)=>{
    const col=i%3, row=i<3?0:1, [ww,hh]=role.size;
    const group=new THREE.Group(); group.name=role.name; group.position.set((col-1)*4.55,row===0?4.92:1.42,2.55);
    const recess=new THREE.Mesh(new THREE.ShapeGeometry(shapeFor(role.window,ww+.16,hh+.16)),mat('#8f675c',.9)); recess.position.z=.01; group.add(recess);
    const frameGeometry=new THREE.ExtrudeGeometry(shapeFor(role.window,ww+.09,hh+.09),{depth:.09,bevelEnabled:true,bevelSegments:3,bevelSize:.022,bevelThickness:.022});
    const frame=new THREE.Mesh(frameGeometry,frameMat); frame.position.z=.06; group.add(frame);
    const innerMat=mat(roomPalette[i],.96);
    const inner=new THREE.Mesh(new THREE.ShapeGeometry(shapeFor(role.window,ww,hh)),innerMat); inner.position.z=.21; inner.receiveShadow=true; group.add(inner);
    const shade=new THREE.Mesh(new THREE.ShapeGeometry(shapeFor(role.window,ww*.94,hh*.94)),new THREE.MeshBasicMaterial({color:'#5d443c',transparent:true,opacity:.04,depthWrite:false,toneMapped:false})); shade.position.set(-.045,.045,.235); group.add(shade);
    const characterMaterial=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.02,depthTest:false,toneMapped:false});
    const character=new THREE.Mesh(new THREE.PlaneGeometry(1,1),characterMaterial); character.position.set(0,-.12,.48); group.add(character);
    cutoutTexture(`assets/roommate-type-cards/RoommateTypeCard_${role.slug}.png`,(texture,aspect)=>{character.material.map=texture;character.material.needsUpdate=true;const h=hh*.9;character.scale.set(Math.min(ww*.88,h*aspect),h,1);});
    const windowSill=new THREE.Mesh(new THREE.BoxGeometry(ww+.28,.075,.26),sillMat); windowSill.position.set(0,-hh/2-.038,.35); group.add(windowSill);
    house.add(group); rooms.push(group);
  });

  const route=[
    {p:0,pos:[0,1.45,25],target:[0,1.45,0]},
    {p:.12,pos:[-4.4,1.62,25],target:[-4.4,1.62,0]},
    {p:.26,pos:[0,1.62,25],target:[0,1.62,0]},
    {p:.40,pos:[4.4,1.62,25],target:[4.4,1.62,0]},
    {p:.54,pos:[-4.4,-1.88,25],target:[-4.4,-1.88,0]},
    {p:.68,pos:[0,-1.88,25],target:[0,-1.88,0]},
    {p:.82,pos:[4.4,-1.88,25],target:[4.4,-1.88,0]},
    {p:.94,pos:[0,1.45,25],target:[0,1.45,0]},
    {p:1,pos:[0,1.45,25],target:[0,1.45,0]},
  ];
  const ease=t=>t*t*(3-2*t);
  function routeAt(p){for(let i=0;i<route.length-1;i++)if(p<=route[i+1].p){const a=route[i],b=route[i+1],t=ease((p-a.p)/(b.p-a.p));return{pos:a.pos.map((v,j)=>THREE.MathUtils.lerp(v,b.pos[j],t)),target:a.target.map((v,j)=>THREE.MathUtils.lerp(v,b.target[j],t))};}return route[route.length-1];}
  function resize(){const rect=stage.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height),fh=12,fw=fh*w/h;renderer.setSize(w,h,false);camera.left=-fw/2;camera.right=fw/2;camera.top=fh/2;camera.bottom=-fh/2;camera.updateProjectionMatrix();}
  addEventListener('resize',resize); resize(); camera.position.set(...route[0].pos); camera.lookAt(new THREE.Vector3(...route[0].target));
  function render(){
    const max=Math.max(1,host.offsetHeight-stage.clientHeight);
    const hostTop=host.getBoundingClientRect().top+scrollY;
    const p=Math.min(1,Math.max(0,(scrollY-hostTop)/max));
    const r=routeAt(p);
    camera.position.lerp(new THREE.Vector3(...r.pos),.12); camera.lookAt(new THREE.Vector3(...r.target)); camera.zoom=1.05+Math.sin(p*Math.PI)*.95; camera.updateProjectionMatrix();
    let active=-1;
    if(p>=.06&&p<=.86) active=Math.min(5,Math.floor((p-.06)/.14));
    if(active<0){info.classList.remove('is-visible');counter.textContent=p>.86?'':'Scroll to meet all six';}
    else{info.classList.add('is-visible');indexNode.textContent=`ROOMIE TYPE · ${String(active+1).padStart(2,'0')} / 06`;nameNode.textContent=roles[active].name;sloganNode.textContent=roles[active].slogan;counter.textContent='';}
    const now=performance.now()*.001;
    smoke.forEach(puff=>{const cycle=(now*.17+puff.userData.phase)%1;puff.position.x=puff.userData.baseX+Math.sin(now*1.25+puff.userData.phase*12)*.13;puff.position.y=8.99+cycle*1.55;const size=.06+cycle*.21;puff.scale.set(size*1.15,size,size);puff.material.opacity=.19*Math.pow(1-cycle,1.45);});
    rooms.forEach((room,i)=>room.scale.setScalar(active===i?1:.965)); renderer.render(scene,camera); requestAnimationFrame(render);
  }
  render();
}
