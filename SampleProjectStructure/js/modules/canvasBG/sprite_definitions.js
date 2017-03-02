//Base Sprite class
var spriteObject2D = function(properties){
	this.properties = {
		layer: 'foreground',
		cacheSprite : false,
		color: 'black',
		offsetX: 0,
		offsetY: 0,
		width: 0,
		height: 0,
		scale: 1,
		speed: 1,
		shape: 'base',
		opacity: 1,
		momentumX: 0,
		momentumY: 0,
		spinmomentum : 0,
		rotation: 0
	};
	
	//capture custome defined properties
	if(typeof properties == 'object'){
		Object.keys(properties).forEach(function(key){
			this.properties[key] = properties[key];
		}.bind(this));
	}
	
	//cache the drawn sprite
	if(this.properties.cacheSprite) this.cachedImage = this.cacheImageData();
	
};
spriteObject2D.prototype = {
	
	cacheImageData : function(){
		
		return (function(){
			
			//create new canvas
			var tempcanvas = document.createElement('canvas');
				tempcanvas.width = this.properties.width;
				tempcanvas.height= this.properties.height;
			
			var context = tempcanvas.getContext('2d');
			
			//get the imageData
			this.drawSprite(context, 0,0);

			//return canvas to use to draw cached image directly to canvas. 
			return tempcanvas;
						
		}.bind(this)());
		
	},
	
	drawSprite : function(){ this.drawBoundingRect(); },
	
	//gets bounding rect values for a sprite after accounting for rotation (todo: include other transform properties as well)
	getBoundingRect : function(){
		
		var x = this.properties.width,
		    y = this.properties.height,
		    scaleX = 1,
		    scaleY = 1,
		    rad = this.properties.rotation*Math.PI/180,
		    a,b,c,d;
		    
		a = Math.abs(y * Math.sin(rad));
		b = Math.abs(x * Math.cos(rad));
		c = Math.abs(x * Math.sin(rad));
		d = Math.abs(y * Math.cos(rad));
		
		this.properties.boxWidth = (a+b) * scaleX;
		this.properties.boxHeight = (c+d) * scaleY;
		
	},
	
	//draws bounding rect around image
	drawBoundingRect : function(oX,oY){
		var cX = oX + this.properties.width/2,
		    cY = oY + this.properties.height/2,
		    dX = cX - this.properties.boxWidth/2,
		    dY = cY - this.properties.boxHeight/2;
		    
		canvas.context.strokeStyle = 'rgba(255,0,0,.25)';
		canvas.context.lineWidth = 1;
		canvas.context.fillStyle = 'transparent';
		canvas.context.strokeRect(dX,dY,this.properties.boxWidth, this.properties.boxHeight);
	},
	
	//draws rect of original object boundaries without transformation applied
	drawOriginalRect : function(oX,oY){
		var cX = oX + this.properties.width/2,
		    cY = oY + this.properties.height/2,
		    dX = cX - this.properties.width/2,
		    dY = cY - this.properties.height/2;
		    
		canvas.context.strokeStyle = 'rgba(0,0,0,.4)';
		canvas.context.fillStyle = 'transparent';
		canvas.context.strokeRect(dX,dY,this.properties.width, this.properties.height);
	},
	
	render : function(oX, oY){
			
		//draw routine
		canvas.context.save();
		
		
		(function transform(){
			var cX = this.properties.width/2,
			    cY = this.properties.height/2;
			    
			canvas.context.globalAlpha = this.properties.opacity;
			canvas.context.translate(oX+cX, oY+cY);
			if(this.properties.rotation) canvas.context.rotate(this.properties.rotation*Math.PI / 180);
			//if(this.properties.scale) canvas.context.scale(this.properties.scale.x,this.properties.scale.y);
		
		}.bind(this)());
		
		if(this.cachedImage) canvas.context.drawImage(this.cachedImage,this.properties.width/-2,this.properties.height/-2);				
		else this.drawSprite(canvas.context,this.properties.width/-2,this.properties.height/-2);

		canvas.context.restore();
		
		//draw bounding rect
		this.getBoundingRect();
		//this.drawBoundingRect(oX,oY);
		//this.drawOriginalRect(oX,oY);
		
	}
}







//custom shape objects
//inherit from spriteObject2D
var Rectangle = function(properties){
	
	//inherit base class
	spriteObject2D.call(this, properties);

}
Rectangle.prototype = Object.create( spriteObject2D.prototype, {
	
	drawSprite : {value: drawRect},
	
	type : {value : 'Rectangle Object'}
});
	
	
	//cached draw function for rectangle
	function drawRect(context,oX,oY){
			context.fillStyle = this.properties.color || 'black';
			context.fillRect(oX, oY, this.properties.width, this.properties.height);
	}





//Circle sprite class
//inherit from spriteObject2D
var Circle = function(properties){
	
	//inherit base calss
	spriteObject2D.call(this,properties);
	
	//set circle specific properties based on object dimensions
	this.properties.radius = this.properties.width/2;
	this.properties.startAngle = 0;
	this.properties.endAngle = Math.PI*2;
	this.cachedImage = null;
	
	//forces round circles - needed not to break wrapping for now
	this.properties.height = this.properties.width;
	
}
Circle.prototype = Object.create( spriteObject2D.prototype, {
	
	drawSprite : {value : drawCircle},
	
	type : {value : 'Circle Object'}
});


	//cached draw function for Circle
	function drawCircle(context, oX, oY){
			
		//center values for the circle for reference
		var cX = oX + (this.properties.width/2),
		    cY = oY + (this.properties.height/2);
		    
		//circle shape draw routine
		canvas.context.beginPath();
		canvas.context.fillStyle = this.properties.color || 'black';
		canvas.context.arc(cX, cY, this.properties.radius, this.properties.startAngle, this.properties.endAngle, false);
		canvas.context.fill();
	}






//Star sprite class
//inherit from spriteObject2D
var Star = function(properties){
	
	spriteObject2D.call(this,properties);
	
	this.properties.height = this.properties.width;
	
}
Star.prototype = Object.create( spriteObject2D.prototype, {
	
	drawSprite : {value : drawStar},
	
	type : {value : 'Circle Object'}
});

	//cached draw function for star
	function drawStar(context,oX,oY){
			
		//path reference point values
		var cX = oX + (this.properties.width/2),
		    cY = oY + (this.properties.height/2),
		    p1 = {
				x : cX,
				y : oY
		    },
		    p2 = {
				x : cX + (this.properties.width/3),
				y : oY + this.properties.height
		    },
		    p3 = {
				x : oX,
				y : cY - (this.properties.height/8)
		    },
		    p4 = {
				x : oX + this.properties.width,
				y : cY - (this.properties.height/8)
		    },
		    p5 = {
				x : cX - (this.properties.width/3),
				y : oY + this.properties.height
		    };
	
		//canvas draw routine
		context.beginPath();
		context.fillStyle = this.properties.color || 'black';
		context.moveTo(p1.x, p1.y);
		context.lineTo(p2.x, p2.y);
		context.lineTo(p3.x, p3.y);
		context.lineTo(p4.x, p4.y);
		context.lineTo(p5.x, p5.y);
		context.fill();
	}
