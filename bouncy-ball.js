/*
"BallBouncer," by Joshua Hugo, 2017.
Simulates rubber balls bouncing in a box, using HTML divs for display.

Features to add:
-Ability for user to grab and move balls with mouse or touch.
-Shadows for balls.
-Collision between balls.
-Better detection for when a ball has come to rest.
*/

class BallBouncer {
  //Controller class that instantiates and manages all of the subordinate classes.
  //Optional arguments can set a containing element, an array of balls to spawn immediately, gravity, and friction.
  constructor(containerDiv = "body", balls = [], gravity = 1, friction = .01){

    if(!document.querySelector(containerDiv)){

      //If the container does not exist, log an error and abort.
      console.log("Containing element does not exist.");

    } else {

      //Append the necessary CSS to the document head.
      this.appendCSS();

      //Create a new BallContainer instance to hold and manage the balls.
      this.container = new BallContainer(containerDiv, gravity, friction);

      //If an array of settings objects was provided, add instances of TextBall to the BallContainer.
      balls.forEach(ball => {
        this.addBall(ball);
      });

      //Create an instance of AnimationClock to handle the animation loop.
      this.animationClock = new AnimationClock(this.animateBalls, 1000 / 60, this);
      this.animationClock.startClock();
    }
  }
  addBall(ball = {}){
    this.container.addBall(ball);
  }
  animateBalls(thiS){
    thiS.container.updateBalls();
  }
  appendCSS(){
    var CSSstring = ".ball-inner, .ball-inner p, .ball-shading{pointer-events:none}";
    CSSstring += "#ball-container{position:absolute;bottom:0;top:0;left:0;right:0;overflow:hidden;background:#fff;background:-moz-linear-gradient(top,rgba(255,255,255,1) 18%,rgba(232,232,232,1) 85%,rgba(114,114,114,1) 100%);background:-webkit-linear-gradient(top,rgba(255,255,255,1) 18%,rgba(232,232,232,1) 85%,rgba(114,114,114,1) 100%);background:linear-gradient(to bottom,rgba(255,255,255,1) 18%,rgba(232,232,232,1) 85%,rgba(114,114,114,1) 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr='#ffffff', endColorstr='#727272', GradientType=0 )}";
    CSSstring += ".ball-outer{border-radius:100%;overflow:hidden;position:absolute;}";
    CSSstring += ".ball-interrior{width:100%;height:100%;position:absolute}";
    CSSstring += ".ball-shading{z-index:3;background:-moz-radial-gradient(center,ellipse cover,rgba(255,255,255,.9) 0,rgba(125,125,125,0) 51%,rgba(0,0,0,.75) 100%);background:-webkit-radial-gradient(center,ellipse cover,rgba(255,255,255,.9) 0,rgba(125,125,125,0) 51%,rgba(0,0,0,.75) 100%);background:radial-gradient(ellipse at center,rgba(255,255,255,.9) 0,rgba(125,125,125,0) 51%,rgba(0,0,0,.75) 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr='#e6ffffff', endColorstr='#bf000000', GradientType=1 );background-position:-7.5vw -7.5vw;background-repeat:no-repeat;background-size:150%;}";
    CSSstring += ".ball-background{z-index:1;background-color:#dc143c}";
    CSSstring += ".ball-inner{z-index:2;font-size:5vw}";
    CSSstring += ".ball-inner p{text-align:center;position:absolute;top:50%;transform:translate(0,-50%);-webkit-transform:translate(0,-50%);margin:0;width:100%;font-size:4vw;line-height:3vw}";
    if(!document.querySelector("style")){
      document.querySelector("head").appendChild(document.createElement("style"));
    }
    document.querySelector("style").append(document.createTextNode(CSSstring));
  }
}

class BallContainer {
  //Creates the HTML for the container, and methods for adding, removing, and moving the balls.
  constructor(containerDiv, gravity, friction){
    this.gravity = gravity;
    this.friction = 1 - Math.min(friction, .99);
    this.balls = [];
    this.appendContainerHTML(containerDiv);
    this.changeSize();
    window.addEventListener("resize", this.changeSize.bind(this));
  }
  appendContainerHTML(containerDiv){
    this.HTMLcontainer = document.createElement("div");
    this.HTMLcontainer.id = "ball-container";
    document.querySelector(containerDiv).prepend(this.HTMLcontainer);
  }
  changeSize(){
    this.width = this.HTMLcontainer.offsetWidth;
    this.height = this.HTMLcontainer.offsetHeight;
    this.balls.forEach(ball => {
      ball.updatePXsize();
    });
  }
  addBall(ball){
    this.balls.push(new TextBall(ball, this.balls.length));
    document.querySelector("#ball-container").appendChild(this.balls[this.balls.length - 1].ballHTML);
    this.balls[this.balls.length - 1].updatePXsize();
  }
  updateBalls(){
    this.balls.forEach( (ball, index) => {
      if(ball.Xpos < 0){
        ball.Xpos = 0;
        ball.rotVel = ball.Yvel;
      }
      if(ball.Xpos + ball.pxDiameter > this.width){
        ball.Xpos = this.width - ball.pxDiameter;
        ball.rotVel = ball.Yvel * -1;
      }
      if(ball.Xpos <= 0 || ball.Xpos + ball.pxDiameter >= this.width){
        ball.Xvel *= -.8;
        ball.Yvel *= this.friction;
      }
      if(ball.Ypos + ball.pxDiameter >= this.height){
        ball.Ypos = this.height - ball.pxDiameter;
        ball.Yvel *= -.8;
        ball.Xvel *= this.friction;
        ball.rotVel = ball.Xvel;
      }
      if(Math.abs(ball.Yvel) < .5 && ball.Ypos + ball.pxDiameter > this.height - 1 && !ball.Yrest){
        ball.Yvel = 0;
        ball.Yrest = true;
        ball.Ypos = this.height + ball.pxDiameter;
      }
      if(Math.abs(ball.Xvel) < .5 && !ball.Xrest){
        ball.Xvel = 0;
        ball.Xrest = true;
      }
      console.log(ball.Xrest, ball.Yrest, ball.Xvel, ball.Yvel);
      if(ball.Xrest && ball.Yrest){
        this.removeBall(index);
      } else {
        ball.updatePosition(this.gravity);
      }
    });
  }
  removeBall(index){
    this.balls[index].selfDestruct();
    this.balls.splice(index, 1);
  }
}

class AnimationClock {
  //A pausable clock that calls a given function on every "tick". Must be provided with a function to call. Optionally, a numeric "limiter" may be passed which will force the clock to wait until the given number of ms between ticks. An "ownerObject" may also be passed if it is necessary to bind the function to an object.
  constructor(funcToCall, limiter = 0, ownerObject = null){
    this.funcToCall = funcToCall;
    this.limiter = limiter;
    this.ownerObject = ownerObject;
    this.lastCall = Date.now();
    this.animating = false;
  }
  startClock(){
    this.animating = true;
    this.animationLoop();
  }
  pauseClock(){
    this.animating = false;
  }
  animationLoop(){
    if(this.animating){
      if(Date.now() - this.lastCall >= this.limiter){
        this.funcToCall(this.ownerObject);
        this.lastCall = Date.now();
      }
      window.requestAnimationFrame(this.animationLoop.bind(this));
    }
  }
}

class TextBall {
  //Contains both the HTML and all properties of a bouncy ball, and methods to update its position and destory it. All defaults can be overriden by passing a settings object.
  constructor({Xpos = 20, Ypos = 20, Xvel = 0, Yvel = 0, rot = 0, rotVel = 0, cssDiameter = "15%", text = "Josh<br>Hugo"} = ball, zIndex = 0){
    this.Xpos = Xpos;
    this.Ypos = Ypos;
    this.Xvel = Xvel;
    this.Yvel = Yvel;
    this.rot = rot;
    this.rotVel = rotVel;
    this.cssDiameter = cssDiameter;
    this.text = text;
    this.ballHTML = this.buildBallHTML(zIndex);
    this.Yrest = false;
    this.Xrest = false;
  }
  buildBallHTML(zIndex){
    var ballHTML = document.createElement("div");
    ballHTML.className = "ball-outer";
    ballHTML.style.left = this.Xpos + "px";
    ballHTML.style.top = this.Ypos + "px";
    ballHTML.style.width = this.cssDiameter;
    ballHTML.style.zIndex = zIndex + 10;
    var elem = document.createElement("div");
    elem.className = "ball-shading ball-interrior";
    ballHTML.appendChild(elem);
    elem = document.createElement("div");
    elem.className = "ball-inner ball-interrior";
    let elem2 = document.createElement("p");
    elem2.innerHTML = this.text;
    elem.appendChild(elem2);
    ballHTML.appendChild(elem);
    elem = document.createElement("div");
    elem.className = "ball-background ball-interrior";
    ballHTML.appendChild(elem);
    return ballHTML;
  }
  updatePosition(gravity){
    if(!this.Yrest){
      this.Yvel += gravity;
      this.Ypos += this.Yvel;
      this.ballHTML.style.top = this.Ypos + "px";
    }
    if(!this.Xrest){
      this.Xpos += this.Xvel;
      this.ballHTML.style.left = this.Xpos + "px";
    }
    this.rot += this.rotVel;
    this.ballHTML.getElementsByClassName("ball-inner")[0].style.transform = "rotate(" + this.rot + "deg)";
  }
  updatePXsize(){
    this.pxDiameter = this.ballHTML.offsetWidth;
    this.ballHTML.style.height = this.pxDiameter + "px";
  }
  selfDestruct(){
    this.ballHTML.parentNode.removeChild(this.ballHTML);
  }
}
