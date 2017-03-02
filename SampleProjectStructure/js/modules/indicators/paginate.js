( Paginate = function(){


	//plugin variables
	var collection = {},

	//default pagination options
	//displayAs: 'tabs' || 'numerals'
	    defaultPaginationOptions = {
	    		displayAs: "tabs",
	    		touchable: true,
	    		separatorContent : "/"
	    };


	//Pagination object
	function Pagination( targetEl, options ){
	

		//private vars
		var wrapper = ( typeof targetEl == 'string' ) ? document.getElementById( targetEl ) : targetEl,
		    size,
		    tabs,
		    currentIndex;


		//update defaultOptions
		for( property in defaultPaginationOptions ){

			options[ property ] = options.hasOwnProperty( property ) ? options[ property ] : defaultPaginationOptions[ property ];

		}


		//build tabcollection array then return them
		//based on howmany tabs to create
		function buildTabs( howmany ){

			var tabcollection = [];	

			for( var i = 0; i < howmany; i++ ){

				tabcollection.push( PaginationTab( document.createElement( 'li' ), i ) );

			}

			return tabcollection;

		}


		//select a tab in the array via index
		function selectTab( whichIndex ){

			switch( options.displayAs ){

				case "numerals" :
					wrapper.innerHTML = '';
					refreshNumbers( whichIndex );
					break;

				default : 
					tabs.forEach( function( tab ){

						if( tab.wrapper != tabs[ whichIndex ] ){

							tab.setStatus( 'off' );

						}

					} );

					tabs[ whichIndex ].setStatus( 'on' );
					break;

			}

		}


		//refreshes the displayed tab content in the wrapper
		function refreshDisplay( howMany, startIndex ){


			//make sure these have some sort of value
			var startIndex = startIndex || 0;
			    size = howMany || 0;


			//clear content in wrapper
			wrapper.innerHTML = '';


			//conditional display update based on displayAs property
			switch( options.displayAs ){

				case "numerals" :
					refreshNumbers( startIndex );
					break;

				default :
					refreshTabs( startIndex );

			}

		}


		//refreshes the numeric display of which slide is showing
		//shows index as numerator, size of Pagination object as denominator
		function refreshNumbers( index ){

			var tabwrapper = document.createElement( 'div' ),
			    numerator = document.createElement( 'span' ),
			    denominator = document.createElement( 'span' ),
			    separator = document.createElement( 'span' );

			numerator.className = "slide-index";
			separator.className = "separator";
			denominator.className = "slide-total";

			numerator.innerHTML = Number( index + 1 );
			separator.innerHTML = options.separatorContent;
			denominator.innerHTML = size;

			tabwrapper.appendChild( numerator );
			tabwrapper.appendChild( separator );
			tabwrapper.appendChild( denominator );

			wrapper.appendChild( tabwrapper );
			
		}


		//refresh the number of tabs to display
		//requires a tab count and an optional startIndex
		function refreshTabs( startIndex ){

			var tabwrapper = document.createElement('ul');
			  
			tabs = buildTabs( size ); 
			tabs.forEach( function( tab ){
				tabwrapper.appendChild( tab.wrapper );	
			} );
			
			wrapper.appendChild( tabwrapper );
			
			selectTab( startIndex );

		}



		//return pagination accessor
		return Object.create(

			{

				get tabs() { return tabs; },
				get wrapper() { return wrapper; }

			},
			{

				select : {
					writable: false,
					configurable: false,
					value: selectTab
				},

				refresh : {
					writable: false,
					configurable: false,
					value: refreshDisplay
				}

			}

		);
		
	}



	//PaginationTab object
	function PaginationTab( el, index ){
		

		//instance private variables
		var wrapper = typeof el=='object' ? el : document.getElementById( el ) || null,
		    index = index,
		    status = [ "off" ],
		    statusDict = {
				off : 'off',
				on : 'on',
				highlight : 'hilight'
		    };


		//set the status of the tab
		function setStatus( newStatus, action ){

			action = action || "replace";
				
			switch( action ){

				case "add" :
					status.push( newStatus );
					wrapper.classList.add( statusDict[ newStatus ] );
					break;

				case "replace" :
					status.forEach( function( thisstatus ){
						wrapper.classList.remove( statusDict[ thisstatus ] );	
					} );
					status = [ newStatus ];
					wrapper.classList.add( statusDict[ newStatus ] );
					break;

				default :
					var newarray = [];

					status.forEach( function( thisstatus, index ){
						if( thisstatus != newStatus ){
							newarray.push( thisstatus );
						}
						wrapper.classList.remove( statusDict[ thisstatus ] );
					});

					status = newarray.length ? newarray : [ 'off' ];
					break;

			}
			
		}


		//tab instance accessor 
		return Object.create( 

			{
				//status getter/setter
				get status() { return status; },
				set status( value ) { status = value; },
				//get index
				get index() { return index; },
				//wrapper getter
				get wrapper() { return wrapper; }

			},
			{

				//set page tab status, sets css class of the appropriate element
				setStatus : {
					writable: false,
					configurable: false,
					value: setStatus
				}

			} 

		);

	}



	//create a new tabbed collection - adds Pagination instance to the collection object
	//uses the setName as the accessing property
	function addSetToCollection( setName, wrapper, options ){

		if( setName && wrapper ){

			collection[ setName ] = Pagination( wrapper, options );
			return collection[ setName ];

		}

	}


	//plugin instance accessor
	return Object.create( 

		{

			get collection() { return collection; }

		}, 
		{

			addSet : {
				writable : false,
				configurable : false,
				value : addSetToCollection
				
			}
			
		} 

	);

}() );
