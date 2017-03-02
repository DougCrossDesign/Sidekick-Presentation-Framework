//Query object to ping veeva in a way where you do not have to write painful function chains
//define your query object as a literal, where the key is the property accessor's name,
//the keys 'object' property is the Salesforce object name to query ( must fall within getDataForCurrentRecord's accepted types ),
//and the keys 'field' property is the Salesforce field name to query
function VeevaQuery(){

	var collectionObj = {},
	    keyIndex = 0;

	//private query function utilized by public sendVeevaQuery method to call com.veeva.clm library function getDataForCurrentObject
	function clmQueryChain( queryobj, callback ){
		

		//method vars - grab reference to queryobj keys and the current key based on keyIndex
		var keys = Object.keys( queryobj ),
		    thiskey = keys[ keyIndex ],
		    CRMobj = queryobj[ thiskey ].object,
		    CRMobjField = queryobj[ thiskey ].field,
		    processCallback = queryobj[ thiskey ].callback || null;
		    bypassFlag = queryobj[ thiskey ].bypass || false;
		    		

		//iRep Query (requires CLM library js file)
		com.veeva.clm.getDataForCurrentObject( CRMobj, CRMobjField, function( result ){
			
			//if response success, continue with chain
			if( result.success || bypassFlag ){
				
				//assign the collection object field to the queried result
				collectionObj[ thiskey ] = ( result.success ) ? result[ CRMobj ][ CRMobjField ] : null;
				
				//if this query step has a callback, execute that now
				if( typeof processCallback === 'function' ){

					processCallback();

				}

				//recursion test - if there are more keys left to iterate, increment index and recurse
				if( ++keyIndex < keys.length ){

					clmQueryChain( queryobj, callback );

				//if no more properties to query in the chain, fire callback method
				} else {

					//callback result
					triggerCallback( callback, { success: true, object: collectionObj } );
					
					//reset private vars for next query
					keyIndex = 0;
					collectionObj = {};

				}

			}
			
			//else send developer error message at which query step has failed
			else {

				triggerCallback( callback, { success: false } );

				console.log( 'Veeva query of object: "'+queryobj[ thiskey ].object+'" at field: "'+queryobj[ thiskey ].field+'" has failed' );
			
			}

			//callback trigger 
			function triggerCallback( callback, result ){

				if( typeof callback === 'function' ){

					callback( result );

				}

			}
			
		} );

	}


	//use this method to pass along a query object and collection object to pass to clm library
	function queryCurrentObject( queryobj, callback ){

		//only attempt to access veeva object if it exists
		if( typeof com.veeva.clm === 'object' && detect_iPad() ){

			clmQueryChain( queryobj, callback );

		//conditions fail (likely on desktop) - callback with false success
		} else {
		
			if( typeof callback === 'function' ){ 

				callback( { success: false } );

			}

		}

	}

	//browser sniffing
	function detect_iPad(){

		//detect browser agent
		//code source : ed from previous MxEngage projects
		var ua = navigator.userAgent;
		var isiPad = /iPad/i.test( ua ) || /iPhone/i.test( ua ) || null;		//note this will need to be changed for windows8 to function
		//return a boolean result based on isiPad result
		return Boolean( isiPad );

	}

	return {

		query : queryCurrentObject

	}	
	
}