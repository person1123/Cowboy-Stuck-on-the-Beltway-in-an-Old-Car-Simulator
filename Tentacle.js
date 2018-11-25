
function Tentacle(h, baseX, baseY, c, m, px, py, t) {
  this.noiseStrength = 20;
  this.noiseScale = 5;
  this.noiseSpeed = 0.001;
  this.baseX = baseX;
  this.baseY = baseY;
  this.headX = baseX;
  this.headY = baseY - h;
  this.startHX = this.headX;
  this.startHY = this.headY;
  this.hei = h;
  this.col = c;
  this.up = false;
  this.down = false;
  this.left = false;
  this.right = false;
  this.upTime = 0;
  this.leftTime = 0;
  this.rightTime = 0;
  this.downTime = 0;
  this.mult = m;
  this.pickupX = px;
  this.pickupY = py;
  this.team = t;
  this.isDropped = false;
  this.dropTime = 0;
  this.grabbedCheckers = [];
  this.width = SIZE / 10;

  this.collision = undefined;
  
  this.pressUp = function() {
    this.up = true;
    this.upTime = millis();
  }
  
  this.releaseUp = function() {
    this.up = false;
  }
  
  this.pressDown = function() {
    this.down = true;
    this.downTime = millis();
  }
  
  this.releaseDown = function() {
    this.down = false;
  }
  
  this.pressLeft = function() {
    this.left = true;
    this.leftTime = millis();
  }
  
  this.releaseLeft = function() {
    this.left = false;
  }
  
  this.pressRight = function() {
    this.right = true;
    this.rightTime = millis();
  }
  
  this.releaseRight = function() {
    this.right = false;
  }
  
  this.pressDrop = function() {
    this.isDropped = true;
    this.dropTime = millis();
    
    if (this.grabbedCheckers.length == 0) {
      var c = null;
      if (this.distance(this.pickupX, this.pickupY) < 120 + 150) {
        c = spawnChecker(this.team);
        c.grab(this);
      }
      
      for (var i = 0; i < checkers.length; i++) {
        if (checkers[i] == c || this.distance(checkers[i].x, checkers[i].y) < 120 + checkers[i].r) {
          checkers[i].grab(this);
          this.grabbedCheckers.push(checkers[i]);
        }
      }
      
    } else {
      for (var i = 0; i < this.grabbedCheckers.length; i++) {
        this.grabbedCheckers[i].drop();
      }
      this.grabbedCheckers = [];
    }
  }
  
  this.releaseDrop = function() {
    this.isDropped = false;
    
    for (var i = 0; i < this.grabbedCheckers.length; i++) {
      this.grabbedCheckers[i].pickUp();
    }
  }
  
  this.midpoint = function() {
    return createVector(this.baseX, this.baseY - this.hei / 2);
  }
  
  this.distance = function(x, y) {
    return distanceToBezierCurve(createVector(x, y),
      createVector(this.baseX, this.baseY),
      this.midpoint(),
      createVector(this.headX, this.headY));
  }
  
  this.force = function(x, y) {
    var str = distanceToBezierCurve(createVector(x, y), 
      createVector(this.baseX, this.baseY), 
      this.midpoint(),
      createVector(this.headX, this.headY));
    
    var colStr = 1;
    
    var dx = -(str - distanceToBezierCurve(createVector(x - 1, y), 
      createVector(this.baseX, this.baseY), 
      this.midpoint(),
      createVector(this.headX, this.headY)));
    var dy = -(str - distanceToBezierCurve(createVector(x, y - 1), 
      createVector(this.baseX, this.baseY), 
      this.midpoint(),
      createVector(this.headX, this.headY)));
    
    var mag = sqrt(dx * dx + dy * dy);
    
    var res = createVector(0, 0);
    if ( mag > 0) {
      dx /= mag;
      dy /= mag;
      
      res.x = -dx * max(200 - str, 0) * colStr;
      res.y = -dy * max(200 - str, 0) * colStr; 
    }
    return res.mult(this.mult);
  }
  
  this.dropped = function() {
    return (millis() - this.dropTime > 250) && this.isDropped;
  }
  
  this.pushStrength = 100;
  
  this.update = function() {
    var sc = 10;
    var tsc = .01;
    this.headX += (this.right ? this.pushStrength * (1 + sc / (1 + (millis() - this.rightTime) * tsc)) : 0) - (this.left ? this.pushStrength * (1 + sc / (1 + (millis() - this.leftTime) * tsc)) : 0);
    this.headY += (this.down ? this.pushStrength * (1 + sc / (1 + (millis() - this.downTime) * tsc)) : 0) - (this.up ? this.pushStrength * (1 + sc / (1 + (millis() - this.upTime) * tsc)) : 0);
    
    this.headX = (this.headX + this.startHX) / 2;
    this.headY = (this.headY + this.startHY) / 2;
    
    if (this.collision != null && this.collision.isDropped == this.isDropped) {
      var f = this.collision.force(this.headX, this.headY);
      this.headX += f.x;
      this.headY += f.y;
    }
  }
  
  logged = false;
  this.doDraw = function() {
    var white = color(255, 255, 255, 255);
    
    var prevPt = pointOnBezierCurve(0, createVector(this.baseX, this.baseY),
      this.midpoint(), createVector(this.headX, this.headY));
    var prevPerp = perpendicularAtPointOnBezierCurve(0,
      createVector(this.baseX, this.baseY),
      this.midpoint(), createVector(this.headX, this.headY)).mult(this.width);
    
    var sections = 30;
    
    var m = millis();
    
    pts = [];
    
    var p1 = prevPt.copy().add(prevPerp);
    var p2 = prevPt.copy().sub(prevPerp);
    pts.push([p1.x, p1.y]);
    pts.push([p2.x, p2.y]);
    
    for (var t = 1 / sections; t <= 1.001; t+= 1 / sections) {
      var pt = pointOnBezierCurve(t, createVector(this.baseX, this.baseY),
        this.midpoint(), createVector(this.headX, this.headY));
      var perp = perpendicularAtPointOnBezierCurve(t,
        createVector(this.baseX, this.baseY),
        this.midpoint(), createVector(this.headX, this.headY))
        .mult(this.width * (1 - t / 2) + this.noiseStrength * noise(t * this.noiseScale,  m * this.noiseSpeed));
      
      if (prevPerp.dot(perp) < 0) {
        perp.mult(-1);
      }
      
      var p1 = pt.copy().add(perp);
      var p2 = pt.copy().sub(perp);
      
      pts.push([p1.x, p1.y]);
      pts.push([p2.x, p2.y]);
      
      prevPt = pt;
      prevPerp = perp;
    }
    
    var fPt = pointOnBezierCurve(1,
      createVector(this.baseX, this.baseY), 
      this.midpoint(), createVector(this.headX, this.headY));
    var fPerp = perpendicularAtPointOnBezierCurve(1,
      createVector(this.baseX, this.baseY),
      this.midpoint(), createVector(this.headX, this.headY));
    var fPar = parallelAtPointOnBezierCurve(1,
      createVector(this.baseX, this.baseY),
      this.midpoint(), createVector(this.headX, this.headY));
    
    prevPt = fPt.copy();
    prevPerp = fPerp.copy().mult(this.width / 2 + this.noiseStrength * noise(this.noiseScale,  m * this.noiseSpeed));
    
    for (var i = 0; i <= sections / 3.0 + 1; i++) {
      var x = i * 3.0 / sections;
      var pt = fPar.copy().mult(x * this.width / 2).add(fPt);
      var perp = fPerp.copy().mult(sqrt(max(0, 1 - x * x))
        * (this.width / 2 + this.noiseStrength * noise((1 + i / 50) * this.noiseScale,  m * this.noiseSpeed)));
      
      var p1 = pt.copy().add(perp);
      var p2 = pt.copy().sub(perp);
      
      pts.push([p1.x, p1.y]);
      pts.push([p2.x, p2.y]);
      
      prevPt = pt;
      prevPerp = perp;
    }
    
    drawingContext.beginPath();
    var i;
    for (i = 0; i + 1 < pts.length; i += 2) {
      if (i + 3 < pts.length) {
        drawingContext.moveTo(pts[i+2][0], pts[i+2][1]);
        drawingContext.lineTo(pts[i  ][0], pts[i  ][1]);
        drawingContext.lineTo(pts[i+1][0], pts[i+1][1]);
        drawingContext.lineTo(pts[i+3][0], pts[i+3][1]);
      } else {
        drawingContext.moveTo(pts[i  ][0], pts[i  ][1]);
        drawingContext.lineTo(pts[i+1][0], pts[i+1][1]);
      }
    }
    drawingContext.closePath();
    drawingContext.fill();
  }
  
  this.drawShadow = function() {
    //fill(50, 50, 50, 230);
    drawingContext.fillStyle = 'rgba(50, 50, 50, ' + (230.0 / 255) + ')';
    //stroke(50, 50, 50, 230);
    noStroke();
    strokeWeight(3);
    this.doDraw();
    //image(this.solid, 0, 0);
  }
  
  this.draw = function() {
    var dist = this.isDropped ? 10 : 50;
    //fill(red(this.col), green(this.col), blue(this.col), 200);
    drawingContext.fillStyle = 'rgba(' + red(this.col) + ', ' + green(this.col) +
      ', ' + blue(this.col) + ', ' + (200.0 / 255) + ')';
    //stroke(red(this.col), green(this.col), blue(this.col), 200);
    noStroke();
    strokeWeight(1);
    //tint(255, 127);
    translate(-dist * 2, dist);
    this.doDraw();
    translate(dist * 2, -dist);
    
    /*if (dropped) {
      for (int i = 0; i < numCheckers; i++) {
        
        float t = closestParameterValue(createVector(checkers[i].x, checkers[i].y),
            createVector(baseX, baseY), 
            midpoint(),
            createVector(headX, headY));
        
        if (t < 0)
          stroke(0, 255, 0);
        else
          stroke(255, 0, 0);
        
        PVector pt = pointOnBezierCurve(t ,
          createVector(baseX, baseY), 
          midpoint(),
          createVector(headX, headY));
        strokeWeight(10);
        
        line(pt.x, pt.y, checkers[i].x, checkers[i].y);
      }
    }*/
  }
}