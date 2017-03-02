// sidekick.js Framework
// Description: 	A codebase to facilitate rapid slide-based presentation assets
// 			Supports All modern browsers with no library dependencies
//			Has Veeva-specific feature support and is fully expandable with modular structural approach
//
// Date: 		Feb 23, 2015
// Author: 		Stephen Seator
// Version: 		0.8.2
//_______________________________________________________________


( window.sidekick = function(){



	//within the framework construct, use strict mode
	"use strict";



	// DEFAULT OPTIONS: DO NOT EDIT DIRECTLY!
	// defines a set of default project options to pass to a presentation object.
	// to overwrite/refefine project specific options, pass an object literal of options when
	// creating a new instance of MyProject
	var defaultWrappers = {
		presID: "main-presentation",
		carouselID: "main-content-wrapper",
		navID: "main-nav-list",
	};
	//default presentation object options
	var defaultProjectOptions = {
		cropslidemargins: true,
		dragthreshold: 250,
		height: 768,
		hideAdjacentSlides: false,
		historyStates: 10,
		jsonURL: 'data/slideStructure.json',
		loadCallbackDelay: 0,
		momentumweight: 5,
		presentationName: 'main',
		startsection: 0,
		startslideID: null,
		swipedirection: 'horizontal',
		swipemomentum: true,
		width: 1024,
		wrappers: defaultWrappers
	};
	//describes key:value pair aliases for slide status. values refer to CSS classes that govern slide styling
	var slideStatusDictionary = {
		current: 'current',
		previous: 'prev',
		next: 'next',
		invisible: 'invisible',
		hidden: 'nodisplay',
		notransition: 'notrans',
		transparent: 'transparent'
	};
	//sidekick private variables
	var presentation = {};
	//are we on iOS platform?
	var onDevice = /ipad/i.test( window.navigator.userAgent );





	//*** Presentation Object ***//
	//Inherits from SlideCarousel object in presentation.js.
	function Presentation( presentationOptions, callback ){


		//private framework vars
		var currentSectionIndex = null,
		    carousel = SlideCarousel(),
		    carouselWrapper,
		    events = EventManager(),
		    history,
		    loadcount = 0,
		    navigation,
		    navWrapper,
		    options = {},
		    self,
		    sections = [],
		    sitemap,
		    slidetotal = 0,
		    wrapper;



		//set default value for developer defined object options
		setOptions( defaultProjectOptions );


		//execute immediately
		//handles creation of project structure based on presentation options
		//sets html wrapper references for key presentation objects including slide carousel and main navigation
		//requests presentation JSON data via XHR request. triggers callback to handle data on success
		( function build( ){


			//set custom presentation options to mixin with options var
			setOptions( presentationOptions );


			//set history state object
			history = SlideHistory( options.historyStates );


			//set a load callback if one is defined
			events.addEventListener( 'load', callback );
			events.addEventListener( 'setSection', function( result ){

				if( !navigation ){

					setNavigation( result.sectionIndex );

				}

			} );
			events.addEventListener( 'captureHistory', function( result ){

				if( !history.flags.ignore ){

					history.capture( result );

				}

			} );


			//create wrapper references
			wrapper = document.getElementById( options.wrappers.presID ) || null;
			carouselWrapper = document.getElementById( options.wrappers.carouselID ) || null;
			navWrapper = document.getElementById( options.wrappers.navID ) || null;


			//load individual slides into the carousel
			if( carouselWrapper && options.jsonURL ){

				//main XHR request wrapper
				//createSlideFromData is callback to handle XHR response
				XHRload( options.jsonURL, 'JSON', createPresentationFromData );

				//bind carousel swipe events to enable slide swiping
				bindCarouselSwipeEvents();

				//set class designations
				addClassDesignations();

			// if no carouselWrapper is defined, or no JSONurl to parse, throw error exception
			} else {

				throw 'Error: sidekick Presentation could not find carousel wrapper components on page, or JSON data url was not found';

			}


			//bind swipe events to the carousel after linked to HTML node
			function bindCarouselSwipeEvents(){
				carouselWrapper.addEventListener( 'mousedown',  slideSwipe, false);
				carouselWrapper.addEventListener( 'touchstart', slideSwipe, false);
				carouselWrapper.addEventListener( 'mousemove', slideSwipe, false);
				carouselWrapper.addEventListener( 'touchmove', slideSwipe, false);
				carouselWrapper.addEventListener( 'mouseleave', slideSwipe, true);
				carouselWrapper.addEventListener( 'mouseup',  slideSwipe, false);
				carouselWrapper.addEventListener( 'touchend', slideSwipe, false);
			}


			//add framework class designations to wrappers
			function addClassDesignations(){

				if( wrapper ){

					wrapper.classList.add( 'presentation-wrapper' );

				}
				if( navWrapper ){

					navWrapper.classList.add( 'section-navigation' );

				}
				if( carouselWrapper ){

					carouselWrapper.classList.add( 'slide-carousel' );
					carouselWrapper.classList.add( options.swipedirection );

				}

			}

		}() );


		//response/callback function - Once JSON data has been retrieved, presentation section and slides are created.
		function createPresentationFromData( data ){

			//data retrieved from XHR load
			if( data ){

				//capture sitemap structure to define veeva KeyMessage structure for project
				//should include KeyMessage and Presentation IDs for veeva's gotoSlide API call
				sitemap = data.sitemap || null;


				//capture presentation navigation if defined within the JSON data
				navigation = data.presentation.navigation || null;


				//build presentation structure dependent on 'contentType' of presentation
				switch( data.presentation.contentType ){

					case "images":
						buildImageTypePresentation();
						break;

					case "html":
					case "HTML":
					default:
						buildHTMLTypePresentation();
						break;

				}



			//data is invalid or null, throw exception
			} else {

				throw 'JSON string invalid - parse error';

			}


			//builds presentation content utilizing images from a directory location as defined in JSON data
			function buildImageTypePresentation(){


				//function variables derived from JSON presentation properties
				var directory = data.presentation.contentDirectory,
				    prefix = data.presentation.convention.prefix,
				    fileType = data.presentation.convention.filetype,
				    decimals = data.presentation.convention.digits,
				    total = data.presentation.convention.numSlides,
				    imgCollection = [],
				    section = createNewSection();


				//iterate through the total slide count as defined in JSON convention property
				for( var i = 1; i <= total; i++ ){


					//get a zero-padded digit string in the unused decimal columns
					//dependent on numSlides defined in JSON
					var digitString = ( function getDigitString(){

						var zeroString = "";

						for( var j = String( total ).length - String( i ).length; j > 0; j-- ){

							zeroString += "0";

						}

						return zeroString + String( i );

					}() );


					//define default slide data properties
					var slideData = {
						index: i - 1,
						id: "Slide" + digitString,
						resourcedir: directory + "/",
						source: prefix + digitString + '.' + fileType,
						type: "image"
					};


					//add new slide instance to the carousel
					section.slides.push( createSlide( slideData, i - 1 ) );

				}

			}


			//builds presentation content utilizing HTML pages as defined in JSON data
			function buildHTMLTypePresentation(){

				//loop through presentation sections array
				data.presentation.sections.forEach( function( sectiondata, sectionindex ) {

					//set section index conditionally - look for defined index in JSON data first
					sectiondata.index = sectiondata.index || sectionindex || 0;

					//set section attributes
					var section = createNewSection( sectiondata );

					//iterate through slide objects to create each instance. attach to section array
					data.presentation.sections[ sectionindex ].slides.forEach( function( slidedata, slideindex ){

						//push slide into SlideCarousel slide array
						section.slides.push( createSlide( slidedata, slideindex ) );

					} );

				} );

			}


			function createNewSection( sectionProperties ){

				//normalize argument if none given - expects type Object
				sectionProperties = sectionProperties || {};

				//create section instance and set an index
				var section = PresentationSection( sectionProperties );
				    section.index = sectionProperties.index || 0;

				//add section to sections array
				sections.push( section );

				//return reference to new session instance
				return section;

			}

		}


		//helper function creates slide object and inserts into sections object slides array
		function createSlide( slidedata, slideindex ){

			//create slide wrapper for individual slide content
			var newslidewrapper = document.createElement( 'div' );
			    newslidewrapper.className = 'slide transparent';

			//append our slidewrapper to the main presentation carousel object
			carouselWrapper.appendChild( newslidewrapper );

			//Create new slide instance and push slide into presentation slidearray (aka carousel)
			//checkLoad is a callback triggered once slide markup has been loaded into project.
			var newslide = Slide( newslidewrapper, slidedata, checkLoad );
			    newslide.index = slideindex;

			//increment expected slide length count
			slidetotal++;

			//return reference to new slide object
			return newslide;

		}



		//fires when each slide object is loaded into the presentation after its HTML is loaded. Compares the number of successfully loaded slides vs the total number
		//of slides that are being defined in the slidestructure JSON data. Triggers an 'onPresentationLoad' event handler when all slides accounted for have loaded
		function checkLoad( result, slide ){


			//check to see whether load was successful or not
			//otherwise, remove the slide from presentation
			if( result && result.success ){

				loadcount++;

				slide.events.dispatchEvent( { type:"blur", details:slide } );

			} else {

				removeEmptySlide( slide );

			}


			//check slide load count vs total slides. if >=, alls lides are loaded and proceed with setting initial section visibility
			if( loadcount >= slidetotal ){

				return loadSuccess();

			}


			//checkload success: post-load operations
			function loadSuccess(){

				//create reference to self within the presentation object
				self = presentation[ options.presentationName ];

				//load from cache if data exists
				var cachedState = sidekick.cache.loadState();

				//set the initial section to display
				setSection( ( cachedState.sectionID || options.startsection || 0 ) , ( cachedState.slideID || options.startslideID || null ) );

				//clear local storage cache
				sidekick.cache.clear();

				//if nav wrapper, set nav link attributes
				linkNavigation();

				//cull any blank section data
				removeEmptySections();

				//script init if an event is assigned
				setTimeout( function(){

					events.dispatchEvent( { type:'load' } );

				}, options.loadCallbackDelay );

			}


			//slide load failure handler
			//if loading of slide fails, remove its container and remove from project slide array.
			function removeEmptySlide( whichslide ){

				//decrement expected slide total
				slidetotal--;

				//iterate through sections to find slide
				sections.some( function( section ){

					//iterate through section's slide array to find slide
					return section.slides.some( function( slide, slideindex ){

						//compare slides to find which to remove
						if( slide == whichslide ){

							slide.wrapper.parentNode.removeChild( slide.wrapper );
							section.slides.splice( slideindex, 1 );
							return true;

						}

					} );

				} );

			}


			//remove blank sections from project structure if there are no actively stored slides within the array
			function removeEmptySections(){

				//iterate through sections array
				sections.forEach( function( section, sectionindex ){

					//remove section if its slides array has no length
					if( !section.slides.length ){

						sections.splice( sectionindex, 1 );

					}

				} );

			}

		}


		//Handles cycling the carousel and other higher level presentation tasks on top of that
		//access in return object via method name 'cycle'
		function cycleCarousel( direction, slide ){

			//dispatch startCycle event
			events.dispatchEvent( { type: 'cycleStart' } );


			//determine the next slide to transition to and what action to use
			var outSlide = carousel.currentSlide,
			    findSlide = findSlideInPresentation( slide ) || {},
			    adjacentSlides = carousel.findAdjacentSlides(),
			    inSlide = findSlide.slide || adjacentSlides[ direction ] || null,
			    indexModifier = direction == 'previous' ? -1: 1,
			    cycleResult = { success: false };


			//Veeva and Section Jumps as defined in JSON
			//determine if slide cycle behavior should jump to a new section
			//also determines if Veeva jump should occur
			if( outSlide.properties[ direction ] ){

				//reference shortcut
				var gotoOperation = outSlide.properties[ direction ];

				//Set new section
				if( gotoOperation.section &&
				    sections[ gotoOperation.section ] ){

					return gotoSection( gotoOperation.section );

				}

				//veeva redirect
				else if( gotoOperation.veeva ){

					return gotoVeevaLink( gotoOperation.veeva, direction );

				}

			}


			//attempt to either cycle the carousel or set a new section
			switch( Boolean( inSlide ) ){

				case true:
					//if a slide is found, make the transition onto screen, dispatch cycleEnd event as callback
					cycleResult = carousel.cycle( direction, inSlide, events.dispatchEvent.bind( this, { type: 'cycleEnd', details:{ outSlide: outSlide, inSlide: inSlide } } ) );
					break;

				default:
					//no adjacent slide found in carousel. search for an adjacent section
					cycleResult = gotoSection( currentSectionIndex + indexModifier );
			}


			//fire callbacks depending on cycle result's success
			if ( cycleResult.success ){

				events.dispatchEvent( { type:'cycle', details:cycleResult } );
				events.dispatchEvent( { type:'captureHistory', details:{ presentation: self, section: currentSectionIndex, slide: inSlide } } );

			}


			//return the result
			return cycleResult;


			//define setSection behavior from swipe
			function gotoSection( sectionIndex ){

				//create initial result case
				var result = { success: false };

				//if next section index exists, go to that section
				if( sections[ sectionIndex ] ){

					//find inSlide object and set the new section
					inSlide = direction == 'previous' ? sections[ sectionIndex ].slides[ sections[ sectionIndex ].slides.length -1 ]:
									    sections[ sectionIndex ].slides[ 0 ];

					//execute go to section command
					setSection( sectionIndex, inSlide );

					//set result success to true
					result.success = true;

				}

				return result;

			}

		}


		//cycles the carousel to a specific index in the slide array within the carousel.
		//calls cycleCarousel after a cyclce direction is indicated
		function cycleCarouselToSlide( searchphrase ){


			//find this slide in the carousel
			var findSlide = carousel.findSlide( searchphrase );


			//if index is same as current slide index, no need to do anything
			if( findSlide.success &&
			    findSlide.slide.properties.id != carousel.currentSlide.properties.id ){

				//calculate our direction and find reference to inSlide
				var direction = ( findSlide.index < carousel.slideIndex ) ? 'previous': 'next',
				    inSlide = findSlide.slide;

				//cycle to inSlide
				cycleCarousel( direction, inSlide );


			//slide cant be found in current carousel. search visible presentation slide stack
			} else {

				//run for search in entire stack
				findSlide = findSlideInPresentation( searchphrase );

				//if found, set the section based on results
				if( findSlide.success ){

					//cycle to section and slide
					setSection( findSlide.section.index, findSlide.slide );

				}

			}

		}


		//searches through all presentation sections and their respective slides array to find a matching slide
		//querySlide can be either a slide object instance, index, or slide ID as defined in JSON
		function findSlideInPresentation( querySlide ){

			var result = { success: false };

			//only continue loop search if querySlide is defined and not null
			if( querySlide !== null &&
			    querySlide !== undefined ){

				//loop through sections array
				sections.some( function( searchSection ){

					//loop through searchSection's slides array
					return searchSection.slides.some( function ( searchSlide, slideIndex ){

						//slide is found, create result object and return true to break loop
						if( searchSlide === querySlide ||
						    searchSlide.properties.id === querySlide ){

							//create result object
							result = {
								success: true,
								section: searchSection,
								slide: searchSlide,
								index: slideIndex
							};

							//break loop
							return true;
						}

					} );

				} );

			}

			//return result object
			return result;
		}



		//define veeva redirect behavior from swipe
		//veevaObj includes a presentationID and keymessageID as defined in the JSON sitemap property
		//direction is optional to complete a transition-out of currentSlide
		function gotoVeevaLink( veevaObj, direction ){

			//build goto strings
			var presentationID = sitemap.presentations[ veevaObj.presentation ].id,
			    keymessageID = sitemap.presentations[ veevaObj.presentation ].keymessages[ veevaObj.keymessage ].id,
			    result = presentationID && keymessageID ?
			    	{ success: true }:
			    	{ success: false };


			//if presentationID and keymessageID are valid, navigate to new KM
			if( result.success ){

				//direction is required to complete the transition
				if( direction ){

					//set direction of transition on veevaobject
					veevaObj.direction = direction;
					//trigger carousel transition
					carousel.transition( direction, createSlide(), transitionCallback );

				} else {

					transitionCallback();

				}

				//trigger custom event dispatch
				events.dispatchEvent( { type: "veevaLink", details: veevaObj } );

			}


			//return result
			return result;


			//trigger callback once slide transition is done
			//will handle actual redirect to either a veeva link or a local directory
			function transitionCallback(){

				//conditional action - only use veeva commands if library is present.
				if( com.veeva.clm ){

					//use a live veeva command only on device - otherwise use more desktop-friendly redirect
					switch( onDevice ){

						case true:
							//use veeva command to set the window's location
							com.veeva.clm.gotoSlide( keymessageID + ".zip", presentationID );
							break;

						default:
							//search for local directory to navigate to
							window.location.href = "../" + keymessageID + "/" + keymessageID + ".html";

					}

				}

			}

		}



		//create navigation links to the defined sections within JSON
		//handles behavior of nav based on either veeva navigation or
		//index-based sections within the same key message
		function linkNavigation(){

			//only need bindings if navWrapper exists
			if( navWrapper ){

				//reference to nav wrapper and children collection of nav items
				var navitems = navWrapper.children;

				//proceed only if navitems exist
				if( navitems ){

					Array.prototype.every.call( navitems, function( navitem, navindex ){

						var navData = navigation ?
							navigation[ navindex ] || false:
							sections[ navindex ] || false;

						if( navData ){

							navData.index = navindex;
							bindActionsToItem( navitem, navData );

						}

						//break iteration if navData evaluates to false/null
						return navData;

					} );

				}

			}


			//event binding to fire section switch on nav item interaction
			function bindActionsToItem( item, navData ){

				item.addEventListener( 'mouseup', navlinkAction.bind( this, item, navData ), true );
				item.addEventListener( 'touchend', navlinkAction.bind( this, item, navData ), true );

			}


			//finds the index of the current active Nav
			function findActiveNav(){

				var result = {};

				Array.prototype.some.call( navWrapper.children, function( navitem, currentIndex ){

					if( navitem.classList.contains( 'active' ) ){

						result = {
							element: navitem,
							index: currentIndex
						};

						return true;

					}

				} );

				return result;

			}


			//callback to invoke when events are triggered
			function navlinkAction( item, navData, e ){

				//dont navigate if carousel is not ready for it i.e. transitioning/frozen or if link is disabled
				if( !carousel.flags.transitioning &&
				    !carousel.flags.frozen ){

					//set capability for main nav links to define their own behavior - invokes function defined in the attribute
					if( item.hasAttribute( 'execute' ) ){

						window[ item.getAttribute( 'execute' ) ]();

					//default behavior - invokes a section change method
					} else {

						//trigger custom navigation event
						events.dispatchEvent( { type: "navigation", details: item } );

						//navigation is given explicit behavior in JSON
						if( navigation ){

							//determine direction to faux transition current slide out
							var activeNav = findActiveNav(),
							    transitionDirection = activeNav.index === undefined ?
							    	undefined:
							    	navData.index < activeNav.index ?
									"previous":
									"next";

							//only navigate if the navigable section is not the current section
							if( !item.classList.contains( "active" ) ){

								//create a veevaLink object based on section veevaNav properties
								var veevaLink = {
								    	keymessage: navData[ 'keymessage' ] || null,
								    	presentation: navData[ 'presentation' ] || null
								};

								//remove nav element active class
								if( activeNav.element ){

									activeNav.element.classList.remove( "active" );

								}

								//transition a dummy slide in, go to veeva link bound as the callback
								gotoVeevaLink( veevaLink, transitionDirection );

							}

						//default behavior is to link to section via section index
						} else {

							//only navigate if the navigable section is not the current section
							if( navData !== sections[ currentSectionIndex ] ){

								setSection( navData.index );

							}

						}

					}

				}

			}

		}


		//set presentation options
		function setOptions( presentationOptions ){

			for( var item in presentationOptions ){

				if( presentationOptions.hasOwnProperty( item ) ){

					options[ item ] = presentationOptions[ item ];

				}

			}

		}


		//set navigation based on section index
		function setNavigation( sectionIndex ){

			//only if navWrapper.children exist
			if( navWrapper &&
			    navWrapper.children &&
			    !navigation ){

				//traverse through nav items and set each item's state
				Array.prototype.forEach.call( navWrapper.children, function( navitem, i ){

					//this is the nav item selected, make this nav state 'active'
					if( i == sectionIndex ){

						navitem.classList.add('active');

					}
					//otherwise, if the section status is not 'disabled', remove the class attribute
					else{
						if( navitem.classList[ 0 ] != 'disabled' ){

							navitem.classList.remove( 'active' );

						}

					}

				} );

			}

		}


		//sets an active section within the presentation
		//requires a section index in range of the sections array
		//optional inSlide and fromEnd determine what slide to transition in
		//and whether the new section starts at the end of its slides array as initial start slide
		function setSection( setSectionIndex, inSlide, fromEnd ){


			var result = { success: false },
			    outSlide = carousel.currentSlide,
			    findSlide,
			    direction = ( setSectionIndex > currentSectionIndex ) ? "next": "previous";


			//only proceed if setSectionIndex exists and is not currently disabled
			if( sections[ setSectionIndex ] ){


				//get instance of slide transitioning onto screen
				inSlide = ( fromEnd ) ? sections[ setSectionIndex ].slides.length - 1: inSlide;
				findSlide = ( inSlide ) ? findSlideInPresentation( inSlide ): findSlideInPresentation( sections[ setSectionIndex ].slides[ 0 ] );
			    	inSlide = findSlide.slide;


				//organize other slides not in transition
				sections.forEach( function( searchSection, searchSectionIndex ){

					searchSection.slides.forEach( function( searchSlide, searchSlideIndex ){

						//dont set status for slides that are about to be transitioned
						if( searchSlide != outSlide &&
						    searchSlide != inSlide ){

							//set base status string for searchSlide
						    	var statusString = ( options.hideAdjacentSlides ||
						    	                     searchSectionIndex != setSectionIndex ) ? "hidden ": "";

						    	//order status string based on prior section/slide index
							switch( searchSectionIndex < setSectionIndex ||
								searchSlideIndex < findSlide.index ){

								case true:
									statusString += "previous notransition";
									break;

								default:
									statusString += "next notransition";
									break;

							}
							//set search slide status accordingly
							searchSlide.setStatus( statusString );

						}

					} );

				} );


				//set this section
				currentSectionIndex = Number( setSectionIndex );
				carousel.slides = sections[ currentSectionIndex ].slides;


				//if this is the first setSection, set reference to starting slide as currentSlide
				if( !outSlide ){

					inSlide.setStatus( "current" );
					carousel.currentSlide = inSlide;
					carousel.slideIndex = findSlide.index;
					result = {
						success: true,
						section: sections[ setSectionIndex ],
						slide: inSlide,
						index: findSlide.index
					};

				//cycle carousel to inSlide only if outSlide and inSlide are not the same slide.
				} else if ( outSlide &&
					    outSlide !== inSlide) {

					result = carousel.cycle( direction, inSlide );

				}

				//trigger completion event
				triggerSetSectionEvents();


			}


			//end function, return setSection result status
			return result;


			//support function to trigger custom events for setting new section/slide
			function triggerSetSectionEvents(){

				//create event details to pass to handler functions
				var setSectionDetails = {
					sectionIndex: currentSectionIndex,
					index: inSlide.index,
					numSlides: carousel.slides.length
				    },
				    captureHistoryDetails = {
				    	presentation: self,
				    	section: currentSectionIndex,
				    	slide: findSlide.slide
				    };


				//dispatch custom events
				events.dispatchEvent( { type:'setSection', details:setSectionDetails } );
				events.dispatchEvent( { type:'captureHistory', details:captureHistoryDetails } );

			}


		}



		//NEW slideswipe routine
		//Handles input from the carousel wrapper and calculates slide offset and transitioninig
		//based on TouchCoord input from user.
		function slideSwipe( e ){


			//stop normal event behavior & event propagation
			e.preventDefault();
			e.stopPropagation();


			//object reference variables
			var slide = carousel.currentSlide,
			    slideGroup = carousel.currentSlideGroup,
			    coordinates = carousel.coordinates,
			    axis = options.swipedirection === "horizontal" ? "X" : "Y";


			//handler functions for swipe behavior
			var swipeHandler = {

				start: function(){

					//capture initial event data
					coordinates.capture( e );

				},

				drag: function(){

					//only proceed if a touchstart/mousedown event has been established
					if( canSlideSwipe() ){

						//capture coordinates in the carousel
						coordinates.capture( e );

						//check if distance threshold is breached
						switch( checkThreshold() ){

							case true:
								//end the input handler
								this.end();
								break;

							default:
								//track the position of the slideGroup based on coordinate data
								trackSlideGroupPosition();
								break;

						}

					}

				},

				end: function(){

					//important to trigger only if a distance has been travelled, else
					//the slides can be set into a frozen state when they shouldnt be.
					if( canSlideSwipe() &&
					    determineOffset() ){

						//check if a cycle should take place, check the result
						//to determine if additional slide transitions should apply
						switch( cycleFromSwipe().success ){

							case false:

								if( options.swipemomentum ){

									applyMomentum();

								} else {

									springBack();

								}
								break;

						}

					}

					//coordinate values should always be reset regardless of condition testing
					coordinates.reset();

				}

			};


			//main event controller
			//conditionally handles the events based on type
			switch( e.type ){

				case "mousedown":
				case "touchstart":
				case "pointermove":

					swipeHandler.start();
					break;

				case "mousemove":
				case "touchmove":
				case "pointermove":

					swipeHandler.drag();
					break;

				case "mouseleave":

					if( determineIfChild( e.currentTarget, e.relatedTarget || e.toElement ) ){

						break;

					}

				default:

					swipeHandler.end();
					break;

			}


			//applies a calculated momentum value to the current position of the slide
			function applyMomentum(){


				//calculate applied distance
				var momentum = coordinates.data[ "momentum" + axis ],
				    distance = momentum * options.momentumweight + determineOffset();


				//momentum should reach some base threshold to avoid painfully slow, meaningless slide transitions
				if( Math.abs( momentum ) > 8 ){

					slide.wrapper.addEventListener( 'transitionend', checkThresholdWithMomentum, false );

					trackSlideGroupPosition( distance, true );

				//otherwise, immediately snapback if not enough momentum is delivered
				} else {

					springBack();

				}


				//check to see if the momentum distance is enough to break the swipe threshold
				//attempt to cycle slide if so, or spring back if cycle action fails
				function checkThresholdWithMomentum(){

					//remove event listener to prevent repeated cycling calls
					slide.wrapper.removeEventListener( 'transitionend', checkThresholdWithMomentum, false );

					//attempt to cycle, spring back if cycle fails
					switch( cycleFromSwipe( distance ).success ){

						case false:
							springBack();
							break;

					}

				}

			}


			//returns boolean value that determines if a slide is swipable
			//there are quite a few possible interruption states, this function
			//creates a quick alias to check all of these conditions.
			function canSlideSwipe(){

				return Boolean( coordinates.data.istouched &&
				       		slide.properties.swipable &&
				       		!carousel.flags.freeze &&
				       		!carousel.flags.transitioning );

			}


			//check to see if current offset has exceeded the required draggable threshold
			//can use alternate argument to check a distance of arbitrary setting
			//returns simple boolean value of result
			function checkThreshold( manualDistance ){

				var offset = manualDistance || determineOffset();

				if( Math.abs( offset ) > options.dragthreshold ){

					return true;

				} else {

					return false;

				}

			}


			//attempt to cycle the carousel via swipe action
			//checks to see if threshold is met, calls cycleCarousel function to handle cycling
			//returns a result object including success property
			function cycleFromSwipe( checkDistance ){

				var offset = checkDistance || determineOffset(),
				    result = { success: false },
				    direction = ( offset > 0 ) ? 'previous' : 'next';

				if( checkThreshold( offset ) ){

					result = cycleCarousel( direction, carousel.findAdjacentSlides()[ direction ] );

				}

				return result;

			}


			//determines if an element is a child of a parent node
			//returns a boolean value on completion
			//mainly forces mouse events to act like touch events when mouseleave is triggered
			function determineIfChild( parent, possibleChild ){

				//both parameters are required
				if( parent && possibleChild ){

					//test to see if possibleChild is a wrapper el to another carousel. If so, interrupt
					for( var preskey in presentation ){

						if( presentation[ preskey ].wrapper == possibleChild ){

							return false;

						}

					}

					//test to see if possible child is child of carousel wrapper
					return Array.prototype.some.call( parent.querySelectorAll( possibleChild.tagName ), function( childEl ){

						if( childEl == possibleChild ){

							return true;

						}

					} );

				} else {

					return false;

				}

			}


			//based on the cardinal direction the carousel is locked in,
			//returns the coordinate data to use as the proper offset at any point in time.
			function determineOffset(){

				return coordinates.data[ "drag" + axis ] || 0;

			}


			//handles a spring back transition from the current slide position
			function springBack(){

				carousel.flags.freeze = true;

				slide.wrapper.addEventListener( "transitionend", springBackEnd, false );

				trackSlideGroupPosition( 0, true );

			}


			//triggered always at the end of a springBack
			//removes springBack listener and resets general positioning
			function springBackEnd(){

				slide.wrapper.removeEventListener( "transitionend", springBackEnd, false );

				//introduce slight delay to prevent jankiness
				setTimeout( function(){

					carousel.flags.freeze = false;

				}, 50 );

			}


			//tracks the slide positioning within the slideGroup
			//slideGroup is populated based on any existing 'adjacent' slides (which is an ambiguous definition)
			//adjacent slides can be either in order of the carousel but also set in the JSON to override logical ordering
			//tracks offset values to handle for their 'previous' and 'next' status so they appropriately track relative
			//to their carousel positioning
			function trackSlideGroupPosition( manualOffset, useTransition ){

				//apply to entire slideGroup
				slideGroup.forEach( function( trackSlide ){

					var offset = manualOffset !== undefined ? manualOffset: determineOffset(),
					    whichDimension = options.swipedirection === "horizontal" ? 'width': 'height',
					    dimensionOffset = slide.wrapper.getBoundingClientRect()[ whichDimension ];

					//adjust offset based on prev/next slide status
					offset = trackSlide.hasStatus( 'previous' ) ?
						offset - dimensionOffset:
					    	trackSlide.hasStatus( 'next' ) ?
					    		offset + dimensionOffset:
					    		offset;

					//sets transition status based on useTransition flag
					switch( useTransition ){

						case true:
							carousel.flags.freeze = true;
							trackSlide.wrapper.classList.remove( slideStatusDictionary[ "notransition" ] );
							break;

						default:
							trackSlide.wrapper.classList.add( slideStatusDictionary[ "notransition" ] );

					}

					//set the wrapper transform
					trackSlide.setTransform( axis, offset );

				} );

			}

		}


		//access object
		//creates closure to keep properties private.
		//exposing base presentation level methods.
		return Object.create( {

			//return reference to presentation carousel
			get carousel() { return carousel; },
			//get the current slide in carousel
			get currentSlide() { return carousel.currentSlide; },
			//presentation events getter
			get events() { return events; },
			//history getter
			get history() { return history; },
			//presentation options getter
			get options() { return options; },
			//visibility of sitemap data mapping
			get sitemap() { return sitemap; },
			//link to wrapper el
			get wrapper() { return wrapper; },

			type: "PRESENTATION"

		}, {

			//cycle overload for additional project-level functionality
			//slide optional argument, otherwise uses the 'next' slide.
			cycle: {
				writable: false,
				configurable: false,
				value: cycleCarousel

			},


			//cycles to a specific index in the carousel slides array
			cycleTo: {
				writable: false,
				configurable: false,
				value: cycleCarouselToSlide
			},


			//find a slide instance within the entire presentation structure.
			//iterates through sections and within each section's slides array
			//searches for exact instance match
			findSlide: {
				writable: false,
				configurable: false,
				value: findSlideInPresentation

			},


			//expose gotoVeevaLink method for manual navigation
			gotoVeevaLink: {
				writable: false,
				configurable: false,
				value: gotoVeevaLink
			},


			//makes a subset of total presentation slide array 'visible' to swipe through.
			//should be triggered when section change occurs
			//index parameter is required. sectionIndex is required if defined as non-integer index value
			setSection: {
				writable: false,
				configurable: false,
				value: setSection

			},

		} );

	}







	//***PRESENTATION SECTION OBJECT ***//
	//presentation section object which takes parameter 'properties' where properties is an object literal
	//will populate section object instance properties from 'properties'
	//properties typically defined within slidestructure.json
	function PresentationSection( definedProperties ){


		//private variables
		var properties = {},
		    slideArray = [],
		    displaySection = true;


		//iterate through keys in property object, store them in instance
		for( var key in definedProperties ){

			if( key !== 'slides' ){

				properties[ key ] = definedProperties[ key ];

			}

		}


		//toggles status of section to indicate if it is navigable or not
		function toggleDisplayStatus(){

			switch( displaySection ){

				case true:
					displaySection = false;
					break;

				default:
					displaySection = true;
					setStatus();

			}

		}


		//return accessor object
		return Object.create( {

			//properties getter
			get properties() { return properties; },

			type: "SECTION"

		}, {

			slides: {
				writable: false,
				configurable: false,
				value: slideArray
			},

			//sets the slide state as active or disabled
			toggleDisplayStatus: {
				writable: false,
				configurable: false,
				value: toggleDisplayStatus
			},

		} );

	}






	//*** CAROUSEL OBJECT ***//
	//SlideCarousel controls the left/right or up/down carousel sliding mechanism
	//amongst a series (array) of slides.
	function SlideCarousel(){

		//carousel private variables
		var slides = [],
		    coordinates = TouchCoords(),
		    events = EventManager(),
		    currentSlide,
		    currentSlideGroup = [],
		    slideIndex,
		    intransition = false,
		    iscycling = false,
		    isfrozen = false,
		    isOutslideHidden = false;


		//private functions
		//cycles the carousel slide stack in specified direction
		//requires a slide instance to transition to
		function cycle( direction, inSlide, callback ){

			//default result
			var result = { success: false };

			//only cycle if direction is provided.
			if( direction &&
			    inSlide &&
			    !iscycling &&
			    !isfrozen ){

				//set incycle flag - stop multiple calls to cycle while dragging mouse
				iscycling = true;

				//conditional variables set based on left/right direction
				var findSlide = findSlideInCarousel( inSlide );

				//slide found, transition to it
				if( findSlide.success ){

					transition( direction, inSlide, callback );
					slideIndex = findSlide.index;
					result = {
						success: true,
						action: 'cycle',
						direction: direction,
						index: slideIndex
					};

				//slide doesnt exist in in this carousel, cancel cycle flag
				} else {

					iscycling = false;
				}

			}

			return result;

		}


		//find adjacent slides as defined by any JSON properties that might
		//differentiate from normal index sorting from slides array
		function findAdjacentSlides(){

			//vars
			var result = { success: false },
			    adjacentkeys = [ 'previous', 'next' ];

			//set result for prev/next
			adjacentkeys.forEach( function( key, index ){

				if( currentSlide &&
				    currentSlide.properties[ key ] &&
				    currentSlide.properties[ key ].slide ){

					result[ key ] = slides[ currentSlide.properties[ key ].slide ] || null;
					result.success = true;

				}

			} );

			//set default values for result being the normal adjacent slides as defined by the slides array order
			result.previous = result.previous || slides[ slideIndex - 1 ] || null;
			result.next = result.next || slides[ slideIndex + 1 ] || null;

			//return the result
			return result;

		}


		//find a slide within the carousel object
		//findSlide can be either an object instance, ID name (string), or an index
		//search results evaluate explicity, must match type
		//returns result object with status, slide reference and the index within the array
		function findSlideInCarousel( querySlide ){

			//create result object
			var result = { success: false };

			//iterate through carousel slides array to compare slides
			slides.some( function( searchSlide, slideIndex ){

				//slide is found
				if( searchSlide === querySlide ||
				    searchSlide.properties.id === querySlide ||
				    searchSlide.index === querySlide ){

					//create matching result object
					result = {
						success: true,
						slide: searchSlide,
						index: slideIndex
					};

					return result;

				}

			} );

			return result;

		}


		//reorders next/prev status around an indicated slide
		function reorderSlides( searchSlide ){

			//found flag
			var foundit = false,
			    baseStatus = isOutslideHidden ? "hidden " : "";

			//carousel slide array iteration
			slides.forEach( function( compareSlide ){

				//remove slide transform attribute if left over
				compareSlide.wrapper.removeAttribute( 'style' );

				//test to see if we've found our slide
				if( compareSlide == searchSlide ){

					foundit = true;

				//if not, set slide status dependent on foundit value
				} else {

					if( !foundit ){

						compareSlide.setStatus( baseStatus + "previous notransition" );

					} else {

						compareSlide.setStatus( baseStatus + "next notransition" );

					}

				}

			} );

		}


		//handles actual class management to facilitate css transition animation between slides.
		//requires a slide reference to set to current and a direction that is being transitioned.
		//helper method to 'cycle'
		function transition( direction, inSlide, callback ){


			//set bool transition state to true
			intransition = true;

			//set default state of direction
			direction = direction || 'next';

			//determine type of currenslide, whether its a slide object or a veeva jumpto object - create temp slide to transition 'to' if so
			var outSlide = currentSlide,
			    outStatus = ( direction == 'next' ) ? 'previous' : 'next',
			    inTransComplete = false,
			    outTransComplete = false;
			    isOutslideHidden = inSlide.hasStatus( 'hidden' );

			//error check to make sure our current slide is the right type of object now
			if( inSlide ){

				//trigger custom slide transition events if defined
				inSlide.events.dispatchEvent( { type:'transitionto', details:inSlide } );
				outSlide.events.dispatchEvent( { type:'transitionfrom', details:outSlide } );

				//remove hidden state so the frame can transition
				inSlide.setStatus( 'hidden', 'remove' );

				//set delay so the slide to display can transition (currently is display:none, must make it display before transitioning else there is no transition)
				setTimeout( startSlideTransition, 10 );

			}


			//Transition Functions
			//begin slide transition - set state of current slide. fire custom start transition event methods
			function startSlideTransition( ){

				inSlide.setStatus( "current" );
				inSlide.wrapper.removeAttribute( "style" );
				inSlide.wrapper.addEventListener( 'transitionend', inSlideTransitionEnd, false );

				outSlide.setStatus( outStatus );
				outSlide.wrapper.removeAttribute( "style" );
				outSlide.wrapper.addEventListener( 'transitionend', outSlideTransitionEnd, false );

			}

			//what happens when inSlide is finished transitioning onto screen
			function inSlideTransitionEnd( ){

				inSlide.wrapper.removeEventListener( 'transitionend', inSlideTransitionEnd );
				delete inSlide.offsets;

				inTransComplete = true;
				checkIfTransitionComplete();

			}


			//what happens when outSlide is finished transitioning off screen
			function outSlideTransitionEnd( ){

				outSlide.wrapper.removeEventListener( 'transitionend', outSlideTransitionEnd );
				delete outSlide.offsets;

				outTransComplete = true;
				checkIfTransitionComplete();

			}


			//checks to see if both slides have finished transitioning - wraps up transition if true
			function checkIfTransitionComplete(){

				if( inTransComplete && outTransComplete ){

					//wrap up transition settings
					reorderSlides( inSlide );
					currentSlide = inSlide;
					slideIndex = inSlide.index;
					intransition = false;
					iscycling = false;

					//fire custom slide events
					inSlide.events.dispatchEvent( { type:'focus', details: inSlide } );
					outSlide.events.dispatchEvent( { type:'blur', details: outSlide } );

					//update adjacent slidegroup
					updateSlideGroup();

					//hide adjacent slide if flag is true
					if( isOutslideHidden ){

						outSlide.setStatus( 'hidden', 'add' );

					}

					//fire callback
					if( callback && typeof callback == 'function' ){

						callback.call( this );

					}

				}

			}

		}


		//update slide group that contains current inSlide and its adjacents
		function updateSlideGroup(){

			if( currentSlide ){

				var prevSlide = findAdjacentSlides().previous || null,
				    nextSlide = findAdjacentSlides().next || null,
				    pushArray = [ prevSlide, currentSlide, nextSlide ];

				pushArray.forEach( function( pushSlide ){

					if( pushSlide ){

						currentSlideGroup.push( pushSlide );

					}

				} );

			}

		}


		// return accessor object
		return Object.create(

			{

				//coordinate tracking object instance
				get coordinates() { return coordinates; },


				//currentSlide getter / setter
				get currentSlide() { return currentSlide; },
				set currentSlide( value ) {
					currentSlide = value;
					updateSlideGroup();
				},
				get currentSlideGroup() { return currentSlideGroup; },
				get currentIndex() { return slideIndex; },


				//touch coord event reference
				get events() { return events; },


				//flags indicating state of carousel cycling and transitions
				flags: {
					get cycling() { return iscycling; },
					get freeze() { return isfrozen; },
					set freeze( value ) { isfrozen = value; },
					get transitioning() { return intransition; }
				},

				//slides array getter
				get slides() { return slides; },
				set slides( value ) { slides = value; },


				//slideIndex getter/setter
				get slideIndex() { return slideIndex; },
				set slideIndex( value ) { slideIndex = value; },


				//Object type
				type: 'CAROUSEL',

			},
			{

				cycle: {
					writable: false,
					configurable: false,
					value: cycle
				},

				findAdjacentSlides: {
					writable: false,
					configurable: false,
					value: findAdjacentSlides
				},

				findSlide: {
					writable: false,
					configurable: false,
					value: findSlideInCarousel
				},

				transition: {
					writable: false,
					configurable: false,
					value: transition
				}

			}

		);

	}





	//define Slide object
	function Slide( element, JSONdata, callback ){


		//set reference to wrapper element
		var wrapper = element,
		    status = [],
		    events = EventManager(),
		    properties = {},
		    customproperties = {};


		//import JSONdata
		if( JSONdata ){


			//create instance properties based on JSONdata
			properties.id = JSONdata.id;				//unique ID itenifier
			properties.src = JSONdata.source;			//relative path location to slide HTML file from index/root
			properties.section = JSONdata.section;			//navigation section current slide is grouped under
			properties.dir = JSONdata.resourcedir;			//relative path from root where slide resource files live
			properties.next = JSONdata.next || null;		//link to next defined section
			properties.previous = JSONdata.previous || null;	//link to previous defined section
			properties.swipable = JSONdata.swipable == 'false' ? false: true;
			properties.type = JSONdata.type || "html";


			//set custom properties defined by JSON 'customproperty' key
			//custom properties can be accessed via regular dot notation
			if( JSONdata.customproperties ){

				Object.keys( JSONdata.customproperties ).forEach( function( property ){

					customproperties[ property ] = JSONdata.customproperties[ property ];

				} );

			}

			//set custom event bindings to the slide's state
			if( JSONdata.events ){

				Object.keys( JSONdata.events ).forEach( function( property ){

					events.addEventListener( property, JSONdata.events[ property ] );

				} );

			}


			//load slide content based on type of content
			switch( properties.type ){

				case "image":
					loadImageContent();
					break

				case "html":
				case "HTML":
				default:
					loadHTMLContent();
					break;

			};

		}


		//loads an image as the slide content, determined by presentation type in JSON data.
		//contentType is set to "images"
		function loadImageContent(){

			var content = new Image();
			    content.addEventListener( "load", appendImageToSlide, false );
			    content.addEventListener( "dragstart", function(e){ e.preventDefault(); }, true );
			    content.src = properties.dir + properties.src;
			    content.className = "image-slide";

			function appendImageToSlide(){

				wrapper.appendChild( content );

				loadSuccess();

			}

		}


		//load the supplied source url into the slide's container
		//uses XHR over jquery to give framework greater control over script injection
		//main XHR request wrapper
		//contentType is set to "html"
		function loadHTMLContent(){

			XHRload( properties.dir + properties.src, 'plaintext', function( response ){

				if( response ){

					//load response text into new slide element
					loadSlideContent( response );

					//load callback on success
					loadSuccess();

				} else {

					if( typeof callback == 'function' ) callback( { success:false } );

				}

			} );

		}


		//triggers a callback function if supplied and dispatches the slide's custom "load" event
		function loadSuccess(){

			//load callback on success
			if( typeof callback == 'function' ) callback( { success:true }, accessor );

			//dispatch custom slide load event
			events.dispatchEvent.call( this, { type:'load', details:this } );

		}


		//load slide callback from xhr request
		function loadSlideContent( htmltext ){


			//create dom parser object
			var parser = new DOMParser() || null,
			    newdoc;


			switch( parser ){

				//create a new HTML doc to inject the html response text into (cant request responseType 'document' reliably without web server)
				case true:
					newdoc = parser.parseFromString( htmltext, 'text/html' );
					break;

				//browser polyfill to ensure newdoc is not a blank document.
				default:
					newdoc = parser.parseFromString( htmltext, 'text/html' );//document.implementation.createHTMLDocument( 'temp document' );
					newdoc.open();
					newdoc.write( htmltext );
				    	newdoc.close();

			}


			//new doc element references
			var htmlfrag = document.createDocumentFragment();			//new docfrag to copy the elements into that goes into slidewrapper
			var scriptfrag = document.createDocumentFragment();


			//manage head script injection. if linked script files, include them in main head if they dont already exist.
			//otherwise add script tag and style tag headers to slide container
			//note: script tags still have global scope if js is inline
			Array.prototype.forEach.call( newdoc.head.children, function( sourceEl ){

				//only inject if no 'exclude' attribute set
				if( !sourceEl.hasAttribute( 'exclude' ) ){

					//append to main document <head> conditionally
					if( sourceEl.tagName == 'SCRIPT' || sourceEl.tagName == 'LINK' ){

						//traverse through main head elements for comparison
						var dupe = Array.prototype.some.call( document.head.children, function( compareEl ){

							//compare these attribute values
							var loc = sourceEl.src || sourceEl.href || null;
							    loc = (loc) ? loc.substr( loc.lastIndexOf( '/' ) ): null;

							var loccomp = compareEl.src || compareEl.href || null;
							    loccomp = ( loccomp ) ? loccomp.substr( loccomp.lastIndexOf( '/' ) ): null;

							//if they are the same relative name, set 'dupe' flag
							if(loc && loc == loccomp){

								return true;

							}

						} );

						//if not already included in the document, add them to the script fragment
						if( !dupe ) {

							if( sourceEl.src ){

								sourceEl.src = sourceEl.src.substr( String( sourceEl.src ).indexOf( 'js/' ) );			//truncates js src to relative path in relation to root

							} else if( sourceEl.href ){

								sourceEl.href = sourceEl.href.substr( String( sourceEl.src ).indexOf( 'css/' ) );		//truncates css href to relative path in relation to root

							}

							scriptfrag.appendChild( copyScriptEl( sourceEl ) );

						}

					}

					//append to fragment
					else if( sourceEl.tagName == 'STYLE' ){

						htmlfrag.appendChild( copyScriptEl( sourceEl ) );

					}

				}

			} );


			//transfer html nodes to document fragment
			var slidecontent = document.createElement( 'div' );
			    slidecontent.className = 'slide-content-wrapper';
			    slidecontent.innerHTML = newdoc.body.innerHTML;

			//append html to markup specific fragment
			htmlfrag.appendChild( slidecontent );

			//append new markup and script fragments to presentation slide container / document head respectively
			wrapper.appendChild( htmlfrag );
			document.head.appendChild( scriptfrag );

		}


		//helper function for quickly copying inline script elements
		function copyScriptEl(el){

			var script;

			if( el.tagName == 'SCRIPT' &&
			   !el.hasAttribute( 'src' ) ){

				script = document.createElement( 'script' );
				script.type = 'text/javascript';
				script.innerHTML = el.innerHTML;

			} else {

				script = el.cloneNode( true );

			}

			return script;

		}

		//searches to see if slide instance has a particular status
		function hasStatus( whichStatus ){

			return status.some( function( queryStatus ){

				if( queryStatus === whichStatus ){

					return true;

				}

			} );

		}


		//sets a particular status to the slide instance, with additional action parameters supporting
		//'add', 'replace' or ,'delete'
		function setStatus( statusString, action ){

			var statusArray = statusString.split(' ');			//explode string to create a searchable array
			    action = action || 'replace';				//default action is to replace existing classname

			//remove other/old statuses if action is to replace
			if( action === 'replace' ){

				wrapper.className = 'slide';
				status = statusArray;
				action = 'add';

			}

			//assign new CSS status class
			statusArray.forEach( function( thisstatus ){

				//add status
				if( action === 'add' ){

					wrapper.classList.add( slideStatusDictionary[ thisstatus ] );

					if( !hasStatus( thisstatus ) ){

						status.push( thisstatus );

					}
				//remove status if action is not 'add'
				} else {

					wrapper.classList.remove( slideStatusDictionary[ thisstatus ] );

				}

			} );

		}



		//sets transform values to the slide instance for ease of syntax
		//handles cross-browser compatible transformation rules
		function setTransform( axis, offset ){

			if( axis ){

				//normalize offset to an integer
				offset = offset || 0;

				//build transform string
				var transformString = "translate" + axis + "(" + offset + "px) !important";

				//set tranasform attribute
				wrapper.setAttribute( 'style',
					"-webkit-transform: " + transformString +
					"; -moz-transform: " + transformString +
					"; -ms-transform: " + transformString +
					"; -o-transform: " + transformString +
					"; transform: " + transformString
				);

			}

		}



		//return object
		var accessor = Object.create( {

			get properties() 	{ return properties; },
			get wrapper() 		{ return wrapper; },
			get customproperties() 	{ return customproperties; },
			get events() 		{ return events; },
			type: "SLIDE"

		}, {

			//search for a particular status string active for this slide
			//requires a status parameter
			hasStatus: {
				writable: false,
				configurable: false,
				value: hasStatus
			},

			//set the current status of the slide instance
			setStatus: {
				writable: false,
				configurable: false,
				value: setStatus

			},

			//easily set a CSS transform value to translate the wrapper's position
			//requires axis string an int value as an offset amount
			setTransform: {
				writable: false,
				configurable: false,
				value: setTransform
			},

		} );

		return accessor;

	};




	//History object to track and collect a history of slide navigation
	function SlideHistory( maxStates ){


		var historyArray = [],
		    events = EventManager(),
		    maxlength = maxStates || 10,
		    currentIndex = 0,
		    flags = {
		    	ignore: false
		    };


		//captures current state of the slide display history
		//details argument is an object with properties defining current section and slideID
		function captureState( details ){


			//create new history object based on custom event callback details
			var historyObj = {
				whichPresentation: details.presentation, 	//presentation object reference (object)
				whichSection: details.section,			//section index (number)
				whichSlide: details.slide 			//slide object reference (object)
			}


			//ensure that capturing a new state crops any 'future' states out of the history array
			//this creates a new history branch on each capture.
			if( historyArray.length - 1 !== currentIndex ){

				historyArray = historyArray.slice( 0, currentIndex + 1 );

			}


			//add state to history stack
			historyArray.push( historyObj );


			//if history max length is breached, remove end of queue entries in history
			if( historyArray.length > maxlength ){

				historyArray.shift();

			}


			//set new reference to currentIndex at the end of the array
			currentIndex = historyArray.length - 1;


		}


		//back function regresses through the slide history
		//triggers goToState with updated currentIndex
		function goBack(){

			if( currentIndex ){

				flags.ignore = true;
				goToState( --currentIndex );
				flags.ignore = false;
				console.log( "going back into history: index state " + String( currentIndex + 1 ) + " of " + String( historyArray.length ) );

			}

		}


		//forward function advances through slide history
		//triggers goToState with updated currentIndex
		function goForward(){

			if( currentIndex + 1 < historyArray.length ){

				flags.ignore = true;
				goToState( ++currentIndex );
				flags.ignore = false;
				console.log( "going forward into the future: index state " + String( currentIndex + 1 ) + " of " + String( historyArray.length )  );

			}

		}


		//grabs the history state at the defined index and attempts to cycle the
		//presentation instance reference to the captured slide
		function goToState( index ){

			var thisState = historyArray[ index ] || null;

			if( thisState ){ console.log( thisState.whichSlide );

				thisState.whichPresentation.cycleTo( thisState.whichSlide );

			}

		}

		//accessor
		return Object.create( {

			get events() 	{ return events; },
			get history() 	{ return historyArray; },
			get flags() 	{ return flags; }

		}, {

			back: {
				readable: false,
				writable: false,
				value: goBack
			},

			capture: {
				readable: false,
				writable: false,
				value: captureState
			},

			forward: {
				readable: false,
				writable: false,
				value: goForward
			}

		} );

	}




	//TouchCoords object: store mouse/touch coords object
	//can be used by multiple objects to track touch locations
	//compatible for both mouse and touch (one touch only) tracking
	function TouchCoords(){

		//object properties
		var data = {
			startX: null,
			startY: null,
			hoverX: null,
			hoverY: null,
			dragX: null,
			dragY: null,
			momentumX: null,
			momentumY: null,
			istouched: false,
			isdragged: false,
			isreleased: false
		},
		ignoreDelay = 100,			// in milliseconds
		ignoreInput = false;


		//works for both touch and mouse events. currently handles only single touch gestures
		//requires original event variable to be passed as an argument
		function captureCoordinates( e ){

			//make sure e is of type Event
			if( e instanceof Event ){


				// 'e' should reference original event if touch event and property exists.
				e = e.originalEvent || e;


				//Do some initial brancing here to ensure that touch events reference proper touch state
				//if touch event, set event reference to first touch item ( e.touches[0] );
				switch( e.type ){

					case 'touchstart':
						e = e.touches[ 0 ];
						e.type = 'touchstart';
						break;

					case 'touchmove':
						e = e.changedTouches[ 0 ];
						e.type = 'touchmove';
						break;

					case 'touchend':
						e = e.changedTouches[ 0 ];
						e.type = 'touchend';
						break;

				}


				//Behavior branching: Do different things when captured based on event type
				switch( e.type ){

					//touchstart/mousedown initial event - gathers initial offset coordinate of event. set istouched flag to true
					case "mousedown":
					case "pointerdown":
					case "touchstart":

						resetCoordinates();
						data.startX = e.clientX || e.pageX;
						data.startY = e.clientY || e.pageY;
						data.istouched = true;
						break;

					//mousemove/touchmove handler - sets relative offset coordinate values for X/Y. set isdragged flag to true
					case "mousemove":
					case "pointermove":
					case "touchmove":

						data.hoverX = e.clientX || e.pageX;
						data.hoverY = e.clientY || e.pageY;

						if( data.istouched ){

							var prevX = data.dragX || 0,
							    prevY = data.dragY || 0;

							data.dragX = - ( data.startX - data.hoverX );
							data.dragY = - ( data.startY - data.hoverY );

							data.momentumX = data.dragX - prevX;
							data.momentumY = data.dragY - prevY;

							//set maximum allowable range of momentum
							data.momentumX = ( Math.abs( data.momentumX ) > 40 ) ? ( Math.abs( data.momentumX ) / data.momentumX ) * 40 : data.momentumX;
							data.momentumY = ( Math.abs( data.momentumY ) > 40 ) ? ( Math.abs( data.momentumY ) / data.momentumY ) * 40 : data.momentumY;

							data.isdragged = true;

						}

						break;

					//mouseup/touchend should behave similarly to mouseout - reset values
					default:
						resetCoordinates();

				}

			}

		}


		//clears all instance keys to null
		function resetCoordinates(){

			//clear data object
			for( property in data ){

				data[ property ] = null;

			}

			//set/remove timed input ignore flag
			ignoreInput = true;
			setTimeout( function(){ ignoreInput = false; }, ignoreDelay );

		}


		//set specific property value
		function setProperty( property, value ){

			if( data.hasOwnProperty( property ) ){

				data[ property ] = value;

			}

		}


		//accessor
		return Object.create(
			{

				get data() { return data; }

			},
			{

				//capture coordinate state
				capture: {
					writable: false,
					configurable: false,
					value: captureCoordinates
				},

				//reset coordinates
				reset: {
					writable: false,
					configurable: false,
					value: resetCoordinates
				},

				//set specific property value
				setProperty: {
					writable: false,
					configurable: false,
					value: setProperty
				}

			}

		);

	}



	//High definition Canvas
	//Use this function to return an object which creates a canvas element
	//with calculated pixel ratio values determined based on browser backing store ratio
	//Prevents blurry canvas rendering cross-browser.
	//use Pixel Ratio property in rendering calculations!
	function createHiFiCanvas( canvasEl, width, height ){


		//canvas, dimensions and pixel ratio calculations
		var canvas = canvasEl || document.createElement( "canvas" ),
		    context = canvas.getContext( '2d' ),
		    pixelRatio = findPixelRatio(),
		    width = width || canvas.width,
		    height = height || canvas.height;


		//set canvas dimensions to accommodate back-store ratio
		canvas.width = width * pixelRatio;
		canvas.height = height * pixelRatio;
		canvas.style.width = width + "px";
		canvas.style.height = height + "px";


		//set base transform state to mirror discovered pixel ratio
		context.setTransform( pixelRatio, 0, 0, pixelRatio, 0, 0 );


		//once context is set, find pixel ratios of backing store
		function findPixelRatio(){

		    	var devicePixelRatio = window.devicePixelRatio || 1,
		    	    backStoreRatio = context.webkitBackingStorePixelRatio ||
			             context.mozBackingStorePixelRatio ||
			             context.msBackingStorePixelRatio ||
			             context.oBackingStorePixelRatio ||
			             context.backingStorePixelRatio || 1;

			return devicePixelRatio / backStoreRatio;

		}


		//accessor
		return Object.create(
			{

				get element() { return canvas; },

				get context() { return context; },

				get ratio() { return pixelRatio; }

			},
			{}

		);

	}




	// EventManager Object
	// attach to an object to set/trigger custom events
	// using EventManager.prototype.attachTo(myobject)
	function EventManager(){


		//stores a dictionary of event listeners
		var listeners = {};


		//iterate through listeners object to check if one exists
		function checkExistingListeners( checktype ){

			return Object.keys( listeners ).some( function( listener ){

				//if( listener == checktype ) return true;
				return listener === checktype;

			} );

		}


		//method used to attach a new listener and associated action to an object.
		function addEventListener( type, action ){

			if( !checkExistingListeners( type ) ){

				listeners[ type ] = [];

			}

			listeners[ type ].push( action );

		}


		//used to trigger a specific event by type/name. dispatching an event
		//will trigger ALL functions associated with the event.
		function dispatchEvent( eventObj ){

			if( listeners[ eventObj.type ] ){

				listeners[ eventObj.type ].forEach( function( action ){

					action = window[ action ] || action || null;

					if( typeof action === 'function' ){

						action.call( this, eventObj.details );

					}

				} );

			}

		}


		//remove an action from an event listener
		//if no action is specified, the entire listener type is removed.
		function removeEventListener( type, action ){

			//error check to make sure listener exists
			if( listeners[ type ] ){

				//if there is an action to remove, remove the specific action from the array
				if( action ){

					listeners[ type ].forEach( function( evt, index ){

						if( evt === action ){

							listeners[ type ].splice( index, 1 );

						}

					} );

				//otherwise if no actions supplied, remove the listener altogether
				} else {

					delete listeners[ type ];

				}

			}

		}


		//accessor
		return  Object.create(

			{},
			{

				addEventListener: {
					writable: false,
					configurable: false,
					value: addEventListener
				},

				dispatchEvent: {
					writable: false,
					configurable: false,
					value: dispatchEvent
				},

				removeEventListener: {
					writable: false,
					configurable: false,
					value: removeEventListener
				}

			}

		);

	}







//NEEDS RENOVATION TO FUNCITON PROPERLY

	//*** SLIDE CACHE OBJECT ***//
	//Cache Object stores information about a page that a developer wishes to keep in sessionStorage.
	//slideID as well as customdata (in object form) and a callback are all stored as stringified JSON within sessionStorage.
	//use the captureState() method, along with custom data and callback as arguments, to manually capture cache points during presentation
	function HistoryCache(){


		var callback = null,						//developer defined callback set by captureState()
		    customdata = {},						//custom data developer might wish to store associated with the slide's current state
		    identifierKey = null,					//sessionStorage key to use
		    sectionID = null,
		    slideID = null;						//presentation active slideID - slideID will load when presentation is initialized



		//capture a history state, requiring reference to a particular presentation object
		//must provide a custom key (project identifier) unique to store the information
		//can store custom data in the history relevant to this state
		//fires callback function - must be a string reference to a global function!
		function captureState( presentationObj, key, customDataObj, userCallback ){

			//normalize this to mean either user-supplied key or PresentationID key
			key = key || identifierKey;

			//required items to proceed state capture
			if( typeof presentationObj == 'object' &&
			    presentationObj.type == "PRESENTATION" &&
			    key ){

				//capture the slide that you are currently on.
				slideID = presentationObj.currentSlide.id;
				sectionID = presentationObj.currentSectionIndex;

				//capture any custom data
				if( typeof customDataObj == 'object' ){

					customdata = customDataObj;

				}

				//capture callback method if one is to be triggered
				if( userCallback &&
				    typeof window[ userCallback ] === 'function'){

					callback = userCallback;

				}

				//throw data into sessionStorage string
				sessionStorage.setItem( key, JSON.stringify( {

					callback: userCallback,
					customdata: customdata,
					identifierKey: key,
					sectionID: sectionID,
					slideID: slideID

				} ) );

			}

		}


		//clears the cache object
		function clearCache(){

			sessionStorage.setItem( identifierKey, '' );
			callback = null;
			customdata = {};
			sectionID = null;
			slideID = null;

		}


		//load a history cache state based on an identifier key
		//looks up sessionStorage using a base key
		function loadState( key ){

			//normalize this to mean either user-supplied key or PresentationID key
			key = key || identifierKey;

			//reference to sessionStorage data string if exists
			var storageString = sessionStorage.getItem( key ),
			    storageData = ( typeof storageString == 'string' && storageString ) ? JSON.parse( storageString ): null;

			//set LS data to equal cache object data
			if( storageData ){

				//fire callback if one exists
				if( window[ callback ] && typeof window[ callback ] == 'function' ){

					window[ callback ]();

				}

				return storageData;

			} else {

				return {};

			}

		}


		//return accessor object
		return Object.create(
			{

				type: 'Cache Object'

			},
			{

				captureState: {
					writable: false,
					configurable: false,
					value: captureState
				},

				clear: {
					writable: false,
					configurable: false,
					value: clearCache

				},

				loadState: {
					writable: false,
					configurable: false,
					value: loadState
				}

			}

		);

	}









	//XHR functions
	//creates a standards compliant and alternate XMLHttpRequest object that will suffice for both safari and IE testing purposes.
	//IE local file protocol typically will result in an automatic load error without additional ActiveXObject controls.
	//ActiveXObject works very similarly to a very basic XMLHttpRequest Object, but seems to load syncronously by default
	function createXMLHttpRequestObject(){

		if( window.XMLHttpRequest ){

			if( window.XMLHttpRequest && window.location.protocol !== 'file:' || window.ActiveXObject === undefined ){

				return new XMLHttpRequest();

			} else {

				try{
					return new ActiveXObject( "MSXML2.XMLHTTP.3.0" );
					//return new ActiveXObject( "Microsoft.XMLHTTP" );

				} catch( e ) {

					console.log( 'no XMLHttpRequest Support for this browser' );
					return null;

				}

			}

		}

	}

	//function that handles firing a callback once the XHR content has loaded - should work for safari/IE
	//NOTE: it would be pertinent to pass 'this' reference to this function via bind/call or else function likely wont work as expected
	function XHRload( loadURL, mimetype, callback ){


		//set a default response type
		mimetype = mimetype || 'plaintext';


		//XHR standards method
		var xhrobj = createXMLHttpRequestObject() || new XMLHttpRequest();
		    xhrobj.open( 'GET', loadURL, true );
		    xhrobj.addEventListener( 'readystatechange', handleStateChange.bind( xhrobj ), false );
		    xhrobj.send( );


		//handles XHR response during state change
		function handleStateChange(){

			if( xhrobj.readyState === 4 ){

				var response = xhrobj.responseText || xhrobj.response || null;
				    response = mimetype === "JSON" ?
					JSON.parse( response ):
					response;

				if( typeof callback === 'function' ){

					callback.call( xhrobj, response );

				}

			}

		}


		//IE11 fix
		//if response is ready immediately, fire with a slight delay to emulate asyncronous load
		//NOTE: ActiveXObject seems to always load resources syncrhonously
		if( xhrobj.responseText ){

			setTimeout( handleStateChange, 10 );

		}

	}







	// DEBUG Window
	//creates an instance of debug in main.js during initial DOMContentLoad
	//access debug window by registering a 'log' event with a message to display
	function DebugWindow(parentEl){

		//properties of the object
		parentEl = parentEl || document.body || null;

		//private variables
		var commentlength = 0,
		    coordinates = TouchCoords();

		//private html element refs
		var wrapper, header, title, close, container;
		var windowwidth, windowheight, parentwidth, parentheight;

		// accessor executing function which creates the necessary
		// markup for the debug elements and attaches them to parentEl.
		// attaches event listeners to internal elements
		( function createMarkup(){

			//create elements and assign basic properties
			wrapper = document.createElement('aside');
			wrapper.className = 'debug-window hidden';
			header = document.createElement('header');
			header.className = 'debug-header';
			title = document.createElement('h1');
			title.innerHTML = 'DEBUG';
			close = document.createElement('div');
			close.className = 'debug-close';
			close.innerHTML = 'x';
			container = document.createElement('div');
			container.className = 'debug-log';


			//append these objects to each other and then to the parentEl
			header.appendChild(title);
			header.appendChild(close);
			wrapper.appendChild(header);
			wrapper.appendChild(container);

		}() );


		//start drag - activated by the window header bar
		function startDrag( e ){
			e.preventDefault();
			coordinates.capture( e );
		}
		//fires when mouse moves- should only function if mouse is down or screen is touched
		function continueDrag( e ){

			var touchdata = coordinates.data;

			if( touchdata.istouched ){
				coordinates.capture( e );

				var oX = touchdata.dragX,
				    oY = touchdata.dragY;

				if( oX + windowwidth < parentwidth && oX >=0 )		wrapper.style.marginLeft = oX + 'px';
				if( oY + windowheight < parentheight && oY >=0 ) 	wrapper.style.marginTop = oY + 'px';
			}

		}
		//fires on touchend/mouseup or mouseout.
		function endDrag( e ){
			coordinates.capture( e );
			coordinates.reset();
		}
		//bind drag and close window events to elements
		function bindListeners(){
			close.addEventListener( 'mouseup', accessor._close, false);
			close.addEventListener( 'touchend', accessor._close, false);
			header.addEventListener( 'mousedown', startDrag, false);
			header.addEventListener( 'touchstart', startDrag, false);
			header.addEventListener( 'mousemove', continueDrag, false);
			header.addEventListener( 'touchmove', continueDrag, false);
			header.addEventListener( 'mouseout', endDrag, false);
			header.addEventListener( 'mouseup', endDrag, false);
			header.addEventListener( 'touchend', endDrag, false);
		}
		//calculate container window and parent El dimensions to prevent dragging window offscreen
		function getElementDimensions(){

			var dimensions = wrapper.getBoundingClientRect();
			var parentdimensions = parentEl.getBoundingClientRect();

			windowwidth = Math.ceil( dimensions.width );
			windowheight = Math.ceil( dimensions.height );
			parentwidth = Math.floor( parentdimensions.width );
			parentheight = Math.floor( parentdimensions.height );

		}


		var accessor = {

			_close: function(){
				wrapper.classList.add( 'hidden' );
				setTimeout( function(){ wrapper.removeAttribute('style'); }, 250);
			},

			_open: function(){
				if( !parentEl ){
					parentEl = parentEl || document.body;
					parentEl.appendChild( wrapper );
					bindListeners();
					getElementDimensions();
				}

				wrapper.classList.remove( 'hidden' );
			},

			log: function(msg){
				var contentwrapper = wrapper.children[1],
				    lineitem = document.createElement( 'p' );
				    lineitem.innerHTML = commentlength +':&nbsp&nbsp&nbsp'+ msg;

				contentwrapper.appendChild( lineitem );
				lineitem.scrollIntoView( false );

				this._open();
				commentlength++;
			},

			clear: function(){
				wrapper.children[0].innerHTML = '';
				commentlength = 0;
			}

		};

		return accessor;
	}



	//sidekick accessor object
	return Object.create(

		{

			get presentation() { return presentation }

		},
		{

		debug: {
			writable: false,
			configurable: false,
			value: DebugWindow()
		},

		cache: {
			writable: false,
			configurable: false,
			value: HistoryCache()
		},

		createEventManager: {
			writable: false,
			configurable: false,
			value: EventManager
		},

		createHiFiCanvas:{
			writable: false,
			configurable: false,
			value: createHiFiCanvas
		},

		createPresentation: {
			writable: false,
			configurable: false,
			value: function( presentationOptions, callback ){
				//determine accessor name
				var name = presentationOptions.presentationName || defaultProjectOptions.presentationName;
				//if name is valid and not already in use, create presentation
				if( name &&
				   !this.presentation[ name ] ){
					this.presentation[ name ] = Presentation( presentationOptions, callback );
				} else {
					console.log( 'presentation "' + name +'" not created: invalid type or presentation name already exists.' );
				}
			}
		},

		load: {
			writable: false,
			configurable: false,
			value: XHRload
		}

	} );

}() );
