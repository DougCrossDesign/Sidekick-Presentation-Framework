//any page content specific script can go here
function createCanvasShapesDemo(){
	
	//create new LayeredCanvas instance
	canvas = new LayeredCanvas('parallax-canvas', {width: 1024, height: 665, startlayers:3});
	rAFobj = new AnimationCycle();
	PresentationCarousel.prototype.bgcanvas = canvas;
	PresentationCarousel.prototype.animcycle = rAFobj;
	
	
	//create objects for each layer to draw
	for(var i=0; i<50; i++){
		
		var propertiesarray = [
			{
				shape : 'Rectangle',
				cacheSprite : false,
				width: (Math.round(Math.random()*1000) % 80/2) + 20,
				height: (Math.round(Math.random()*1000) % 80/2) + 20,
				color: 'rgb(135,155,211)',
				offsetX: (Math.round(Math.random()*canvas.properties.width) % canvas.properties.width),
				offsetY: (Math.round(Math.random()*canvas.properties.height) % canvas.properties.height),
				momentumX: Math.random()/2,
				momentumY: Math.random()/2,
				spinmomentum : Math.random()/4
			},
			{
				shape : 'Circle',
				cacheSprite : false,
				width: (Math.round(Math.random()*1000) % 60/2) + 20,
				height: (Math.round(Math.random()*1000) % 60/2) + 20,
				color: 'rgb(155,200,18)',
				offsetX: (Math.round(Math.random()*canvas.properties.width) % canvas.properties.width),
				offsetY: (Math.round(Math.random()*canvas.properties.height) % canvas.properties.height),
				momentumX: Math.random()/2 * generateEvenOdd(),
				momentumY: Math.random()/2 * generateEvenOdd()
			},
			{
				shape : 'Star',
				cacheSprite : false,
				width: (Math.round(Math.random()*1000) % 100/2) + 20,
				height: (Math.round(Math.random()*1000) % 100/2) + 20,
				color: 'rgb(221,171,142)',
				offsetX: (Math.round(Math.random()*canvas.properties.width) % canvas.properties.width),
				offsetY: (Math.round(Math.random()*canvas.properties.height) % canvas.properties.height),
				momentumX: Math.random()/-2,
				momentumY: Math.random()/-2,
				spinmomentum : Math.random()/-8
			}
		];
		
		
		canvas.layers.forEach(function(layer,index){
			var newsprite = new window[propertiesarray[index].shape](propertiesarray[index]);
			    newsprite.properties.opacity = .7/(index+1);
			layer.objects.push(newsprite);
		});
		
	}
	
	
	//define a draw routine for each layer (currently just one function but could be a chain of functions)
	canvas.layers.forEach(function(layer,index){
		layer.drawRoutine = drawSpriteObjects.bind(layer);
	});
	
	
	//'this' refers to layer
	function drawSpriteObjects(){
		this.objects.forEach(function(sprite){
			drawSpriteWrapped.call(this,sprite,this.index);
		}.bind(this));
	}
	function generateEvenOdd(){
		var rand = Math.random();
		return (rand-.5)/Math.abs(rand-.5);
	}
	
	//start canvas render
	canvas.render();
	

}







function createLiveWallpaperDemo(){
	
	//create new LayeredCanvas instance
	canvas = new LayeredCanvas('parallax-canvas', {width: 1024, height: 665, startlayers:2});
	rAFobj = new AnimationCycle();
	PresentationCarousel.prototype.bgcanvas = canvas;
	PresentationCarousel.prototype.animcycle = rAFobj;
					
	(function renderBackground(){
		var baseRGB = {
			r : 38,
			g : 65,
			b: 100
		},
		    duration = 3000,
		    variance = .25;
		
		
		function callback(cycleObj){
			var dirmod = (Math.floor(cycleObj.lapsedtime/duration)%2 == 1) ? 1 : -1; 
			var oscillator = (dirmod > 0) ? cycleObj.lapsedtime % duration : duration - (cycleObj.lapsedtime % duration);
			var t = EasingFunctions.easeInOutCubic(oscillator/duration);
			
			var r = Math.round(baseRGB.r + (t*baseRGB.r*variance)),
			    g = Math.round(baseRGB.g + (t*baseRGB.g*variance*2)),
			    b = Math.round(baseRGB.b + (t*baseRGB.b*variance));
			    
			canvas.context.fillStyle = 'rgb('+r+','+g+','+b+')';
			canvas.context.fillRect(0,0,canvas.properties.width,canvas.properties.height);
		}
		
		rAFobj.addCycle('pulseBG', callback.bind(this));
	}());
}







//canvas draw functions - should be methods that do not require reference to canvas level objects - pass those values by reference if required
//'this' var should reference a layer object
function drawSpriteWrapped(sprite,index,wrap){
	
	//individual rect property shorthand to make fill math more readable
	var layer = this,
	    oX = sprite.properties.offsetX,
	    oY = sprite.properties.offsetY,
	    mX = sprite.properties.momentumX || 0,
	    mY = sprite.properties.momentumY || 0,
	    rW = sprite.properties.width,
	    rH = sprite.properties.height,
	    boxW = sprite.properties.boxWidth,
	    boxH = sprite.properties.boxHeight;
	 
	//calculation vars   
	var deltaX = oX + layer.offsetX + layer.scrollX,
	    deltaY = oY + layer.offsetY + layer.scrollY,
	    speedX = mX/(index+1),
	    speedY = mY/(index+1),
	    originX = (deltaX >= 0) ? deltaX % canvas.properties.width : ( (Math.abs(deltaX)%canvas.properties.width) * (deltaX/Math.abs(deltaX)) )+canvas.properties.width,
	    originY = (deltaY >= 0) ? deltaY % canvas.properties.height : ( (Math.abs(deltaY)%canvas.properties.height) * (deltaY/Math.abs(deltaY)) )+canvas.properties.height;	    //console.log(originX+' : '+originY);
	   
	    
	//set sprite properties
	sprite.properties.offsetX += speedX;
	sprite.properties.offsetY += speedY;
	sprite.properties.rotation += sprite.properties.spinmomentum;
	
	
	//draw sprite
	sprite.render(originX,originY);
	
	
	//wrap sprite forward
	if( originX + boxW >= canvas.properties.width  || originX + rW >= canvas.properties.width)  	sprite.render(originX-canvas.properties.width, originY); 
	if( originY + boxH >= canvas.properties.height || originY + rH >= canvas.properties.height)  	sprite.render(originX, originY-canvas.properties.height); 
	if((originX + boxW >= canvas.properties.width  || originX + rW >= canvas.properties.width) &&
	   (originY + boxH >= canvas.properties.height || originY + rH >= canvas.properties.height))	sprite.render(originX-canvas.properties.width, originY-canvas.properties.height);
	
	
	//wrap sprite backward
	if( originX - boxW <= canvas.properties.width  || originX - boxW <= 0)  			sprite.render(originX+canvas.properties.width, originY);
        if( originY - boxH <= canvas.properties.height || originY - boxH <= 0)  			sprite.render(originX, originY+canvas.properties.height);
	if((originX - boxW <= canvas.properties.width  || originX - boxW <= 0) &&
	   (originY - boxH <= canvas.properties.height || originY - boxH <= 0)) {			sprite.render(originX+canvas.properties.width, originY-canvas.properties.height);
													sprite.render(originX-canvas.properties.width, originY+canvas.properties.height);
	}
}
