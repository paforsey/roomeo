(() => {
  const images = document.querySelectorAll('img[data-role-cutout]');
  const orange = (data, i) => {
    const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
    return a>20 && r>232 && g>66 && g<148 && b<88 && r-g>108;
  };
  images.forEach((img) => {
    const source = img.currentSrc || img.src;
    const work = new Image();
    work.onload = () => {
      const c=document.createElement('canvas'); c.width=work.naturalWidth; c.height=work.naturalHeight;
      const ctx=c.getContext('2d'); ctx.drawImage(work,0,0);
      const image=ctx.getImageData(0,0,c.width,c.height); const px=image.data;
      for(let p=0;p<c.width*c.height;p++) if(orange(px,p*4)) px[p*4+3]=0;
      ctx.putImageData(image,0,0);
      let minX=c.width,minY=c.height,maxX=0,maxY=0;
      for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(px[(y*c.width+x)*4+3]>24){ minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }
      const pad=18; minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad); maxX=Math.min(c.width,maxX+pad); maxY=Math.min(c.height,maxY+pad);
      const crop=document.createElement('canvas'); crop.width=maxX-minX; crop.height=maxY-minY;
      crop.getContext('2d').drawImage(c,minX,minY,crop.width,crop.height,0,0,crop.width,crop.height);
      img.src=crop.toDataURL('image/png'); img.classList.add('is-ready');
    };
    work.src=source;
  });
})();
