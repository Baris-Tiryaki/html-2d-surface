function CanvasControlls(cnvs){
  this.surface={cnvs:cnvs, ctx:cnvs.getContext("2d"), wid:1000, hei:1000};
  this.mapping={centerX:0, centerY:0, upp:0.01};
  this.constants={zoomSpeed:1.0};
  this.renderState="clean";
  cnvs.style.position="fixed";
  cnvs.style.top="0px";
  cnvs.style.left="0px";

  this.resizeCanvas = () =>  {
    var surface = this.surface, mapping=this.mapping;

    var scaling = surface.wid*surface.hei;

    surface.wid = window.innerWidth;
    surface.hei = window.innerHeight;

    mapping.upp*=Math.sqrt(scaling/(surface.wid*surface.hei));
    surface.cnvs.width = surface.wid;
    surface.cnvs.height = surface.hei;

    this.renderState = "dirty";
  }

  this.zoom = (e) => {
    console.debug(e);
    if(e.ctrlKey==1) return; //ctrl+scroll should resize the page, not zoom
    var surface = this.surface, mapping=this.mapping;

    var zoomCenterX = mapping.centerX + (e.x-surface.wid/2)* mapping.upp,
        zoomCenterY = mapping.centerY - (e.y-surface.hei/2)* mapping.upp;

    mapping.upp *= Math.exp(- this.constants.zoomSpeed * e.wheelDelta / 1000.0);

    mapping.centerX = zoomCenterX - (e.x-surface.wid/2)*mapping.upp;
    mapping.centerY = zoomCenterY + (e.y-surface.hei/2)*mapping.upp;

    this.renderState = "dirty";
  }
  this.cursor={
    mouse:{active:false},
    touches:[],
    mouseDown: (e)=> {
      if(e.button==0){
        console.debug(e);
        this.cursor.mouse={active:true, x:e.x, y:e.y};
      }
    },
    mouseMove: (e)=> {
      var mouse=this.cursor.mouse, mapping = this.mapping;
      if(mouse.active==true){
        console.debug(e);
        var dx = (e.x-mouse.x), dy = (e.y-mouse.y);
        if(dx != 0 || dy != 0){
          mapping.centerX -= dx*mapping.upp;
          mapping.centerY += dy*mapping.upp;
          this.renderState = "dirty";
          mouse.x=e.x;    mouse.y=e.y;
        }
      }
    },
    mouseUp: (e) => {
      console.debug(e);
      this.cursor.mouse={active:false};
    },
    touchHandler: (e)=>{
      e.preventDefault();
      var newTouches=new Array(e.targetTouches.length), touches=this.cursor.touches, mapping=this.mapping, wid=this.surface.wid, hei=this.surface.hei;
      for(var i=0; i<newTouches.length; i++ )
        newTouches[i]={x:e.targetTouches[i].clientX, y:e.targetTouches[i].clientY};
      //console.log(newTouches);

      if(touches.length == newTouches.length){
        if(touches.length==1){ // just move
          var dx = (newTouches[0].x-touches[0].x);
          var dy = (newTouches[0].y-touches[0].y);
          mapping.centerX -= dx*mapping.upp;
          mapping.centerY += dy*mapping.upp;
          console.debug("1");
          this.renderState = "dirty";
        }
        else if(touches.length>=2){ //zoom in / out
          var o1=touches[0], o2=touches[1], n1=newTouches[0], n2=newTouches[1]; //old and new
          var oldTouchX = mapping.centerX + (o1.x+o2.x-wid)/2*mapping.upp; //in units
          var oldTouchY = mapping.centerY - (o1.y+o2.y-hei)/2*mapping.upp;
          mapping.upp *= Math.hypot(o1.x-o2.x, o1.y-o2.y)/Math.hypot(n1.x-n2.x, n1.y-n2.y);
          mapping.centerX = oldTouchX - (n1.x+n2.x-wid)/2*mapping.upp;
          mapping.centerY = oldTouchY + (n1.y+n2.y-hei)/2*mapping.upp;
          console.debug("2");
          this.renderState = "dirty";
        }
      }
      this.cursor.touches=newTouches;
    }
  }
  this.render = () => {
    var ctx = this.surface.ctx, wid=this.surface.wid, hei=this.surface.hei, centerX=this.mapping.centerX, centerY=this.mapping.centerY, upp=this.mapping.upp;
    ctx.fillRect(0,0, wid, hei);
    ctx.beginPath();
    ctx.strokeStyle="#ffffff";
    cc.surface.ctx.lineWidth=1.0;
    var i,x,y;
    for(i=3; i<100; i += 3/Math.sqrt(i)){
      x=i*Math.cos(i)/10;
      y=i*Math.sin(i)/10;
      ctx.lineTo(wid/2 + (x-centerX)/upp, hei/2 - (y-centerY)/upp);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle="#00ff00";
    for(i=0;i<6;i++){
      ctx.lineTo(Math.random()*wid/30,Math.random()*hei/30);
    }
    ctx.stroke();
  }
  this.loop = () => {
    if(this.renderState=="dirty") this.render();
    this.renderState="";
    requestAnimationFrame(this.loop);
  }


  window.setTimeout(this.loop,100);

  this.resizeCanvas();
  window.addEventListener('resize',this.resizeCanvas);
  document.body.addEventListener('wheel',this.zoom);
  this.surface.cnvs.addEventListener('mousedown',this.cursor.mouseDown);
  this.surface.cnvs.addEventListener('mousemove',this.cursor.mouseMove);
  window.addEventListener('mouseup',this.cursor.mouseUp);

  this.surface.cnvs.addEventListener('touchdown', this.cursor.touchHandler);
  this.surface.cnvs.addEventListener('touchmove', this.cursor.touchHandler);
  document.body.addEventListener('touchend', this.cursor.touchHandler);
}
