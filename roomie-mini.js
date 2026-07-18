import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const roles = {
  beaver: { size:[3.2,3.2], view:-1 }, cat:{ size:[2.9,3.4], view:1 }, owl:{ size:[2.8,3.25], view:-1 },
  fox:{ size:[2.85,3.45], view:1 }, bunny:{ size:[3.1,3.05], view:-1 }, turtle:{ size:[3.3,2.75], view:1 }
};

function cutout(path, done) {
  const image = new Image(); image.onload = () => {
    const c = document.createElement('canvas'); c.width=image.naturalWidth; c.height=image.naturalHeight;
    const ctx=c.getContext('2d'); ctx.drawImage(image,0,0); const data=ctx.getImageData(0,0,c.width,c.height); const px=data.data;
    const orange=i=>{const r=px[i],g=px[i+1],b=px[i+2],a=px[i+3];return a>20&&r>180&&r>g*1.28&&r>b*1.42&&g<190&&b<145;};
    const visited=new Uint8Array(c.width*c.height), stack=[];
    for(let x=0;x<c.width;x++) stack.push(x,(c.height-1)*c.width+x);
    for(let y=1;y<c.height-1;y++) stack.push(y*c.width,y*c.width+c.width-1);
    while(stack.length){const n=stack.pop();if(n<0||n>=visited.length||visited[n]||!orange(n*4))continue;visited[n]=1;px[n*4+3]=0;const x=n%c.width;if(x)stack.push(n-1);if(x<c.width-1)stack.push(n+1);if(n>=c.width)stack.push(n-c.width);if(n<visited.length-c.width)stack.push(n+c.width);}
    ctx.putImageData(data,0,0); let minX=c.width,minY=c.height,maxX=0,maxY=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(px[(y*c.width+x)*4+3]>24){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    const pad=20;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(c.width,maxX+pad);maxY=Math.min(c.height,maxY+pad);
    const crop=document.createElement('canvas');crop.width=maxX-minX;crop.height=maxY-minY;crop.getContext('2d').drawImage(c,minX,minY,crop.width,crop.height,0,0,crop.width,crop.height);
    const texture=new THREE.CanvasTexture(crop);texture.colorSpace=THREE.SRGBColorSpace;done(texture,crop.width/crop.height);
  }; image.src=path;
}

function makeHouse(host) {
  const slug=host.dataset.role; const role=roles[slug]||roles.cat;
  const canvas=host.querySelector('canvas'); const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(24,4/3,.1,100);camera.position.set(0,.15,9.8);camera.lookAt(0,.05,0);
  scene.add(new THREE.HemisphereLight('#fffaf1','#9b6855',2.25));const light=new THREE.DirectionalLight('#fff3e4',3.25);light.position.set(-4,6,8);scene.add(light);
  const rim=new THREE.DirectionalLight('#d88b6b',.8);rim.position.set(5,1,4);scene.add(rim);
  const mat=(c,roughness=.88)=>new THREE.MeshStandardMaterial({color:c,roughness,metalness:0});
  const house=new THREE.Group();house.position.set(0,-.18,0);house.rotation.y=role.view*.18;scene.add(house);

  const shadow=new THREE.Mesh(new THREE.CircleGeometry(2.05,48),new THREE.MeshBasicMaterial({color:'#6c4a3d',transparent:true,opacity:.12,depthWrite:false}));shadow.scale.y=.23;shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-1.18,.05);scene.add(shadow);

  const wall=new THREE.Mesh(new THREE.BoxGeometry(3.45,2.15,.92),mat('#e9bda8'));wall.position.set(0,-.12,0);house.add(wall);
  const tower=new THREE.Mesh(new THREE.BoxGeometry(1.12,3.02,1.02),mat('#efc9b6'));tower.position.set(1.12,.32,-.01);house.add(tower);
  const roofLow=new THREE.Mesh(new THREE.BoxGeometry(3.66,.12,1.12),mat('#bd755f'));roofLow.position.set(0,1.0,.02);house.add(roofLow);
  const roofHigh=new THREE.Mesh(new THREE.BoxGeometry(1.32,.12,1.2),mat('#bd755f'));roofHigh.position.set(1.12,1.86,.02);house.add(roofHigh);

  const arch=(w,h,color,z)=>{const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(-w/2,h*.12);s.absarc(0,h*.12,w/2,Math.PI,0,false);s.lineTo(w/2,-h/2);s.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s,28),mat(color));mesh.position.z=z;return mesh;};
  const frame=arch(1.48,1.55,'#fbf1df',.52);frame.position.set(-.58,.18,.52);house.add(frame);
  const glass=arch(1.25,1.34,'#f3ddc5',.55);glass.material.transparent=true;glass.material.opacity=.72;glass.position.set(-.58,.17,.55);house.add(glass);
  const upperWindow=arch(.48,.66,'#f8ead6',.57);upperWindow.position.set(1.12,.82,.57);house.add(upperWindow);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.56,1.08,.08),mat('#66463b'));door.position.set(1.12,-.58,.57);house.add(door);
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),mat('#e7bf75',.45));knob.position.set(1.28,-.57,.63);house.add(knob);
  const sill=new THREE.Mesh(new THREE.BoxGeometry(1.58,.09,.25),mat('#c58770'));sill.position.set(-.58,-.5,.68);house.add(sill);

  const character=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,alphaTest:.02,depthTest:false,depthWrite:false}));character.position.set(-.58,.02,.76);character.renderOrder=8;house.add(character);
  cutout(`assets/roommate-type-cards/RoommateTypeCard_${slug}.png`,(texture,aspect)=>{character.material.map=texture;character.material.needsUpdate=true;const h=role.size[1]*.72;character.scale.set(Math.min(1.26,h*aspect),h,1);renderer.render(scene,camera);});
  function resize(){const rect=host.getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();renderer.render(scene,camera);}
  addEventListener('resize',resize);resize();
  renderer.render(scene,camera);
}

document.querySelectorAll('[data-mini-house]').forEach(makeHouse);
