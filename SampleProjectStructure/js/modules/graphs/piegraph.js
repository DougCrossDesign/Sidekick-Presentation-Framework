/*
 *
 *	PIEGRAPH.JS - Pie Chart Renderer
 *    	Author: Stephen Seator
 *    	Date: 	Sept 2014
 *    	----------------------------------
 *    	
 *	Simple animated pie graph generation script utilizing HTML5 canvas and requestAnimationFrame
 *	Define custom properties and a dynamic number of wedges to render within a structured javascript object or JSON file
 *	Currently renders flat, 2d pie graphs
 *
 *	
 */


//gloabl flags to stop/erase canvas figure on slide change
var flag_stopPieGraphRender,
    flag_clearPieGraph;
    
//requestAnimationFrame 
//define our requestAnimationFrame object
var RAF = RAF ||
	  window.requestAnimationFrame ||
	  window.webkitRequestAnimationFrame ||
	  window.msRequestAnimationFrame ||
	  window.mozRequestAnimationFrame ||
	  null;
	    
	

//MAIN EXECUTING FUNCTION
//call this function to begin pie graph generation
//pie graph rendering is dependent on formatted js object data
//each graph is ab object within the array-type parameter 'chartdata'
//parameter 'canvas' is a reference to the HTML element of the canvas to draw on
//function expects BOTH PARAMETERS to have meaningful value in order to function
function generatePieGraph(canvas, chartobj, duration){
	
	if(canvas && canvas.tagName == 'CANVAS' && chartobj){
		
		
		//DEFINITIONS - local variables
		//canvas variables and timer definitions
		var context = canvas.getContext('2d'),
		    canvaswidth = canvas.getAttribute('width'),
		    canvasheight = canvas.getAttribute('height'),
		    stoploop = false,
		    starttime = new Date().getTime();
				    
		//define transition times to introduce chart, calculate 't' coefficient for each transition
		var transtime1 = 1000,
		    transtime2 = 500,
		    t1 = (duration <= transtime1) ? EasingFunctions.easeOutQuart(duration/transtime1) : 1,
		    t2 = 0,
		    t3 = 0;
		if(t1 == 1){
			t2 = (duration >= transtime1 && duration <= transtime1+transtime2) ? EasingFunctions.easeInCubic((duration-transtime1)/transtime2) : 1;
			t3 = (duration >= transtime1 && duration <= transtime1+transtime2) ? EasingFunctions.easeOutCubic((duration-transtime1)/transtime2) : 1;
		}
		    
		//determine general placement variables to draw pie chart
		var radius = (chartobj.properties.size/2),
		    growradius = radius*t1,
		    cX = (chartobj.properties.offsetX == 'center') ? canvaswidth/2 : Number(chartobj.properties.offsetX)+radius || 0,
		    cY = (chartobj.properties.offsetY == 'center') ? canvasheight/2 : Number(chartobj.properties.offsetY)+radius || 0,
		    totalvalue = 0;
		    
		   
		    
		//get total value count for the chart - execute immediately
		(function getTotalValue(){
			for(var i=0; i<chartobj.data.length; i++){
				totalvalue += parseFloat(chartobj.data[i].value);
			}
		}.call(this));
		    
		    
		    
		//draw a wedge based on pre-calculated and predefined properties
		if(t1) renderWedges();
		if(t2) renderWedgeLabels();
		
		
		
		//iterates through all data objects in chartobj to draw each pie wedge based on that data
		function renderWedges(){
				
			//reset total degree count
			var totaldegreesdrawn = 0;
			
			//loop through all wedges for rendering
			for(var i=0; i<chartobj.data.length; i++){
				
				//calculate wedge variables
				var degrees = chartobj.data[i].value/totalvalue * 360,
				    rads = degrees * (Math.PI/180),
				    sAngle = (chartobj.properties.startAngle*t1 + totaldegreesdrawn)  * (Math.PI/180),
				    eAngle = sAngle+rads*t1,
				    wedgeradius = growradius * chartobj.data[i].sizemod || growradius;
				
				//define initial context styling, create new path
				context.globalAlpha = t1;
				context.fillStyle = chartobj.data[i].fillColor;
				context.strokeStyle = chartobj.data[i].strokeColor || 'rgba(0,0,0,0)';
				context.lineWidth = chartobj.data[i].strokeWidth || 0;
				context.lineCap = chartobj.data[i].strokeCap || 'round';
				context.lineJoin = 'miter';
				
				//draw wedge
				context.save();
				context.beginPath();
				context.moveTo(cX,cY);
				context.arc(cX, cY, wedgeradius, sAngle, eAngle, false);
				context.lineTo(cX,cY);
				
				//render order as defined by chartobj property setting
				if(chartobj.properties.renderPriority == 'fill'){
					context.stroke();
					context.fill();
				}else{
					context.fill();
					context.stroke();
				}
				
				//restore context
				context.restore();
				
				//increment counter keeping track of total degrees drawn
				totaldegreesdrawn+=degrees;
				
			}
			
		}
		
		
		//iterates through all data objects in chartobj to draw each pie wedge's label based on that data
		//this has to go through a separate iteration in order to draw ontop of the wedge slices properly
		function renderWedgeLabels(){
			
			if(chartobj.properties.drawLabels){
				//reset total degree count
				var totaldegreesdrawn = 0;
				
				//loop through all wedge data to render label information
				for(var i=0; i<chartobj.data.length; i++){
					
					var data = chartobj.data[i];
					//calculate wedge variables
					var degrees = data.value/totalvalue * 360,
					    rads = degrees * (Math.PI/180),
					    sAngle = (chartobj.properties.startAngle*t1 + totaldegreesdrawn)  * (Math.PI/180),
					    eAngle = sAngle+rads*t1,
					    mAngle = eAngle - ((eAngle-sAngle)/2),
					    fontsize = chartobj.properties.fontSize || 16;
					    weightedfontscale = (chartobj.properties.labelScale == 'relative') ? ( fontsize * ((((data.value/totalvalue) ) + .75)) * t3).toFixed(1) : fontsize,
					    extendlabel = (chartobj.properties.extendSmallLabels && (data.value/totalvalue)*100 < 5) ? true : false,
					    distance = (extendlabel) ? radius*1.4 : radius*.75,
					    label = ((data.value/totalvalue)*100).toFixed(1) + '%';
					    label = (data.displaylabel) ? data.label + ' ('+label+')' : label; 
					    
					   
					//render label text
					context.save();
					context.fillStyle = data.labelColor || chartobj.properties.labelColor || 'black';
					context.strokeStyle = 'rgba(0,0,0,.66)';
					context.lineWidth = .5;
					context.globalAlpha = t2;
					context.font = weightedfontscale + 'pt Karbon-Light';
					context.textAlign = 'center';
					context.textBaseline = 'alphabetic';
					context.fillText(label, cX + Math.cos(mAngle)*distance, (weightedfontscale/2) +  cY + Math.sin(mAngle)*distance);
					
					if(extendlabel){
						
						var cX_label = cX + Math.cos(mAngle)*distance,
						    cY_label = cY + Math.sin(mAngle)*distance,
						    eX_label = cX + Math.cos(mAngle)*radius*.9,
						    eY_label = cY + Math.sin(mAngle)*radius*.9,
						    grad2 = context.createLinearGradient(cX_label,cY_label,eX_label,eY_label);
						    grad2.addColorStop(0, 'rgba(0,0,0,0)');
						    grad2.addColorStop(1, 'rgba(0,0,0,.75)');
						    
						context.strokeStyle = grad2;
						context.beginPath();
						context.moveTo(cX_label, cY_label);
						context.lineTo(eX_label, eY_label);
						context.stroke();
					}
					context.restore();
					
					//increment counter keeping track of total degrees drawn
					totaldegreesdrawn+=degrees;
				}
			}
		}
			
			
		//function will 'knockout' the center of the pie chart white/negative space.
		if(chartobj.properties.knockout) {(function knockoutPieCenter(){
			
			var sizemod = chartobj.properties.knockoutScale || .5;
			context.fillStyle = 'white';
			context.globalAlpha = 1;
			context.beginPath();
			context.arc(cX, cY, growradius*sizemod, 0, 7, false);
			context.lineTo(cX,cY);
			context.fill();
			context.restore();
			
		}.call(this))};
		
		
		//return true or false based on whether all transitions have reported finished or not
		if(t1 == 1 && t2 == 1) return true;
		else return false;
			
	}
	
}