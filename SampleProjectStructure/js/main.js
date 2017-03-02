//main project script



//elements wrapper dictionary
//define a list of wrapper ID's used for the main areas of the framework.
var myProjectWrappers = {
		carouselID : "main-content-wrapper",
		navID : "main-nav-list",
		presID : "main-presentation",
		tabsID : "pagetabs-wrapper"
    },
//developer-defined project options. Use this to customise sidekick options
    myProjectOpts = {
    		hideAdjacentSlides: false,
    		presentationName : 'main',
    		wrappers : myProjectWrappers
    },
//default pagination options
    paginationOptions = {
		displayAs: "numerals",		//"tabs" || "numerals"
		touchable: false,		//allows tabs to be touchable and enable carousel navigation
		separatorContent: "/"		//define custom separator content between slide index and total slide during "numerals" display mode
    },
//global reference to our parallax canvas instance
    iScrolls = {};




//DOMContentLoaded event handler
//anything that fires as soon as page DOM is first ready
//dont load bindings to dynamically loaded content here, it wont register yet.
window.addEventListener('DOMContentLoaded', function(){

	//create a new presentation instance within sidekick.
	//myProjectOpts.presentationName signifies the accessor after creation
	//ex: sidekick.presentation.main
	sidekick.createPresentation( myProjectOpts, postLoad );

	//prevent presentation view from sliding offscreen on device
	document.addEventListener( 'touchstart', function( e ){ e.preventDefault() }, true );

	//handy keyboard shortcut left/right keys to switch slides
	document.addEventListener( 'keyup', function( e ){

		if( !sidekick.presentation.main.carousel.flags.freeze &&
		    !sidekick.presentation.main.carousel.flags.transitioning ){

			switch( e.keyCode ){

				case 37 :
				case 39 :
					var cycledir = ( e.keyCode === 37 ) ? 'previous' : 'next';
					sidekick.presentation.main.cycle( cycledir );
					break;

				case 38 :
				case 40 :
					var historydir = e.keyCode === 38 ? 'back' : 'forward';
					sidekick.presentation.main.history[ historydir ]();
					break;

			}

		}

	}, false );

	//initialize modules
	initModules();

}, true );



//called when all checkLoad of all slides have completed
function postLoad(){
	//main index init
	indexinit();
	//project specific init sequence can go here
	page2init();
	page3init();
	page4init();
	//automation to create iScroll objects with any object with classname 'make-iScroll'
	//this needs to be one of the last statements to ensure the markup is ready to convert to iScroll objects
	createIScrolls();
}



//MODULE INIT Manager
//create module object references and bind functionality to presentation events
//Add or remove init functions from this list to enable/disable module support
//generally this should run AFTER sidekick main presentation has been instanced
//to allow framework hooks into your modules
function initModules(){

	//PAGINATION
	initPaginationModule();

}



//creates iscroll objects out of specific class-named HTML elements
//trigger at the end of all presentation object instance onload functions
//now using IScroll5 spec - better code structure
function createIScrolls(){


	//create iScroll Objects automatically
	var iscrollEls = document.getElementsByClassName( 'make-iScroll' ),
	    iscrollOpts = {
	    		scrollStart: function( e ){ e.stopImmediatePropagation(); },
	    		scrollbars: true,
	    		mouseWheel: true,
	    		useTransition: false,
	    		bindToWrapper: true,
	    };


	//loop through collection and create new iScroll object instances
	Array.prototype.forEach.call( iscrollEls, function( el, iscrollIndex ){

		//grab identifier key from element otherwise use numeric indicator
		var key = el.getAttribute( 'iscrollID' ) || iscrollIndex;

		//create the iScroll instance assigned to iScrolls global array
		iScrolls[ key ] = new IScroll( el, iscrollOpts );

		//stop carousel from scrolling with concomitant iScroll behavior
		el.addEventListener( 'mousedown', function( e ){ e.stopPropagation(); }, false );
		el.addEventListener( 'touchstart', function( e ){ e.stopPropagation(); }, false );

	} );


	//will update iscroll objects once they come back into focus as setting display:none seems to invalidate their existence :P
	sidekick.presentation.main.events.addEventListener( 'cycleEnd', refreshIScrolls );

}



//goes through existing iscroll objects in presentation and refreshes content
function refreshIScrolls(){

	for( var iScrollKey in iScrolls ){

		iScrolls[ iScrollKey ].refresh();

	}

}



//Module INIT functions
//Pagination
function initPaginationModule(){

	//create tab set
	sidekick.presentation.main.pagetabs = Paginate.addSet( 'main', myProjectWrappers.tabsID, paginationOptions );
	//Handle pagination cycling/reset
	sidekick.presentation.main.events.addEventListener( 'cycle', paginateCycle );
	sidekick.presentation.main.events.addEventListener( 'setSection', paginateRefresh );

	//support functions
	function paginateCycle( result ){
		sidekick.presentation.main.pagetabs.select( result.index );
	}
	function paginateRefresh( result ){

		//refresh tabs
		sidekick.presentation.main.pagetabs.refresh( result.numSlides, result.index );
		//make tabs interactive with sidekick carousel
		if( paginationOptions.touchable ){

			Array.prototype.forEach.call( sidekick.presentation.main.pagetabs.tabs, function( tab ){
				tab.wrapper.addEventListener( 'mouseup', sidekick.presentation.main.cycleTo.bind( this, tab.index ), false );
			} );

		}

	}

}
