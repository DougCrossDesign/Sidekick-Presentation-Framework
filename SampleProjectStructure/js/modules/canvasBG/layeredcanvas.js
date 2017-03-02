var LayeredCanvas = function(el, properties){
	
	//element level reference
	this.el = (typeof el == 'object') ? el : document.getElementById(el) || null;
	
	//canvas level properties
	this.properties = {
		contextType : '2d',
		height: 768,
		width: 1024,
		translateX: 0,
		translateY: 0,
		scrollX: 0,
		scrollY: 0,
		viewbufferX: 0,
		viewbufferY: 0,
		startlayers: 1
	};
	
	//set custom properties passed as argument
	if(typeof properties == 'object'){
		Object.keys(properties).forEach(function(key){
			this.properties[key] = properties[key];	
		}.bind(this));
	}
	
	//touch coords object
	this.touches = new TouchCoords(),
	
	
	//Layer object definition
	//canvas layer array and layer level properties
	this.layers = [];
	
	
	//add canvas layer objects
	for(var i=0; i<this.properties.startlayers; i++){
		this.layers.push(new CanvasLayer('layer'+i));
		this.layers[i].index = i;
		this.layers[i].parent = this;
	}
	
	//set canvas context
	this.context = (this.el) ? this.el.getContext(this.properties.contextType) : null;
	
	
	//bind mouse events to canvas element for drag scrolling and other features
	(function bindEvents(){

		//touch event binding to allow dragging/positioning of elements being drawn onto canvas
		var touchdeltaX = 0,
		    touchdeltaY = 0,
		    touches = this.touches,
		    canvas = this;
		function startTouch(e){
			if(!touches.istouched){
				touches.capture(e);
				touchdeltaX = canvas.properties.translateX;
				touchdeltaY = canvas.properties.translateY;
				touches.istouched = true;
			}
		}
		function dragTouch(e){
			if(touches.istouched){
				touches.capture(e);
				canvas.properties.translateX = touchdeltaX + touches.dragX*-1;
				canvas.properties.translateY = touchdeltaY + touches.dragY*-1;
				touches.isdragged = true;
			}
		}
		function endTouch(){
			if(touches.istouched){
				touches.reset();
			}
		}
		
		
		//event bindings
		canvas.el.addEventListener('mousedown', function(e){startTouch.call(this,e)}, false);
		canvas.el.addEventListener('mousemove', function(e){dragTouch.call(this,e)}, false);
		canvas.el.addEventListener('mouseup', endTouch, false);
		canvas.el.addEventListener('mouseout', endTouch, false);
		canvas.el.addEventListener('touchstart', function(e){startTouch.call(this,e)}, false);
		canvas.el.addEventListener('touchmove', function(e){dragTouch.call(this,e)}, false);
		canvas.el.addEventListener('touchend', endTouch, false);
		
	}.bind(this)());
	
	
};
LayeredCanvas.prototype = {
	
	//main render function
	render : function(){
		
		//set up namespace variables
		var canvas = this,
		    cycle = rAFobj,
		    canvaswidth = canvas.properties.width,
		    canvasheight = canvas.properties.height,
		    thisframetime = 0, lastframetime = 0;
		
		
		//start the requestAnimationFrame/setInterval loop using callback renderLoop
		cycle.addCycle('canvasDrawLoop',renderLoop.bind(this));
		
		
		//main canvas rendering logic for each redraw loop
		function renderLoop(){
			    
			//clear previous canvas contents
			this.context.clearRect(0,0,canvaswidth,canvasheight);
					
			//save canvas state
			this.context.save();
			
			//go through layer draw routine and execute draw methods
			for(var i=this.layers.length-1; i>=0; i--){
				this.layers[i].calculateOffset();
				this.layers[i].drawRoutine();
			}
			
			//render FPS
			renderFPS.call(this);
			
			//restore context state
			this.context.restore();
				
		}
		
		//render fps of draw loop in top left corner
		function renderFPS(){
			this.context.fillStyle = '#000';
			this.context.font = '16pt sans-serif';
			this.context.fillText('fps: '+cycle.fps, 20,20);
		}

	},
	
	scrollTo : function(x,y,duration,easetype,staysmooth){
		
		//scroll variables
		var cycle = rAFobj,
		    sX = this.properties.scrollX,
		    sY = this.properties.scrollY;
		var distancemod = (cycle.fps)/120;
		
		//default duration time if not set
		if(staysmooth){
			x *= distancemod/1.5;
			y *= distancemod/1.5;
			duration = duration/distancemod || 1000;
			easetype = easetype || 'easeInOutCubic';
		}
		
		//method to add to the draw stack
		function callback(cycleObj){
			
			//closure call back immediately
			return (function(){
						
				//scroll variables
				var lapsedtime = cycleObj.lapsedtime || Number(0),
				    t = EasingFunctions[easetype](lapsedtime/duration);
				
				//assign layer scroll properties at time t		    
				this.properties.scrollX = sX + (x*t); 
				this.properties.scrollY = sY + (y*t);
				
			}.bind(this)());
		}
		
		//add cycle to callback stack
		cycle.addCycle('scrollCanvas', callback.bind(this), duration);
	},
	
	type : 'LayeredCanvas object'
}







//CanvasLayer object
//holds information and properties associated with a canvas layer
var CanvasLayer = function(name){
		this.id = name,
		this.offsetX = 0,
		this.offsetY = 0,
		this.scrollX = 0,
		this.scrollY = 0,
		this.objects = [],
		this.wrapX = true,
		this.wrapY = true
};
CanvasLayer.prototype = {
	
	calculateOffset : function(){
		this.offsetX = canvas.properties.translateX/(this.index+1);
		this.offsetY = canvas.properties.translateY/(this.index+1);
		this.scrollX = canvas.properties.scrollX/(this.index+1);
		this.scrollY = canvas.properties.scrollY/(this.index+1);
	},
	
	scrollTo : function(x,y,duration,easetype){
			
		//default duration time if not set
		duration = duration || 1000;
		
		//scroll variables
		var cycle = rAFobj,
		    sX = this.scrollX,
		    sY = this.scrollY,
		    easetype = easetype || 'easeInOutCubic';
		
		//define callback to execute with loop
		function callback(cycleObj){
			
			//closure call back immediately
			return (function(){
				
				var lapsedtime = cycleObj.lapsedtime || Number(0),
				    t = EasingFunctions[easetype](lapsedtime/duration).toFixed(4);
				    
				this.scrollX = sX + (x*t);
				this.scrollY = sY + (y*t);
				
			}.bind(this)());
		}
		
		//execute scrollTo loop
		cycle.addCycle('layerScroll'+this.index, callback.bind(this), duration);
			
	},
	
	type : 'CanvasLayer Object'
};


	
	
	
	
	

//create a rAF function to generalize the looping process
//keeps a queue stack of functions to fire during each loop
//duration is optional - should be defined in milliseconds.
//no duration cycles perpetually
var AnimationCycle = function(){
	
	//private variables
	var RAF = window.requestAnimationFrame ||
		  window.mozRequestAnimationFrame ||
		  window.webkitRequestAnimationFrame ||
		  window.msRequestAnimationFrame ||
		  null,
	    timeout,
	    lastframetime = 0,
	    thisframetime = 0;
	    
	
	//keep this as an accessible property
	this.callbackQueue = {};
	this.fps = 0;
	    
	
	//playback loop with backup interval support
	this.loop = function(){
		
		return (function(){
			
			if(timeout !== true){
				
				//loop vars
				var now = new Date();
				thisframetime = now.getTime();
				this.fps = (1000/(thisframetime - lastframetime)).toFixed(0);
				
				//execute callback to requestAnimationFrame
				function RAFcallback(){
					
					
					if(this.fps <= 60){
						
						//iterate through the callback queue to manage each cycle's status
						Object.keys(this.callbackQueue).forEach(function(key){
							
							//calculate lapsed time
							var now = new Date();
							    item = this.callbackQueue[key];
							    item.lapsedtime = now.getTime() - item.starttime;
							
							   
						
							//test to see if the cycle in the queue has expired
							if(item.duration && item.lapsedtime > item.duration){
								delete this.callbackQueue[key];
								console.log(item + 'cycle ended with duration : ' + item.lapsedtime);
							}
							
							//otherwise execute this task's callback
							else if(typeof this.callbackQueue[key].method == 'function') this.callbackQueue[key].method.call(this,this.callbackQueue[key],key);
							
						}.bind(this));
						
						//update last frame timing
						lastframetime = thisframetime;
					}
						
					this.loop();
				}
				
				//branch based on requestAnimationFrame support
				if(RAF) RAF(RAFcallback.bind(this));
				else{
					console.log('using setInterval timing');
					if(!timeout) timeout = setInterval(RAFcallback.bind(this),5);
				}
			}
			else{
				if(!RAF) clearInterval(timeout);
				timeout = null;
			}
			
		}.bind(this)());
		
	}.bind(this);
	this.loop();		//immediate execution throws exception because of scope issues of either 'this' or the function. so execute after declaration instead
	
	
	//stop the loop
	this.endLoop = function(){
		if(!RAF) clearInterval(timeout);
		timeout = true;
		console.log('loop duration : ' + this.lapsedtime/1000 + ' seconds');
	}
	
}
AnimationCycle.prototype = {
	
	//adds a callback method to the queue to fire during cycle loop
	addCycle : function(cyclename, callback, duration){
		
		var cyclestarttime = new Date();
		
		//add callback to loop queue
		this.callbackQueue[cyclename] = {method: callback, starttime: cyclestarttime.getTime(), duration: duration || null};
		
		console.log(cyclename + ' logged in cycle queue');
		
	},
	
	//removes a callback method from the queue
	clearCycle : function(cyclename){
		
		Object.keys(this.callbackQueue).forEach(function(key){
			if(cyclename == key) delete this.callbackQueue[key];
		}.bind(this));
		
	},
	
	//removes all callback methods from queue
	clearAllCycles : function(){
		this.callbackQueue = {};
	},
	
	type : 'requestAnimationFrame custom Object'
}








//source: https://gist.github.com/gre/1650294
//returns a 0-1 coefficient to multiply by total distance to be traveled at time t
EasingFunctions = {
	// no easing, no acceleration
	linear: function (t) { return t },
	// accelerating from zero velocity
	easeInQuad: function (t) { return t*t },
	// decelerating to zero velocity
	easeOutQuad: function (t) { return t*(2-t) },
	// acceleration until halfway, then deceleration
	easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	// accelerating from zero velocity
	easeInCubic: function (t) { return t*t*t },
	// decelerating to zero velocity
	easeOutCubic: function (t) { return (--t)*t*t+1 },
	// acceleration until halfway, then deceleration
	easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	// accelerating from zero velocity
	easeInQuart: function (t) { return t*t*t*t },
	// decelerating to zero velocity
	easeOutQuart: function (t) { return 1-(--t)*t*t*t },
	// acceleration until halfway, then deceleration
	easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	// accelerating from zero velocity
	easeInQuint: function (t) { return t*t*t*t*t },
	// decelerating to zero velocity
	easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
	// acceleration until halfway, then deceleration
	easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
}

