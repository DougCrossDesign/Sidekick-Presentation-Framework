//Description: Function to track if CLM Asset has been opened in Preview Mode without an Account Call 
//             Utilize the Windows DOM EventListener to execute function chain. 
//             Write back to CLM_Tracker__c custom object.
//             Would be nice if Veeva had ability to capture "beforeunload" event
//Date:  March 10, 2014
//Author: Konstantine Tsimberg; Janssen Pharmaceuticals




//Updated: Stephen Seator; MMS Contractor
//Date:    6/25/2014
//Allows for more convenient project inclusion while developing on desktop platform - Provides namespace for tracker script to execute




//create namespace to execute our tracking function within
( function clmTrackerInit(){


	//main veeva query object creation. this allows us to send queries through clm's API with device dependency.	
	var queryVeeva = (window.VeevaQuery) ? new VeevaQuery() : null;
	
	
	//execute tracker when window has loaded - script should be content independent so this should be safe
	window.addEventListener('load', function(){
		
		/* DESKTOP-FRIENDLY method - using veevaquery.js to submit query to API */
		//test to see if our wrapper function exists to allow safe desktop testing (iPad execution only)
		if( queryVeeva ){
			
			//create query object variables
			var clmQueryObject = {
				AccountId: {
					object: 'Account',
					field: 'ID',
					bypass: true
				},
				CLM_Presentation_ID__c: {
					object: 'Presentation',
					field: 'ID'
				},
				CLM_Presentation_Name__c: {
					object: 'Presentation',
					field: 'Name'
				},
				KeyMessageId__c: {
					object: 'KeyMessage',
					field: 'ID'
				},
				CLM_Key_Msg__c: {
					object: 'KeyMessage',
					field: 'Name'
				},
				CLM_User_ID__c: {
					object: 'User',
					field: 'ID'
				},
				CLM_User_Name__c: {
					object: 'User',
					field: 'Name'
				}
			}
			var clmQueryResults = {};
			
			
			//begin our query
			queryVeeva.query( clmQueryObject, clmQueryResults, function(){
				
				/* CALLBACK -- results have already posted to results object */
				//only track anonymous info if current object does not have account association
				if( !clmQueryResults.AccountId ){
					
					//create clm record from results collection object
					com.veeva.clm.createRecord( "CLM_Tracker__c", clmQueryResults );
				}
				
			} );
			
		/* DEFAULT METHOD - use query chain to track anonymous users */
		//if no wrapper object exists, use the default non-desktop-safe method using 'suggested' function chain method.
		} else {
			
			//create our tracker object to store queries
			var clmObject = {
				CLM_Presentation_ID__c : null,
				CLM_Presentation_Name__c : null,
				CLM_Key_Msg__c : null,
				CLM_User_ID__c : null,
				CLM_User_Name__c : null,
				KeyMessageId__c : null
			};
	
			//function chain beginning
			( function fnFetchCLMData() {
				//test for if exists Account Object
				com.veeva.clm.getDataForCurrentObject("Account", "ID", getCLMobj );	 
			} )(); 
			
			function getCLMobj() {
				if ( !result.success ) {
					//Account does not exist, CLM in Preview Mode, continue function chain.
					com.veeva.clm.getDataForCurrentObject("Presentation", "ID", getCLMID );
				}  //if result = true, do nothing since account call is initiated.
			}
			
			function getCLMID(result) {
				 //global object assignment Presentation ID
				 clmObject.CLM_Presentation_ID__c = result.Presentation.ID;
			     
				 //continue clm library chain
				 com.veeva.clm.getDataForCurrentObject("Presentation", "Name", getCLMName);
			}
			
			function getCLMName(result) {
			     //global object assignment Presentation ID
				 clmObject.CLM_Presentation_Name__c = result.Presentation.Name;
			   
				 //continue clm library chain
				 com.veeva.clm.getDataForCurrentObject("KeyMessage", "ID", getKeyMsgID);
			}
			
			function getKeyMsgID(result) {
				//global object variable assignment for User ID
				clmObject.KeyMessageId__c = result.KeyMessage.ID;
				
			    //continue clm library chain
				com.veeva.clm.getDataForCurrentObject("KeyMessage", "Name", getKeyMsgName );
			
			}
			
			function getKeyMsgName(result) {
				//global object variable assignment for User ID
				clmObject.CLM_Key_Msg__c = result.KeyMessage.Name;
			    //continue clm library chain
				com.veeva.clm.getDataForCurrentObject("User", "ID", getUserID );
			
			}

			function getUserID(result) {
			     //global object assignment Presentation ID
				 clmObject.CLM_User_ID__c = result.User.ID;
			     
				 //continue clm library chain
				 com.veeva.clm.getDataForCurrentObject("User", "Name", getUserName);
			}
			
			function getUserName(result){
				//global object variable assignment for KeyMessage ID
				clmObject.CLM_User_Name__c = result.User.Name;
				
				//continue clm library chain
				com.veeva.clm.createRecord("CLM_Tracker__c", clmObject, reportResults);
			}
			
			function reportResults(result){
				//used for error checking troubleshooting. 
				/*
					for(var item in clmObject){
						alert(clmObject[item]);
					}
				*/
			}
		}
		
	}, false );
	
}() );

//window event listener triggers object capture chain on page load
//window.addEventListener('load', fnFetchCLMData, false);


