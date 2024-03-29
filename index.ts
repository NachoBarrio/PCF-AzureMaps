import {IInputs, IOutputs} from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
type DataSet = ComponentFramework.PropertyTypes.DataSet;
import * as atlas from "azure-maps-control";
import { TrafficControl } from "./TrafficControl";
import { any, element, array } from "prop-types";
declare var Xrm: any;



export class PointsMap implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private featureCollection: atlas.data.FeatureCollection;

	private map : any;
	private _mapContainer: HTMLDivElement;
	private _menuContainer: HTMLDivElement
	private _divContainer: HTMLDivElement;
	

	private _context: ComponentFramework.Context<IInputs>;
	// Name of entity to use for example Web API calls performed by this control
	private static _entityName: string = "iav_checkin";	  

	private _layrData : any;
	private _datePicked : any = null;
	/**
	 * Empty constructor.
	 */
	constructor()
	{

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		// Add control initialization code
		this._context = context;
		let _map: atlas.Map;
		this._mapContainer = document.createElement('div');
		this._mapContainer.setAttribute("id", "map");
		this._mapContainer.setAttribute("style", "width:100%;min-width:290px;height:97%;margin-top: 3em;");

		this._menuContainer = document.createElement('div');
		this._menuContainer.setAttribute("id", "map");

		this._divContainer = document.createElement('input');
		this._divContainer.setAttribute("id", "datepicker");
		this._divContainer.setAttribute("type", "date");
		this._divContainer.setAttribute("style", "position:absolute;width:10%;min-width:4%;height:3%;");
		var otroThis= this;
		this._divContainer.addEventListener("change",function(e : any){
			var cont = e.target.value;
			otroThis.map.popups.clear();
			otroThis.renderODataRetrieveMultipleExample(otroThis,cont);
		});

		container.append(this._divContainer);
		container.append(this._mapContainer);
		

		
		

		//URL to custom endpoint to fetch Access token
		var url = 'https://adtokens.azurewebsites.net/api/HttpTrigger1?code=dv9Xz4tZQthdufbocOV9RLaaUhQoegXQJSeQQckm6DZyG/1ymppSoQ==';
       
		//Initialize a map instance.
		_map = new atlas.Map('map', {
			view: "Auto",
			zoom: 8,
			renderWorldCopies: false,
			//Add your Azure Maps subscription client ID to the map SDK. Get an Azure Maps client ID at https://azure.com/maps
			authOptions: {
				authType: atlas.AuthenticationType.subscriptionKey,
				subscriptionKey: 'DYJUx1FSacDHw1ts2SuNzmUpPQE3I2rmuIGczsHX2So'
			},
			enableAccessibility: false,
		});
		var thisRef = this;
		_map.events.add('ready', function(this: PointsMap) {
			_map.controls.add([
					new atlas.control.ZoomControl(), 
					new atlas.control.StyleControl(), 
					new TrafficControl({style: 'auto'})
				], 
				{position: atlas.ControlPosition.TopRight
			});		

			thisRef.renderODataRetrieveMultipleExample(thisRef,thisRef._datePicked);
			
		});
		this.map = _map;


		this.featureCollection = 
		{
			"type": "FeatureCollection",
			"features": []
		};

			
	}

	public renderODataRetrieveMultipleExample(thisRef : any, datePicked: any): void {
		let containerClassName: string = "odata_status_container";
		var datefilter = "";
		let queryString: string =
		"?$select=iav_checkinid,iav_name,iav_latitud,iav_longitud,iav_checkinvalido,createdon,_ownerid_value,_owninguser_value";

		if(datePicked != null && datePicked != ""){
			datefilter = "&$filter=createdon le ("+datePicked+"T23:59:59Z) and createdon ge ("+datePicked+"T00:00:00Z)";
		}
		queryString = queryString  + datefilter + "&$orderby=createdon asc";
		thisRef = this;
		this._context.webAPI.retrieveMultipleRecords(PointsMap._entityName,queryString).then
		(
			function (response: any) 
			{
				// Retrieve multiple completed successfully -- retrieve the averageValue 
				

				var pointData = [];
				var lineData = [];
				for (var i = 0; i < response.entities.length; i++) {
					pointData.push(new atlas.data.Feature(new atlas.data.Point([response.entities[i].iav_longitud,response.entities[i].iav_latitud]), {
						title: 'Pin_' + i,
						date: response.entities[i].createdon ? response.entities[i].createdon : "N/A" ,
						id: response.entities[i].iav_checkinid,
						author: response.entities[i]["_ownerid_value@OData.Community.Display.V1.FormattedValue"] ? response.entities[i]["_ownerid_value@OData.Community.Display.V1.FormattedValue"] : "Unknown",
						state: response.entities[i].iav_checkinvalido ? 'marker-green' : 'marker-red'
					}));

					lineData.push([response.entities[i].iav_longitud,response.entities[i].iav_latitud]);
				}
				thisRef.printMap(thisRef,pointData,lineData);
			},
			function (errorResponse: any) 
			{
				console.log(errorResponse);
				// Error handling code here
			}
		);
	}

	public printMap(thisRof : any,pointData : any, lineData : any){
		var _map = thisRof.map;

		//Create a data source and add it to the map.
		// let datasource = new atlas.source.DataSource("ds0", {
		// 	cluster: true,

		// 	//The radius in pixels to cluster points together.
		// 	clusterRadius: 80,
			
			
		// 	clusterProperties: {
		// 		// @ts-ignore
		// 		anomaly: ['+',['get', 'anomaly']],
		// 		// @ts-ignore
		// 		normal: ['+',['get', 'anomaly']]
		// 	}
		// });
		let datasource = new atlas.source.DataSource();
		
		_map.sources.add(datasource);		

			//Create a bubble layer for rendering clustered data points.
		
		_map.imageSprite.createFromTemplate('marker-green', 'marker', 'green', '#fff');
		_map.imageSprite.createFromTemplate('red-circle', 'pin-round', 'red', 'rgba(0,0,0,0)');
		

		//Create a layer to render the individual locations.
		let pinSymbolLayer = new atlas.layer.SymbolLayer(datasource, "sl1", {
			iconOptions: {
					image: ['get', 'state']
					}
			});
		
		//Add the clusterBubbleLayer and two additional layers to the map.
		
		_map.events.add('click', pinSymbolLayer, thisRof.clicked);
		datasource.add(pointData);

		var lineLayer = new atlas.layer.LineLayer(datasource, "ly1", {
			strokeColor: 'DarkOrchid',
			strokeWidth: 3
		})
		
		
		datasource.add(new atlas.data.Feature(new atlas.data.LineString(lineData)));
		debugger;
		//Establecer posición de la camara
		if(pointData.length > 0){
			var swLon = Math.min(pointData[0].geometry.coordinates[0], -3.7004000); 
			var swLat = Math.min(pointData[0].geometry.coordinates[1], 40.4146500); 
			var neLon = Math.max(pointData[0].geometry.coordinates[0], -3.7004000); 
			var neLat = Math.max(pointData[0].geometry.coordinates[1], 40.4146500); 
			_map.setCameraBounds({ 
				bounds: [swLon, swLat, neLon, neLat], 
				padding: 1 
			}); 
			
			
		}
		
		
		

		_map.layers.add([pinSymbolLayer,lineLayer]);

	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		
		// Add code to update control view
		// if(context.parameters.dataSet.loading) {
		// 	return;
		// }

		// if (context.parameters.dataSet.paging.hasNextPage) {
		// 	context.parameters.dataSet.paging.loadNextPage();
		// }
		// else {
		// 	let _map: atlas.Map;
		// 	_map = this.map;
		
		// 	let _locations = context.parameters.dataSet;
		// 	for(let _locationId of _locations.sortedRecordIds) 
		// 	{
		// 		let _longitude = _locations.records[_locationId].getValue("ts_laengdegrad") != null ? _locations.records[_locationId].getFormattedValue("ts_laengdegrad") : "";
		// 		let _latitude = _locations.records[_locationId].getValue("ts_breddegrad") != null ? _locations.records[_locationId].getFormattedValue("ts_breddegrad") : "";

		// 		if(_latitude != "" && _longitude != "") {
		// 			const point1 = new atlas.data.Feature(new atlas.data.Point([_longitude.replace(",",".") as unknown as number, _latitude.replace(",",".") as unknown as number]), {
		// 				"id": _locations.records[_locationId].getRecordId(),
		// 				"name": _locations.records[_locationId].getFormattedValue("ts_lokation"),
		// 				"anomaly": _locations.records[_locationId].getFormattedValue("ts_afvigelse") == "Ja" ? 1 : 0	
		// 			});
		// 			this.featureCollection.features.push(point1);
		// 		}
		// 	}

		
			

		// 	//Create a bubble layer for rendering clustered data points.
		// 	let clusterBubbleLayer = new atlas.layer.BubbleLayer(datasource, "bl0", {
		// 		//Scale the size of the clustered bubble based on the number of points inthe cluster.
		// 		radius: [
		// 		'step',
		// 		['get', 'point_count'],
		// 		20,         //Default of 20 pixel radius.
		// 		50, 30,    //If point_count >= 50, radius is 30 pixels.
		// 		100, 40     //If point_count >= 100, radius is 40 pixels.
		// 		],
		// 		color: [
		// 			'case',
		// 			['==', ['get', 'anomaly'], ['get', 'point_count']],
		// 			'rgba(255,0,0,0.8)',	//Has one or more anomaly
		// 			'rgba(0,170,80,0.8)' //Has no anomaly
		// 		],				
		// 		strokeWidth: 5,/* ['*', ['/', ['get','anomaly'],['get','point_count']], 50], */
		// 		strokeColor: ['case',
		// 			['>', ['get', 'anomaly'], 0], 'red',
		// 			'white'
		// 		],
		// 		filter: ['has', 'point_count'] //Only rendered data points which have a point_count property, which clusters do

		// 	});

		// 	_map.imageSprite.createFromTemplate('marker-green', 'marker', 'green', '#fff');
		// 	_map.imageSprite.createFromTemplate('red-circle', 'pin-round', 'red', 'rgba(0,0,0,0)');

		// 	//Create a symbol layer to render the count of locations in a cluster.
		// 	let clusterSymbolLayer = new atlas.layer.SymbolLayer(datasource, "sl0", {
		// 		iconOptions: {
		// 			image: 'none'
		// 		},
		// 		textOptions: {
		// 			textField: ['concat', ['to-string', ['get', 'point_count_abbreviated']], ' / ', ['to-string', ['get', 'anomaly']]],
		// 			offset: [0, 0.4]
		// 		}
		// 	});

		// 	//Create a layer to render the individual locations.
		// 	let pinSymbolLayer = new atlas.layer.SymbolLayer(datasource, "sl1", {
		// 		iconOptions: {
		// 			image: [
		// 				'case',
		// 				['>=', ['get', 'anomaly'], 1], 'marker-red',
		// 				'marker-green'
		// 			],
		// 		},
		// 		textOptions: {
		// 			textField: ['get', 'name'],
		// 			offset: [0, -2.5],
		// 			color: 'black'
		// 		},
		// 		filter: ['!', ['has', 'point_count']] //Filter out clustered points from this layer.
		// 	})
			
		// 	//Add the clusterBubbleLayer and two additional layers to the map.
		// 	_map.layers.add([clusterBubbleLayer, clusterSymbolLayer, pinSymbolLayer]);
			
		// 	_map.events.add('click', pinSymbolLayer, this.clicked);
			
		// 	//Add points to datasource 
		// 	datasource.add(this.featureCollection);

		// 	this.map = _map;
		// }
	}

	private clicked(e: atlas.MapMouseEvent){
		var content;
		var coordinate : any;
		var popupTemplate = '<div class="customInfobox">{date}</div>';

		let popupContentElement = document.createElement("div");
		popupContentElement.setAttribute("id", "popupid");
		popupContentElement.style.padding = "5px";
		
		

		if (e.shapes && e.shapes.length > 0) {
			if (e.shapes[0] instanceof atlas.Shape && e.shapes[0].getType() === 'Point') {
				
				var properties = e.shapes[0].getProperties();
				// content = popupTemplate.replace(/{date}/g, properties.date);
				 coordinate = e.shapes[0].getCoordinates();

				let popupNameElement = document.createElement("div");
            	popupNameElement.innerText =  properties.date;
				popupContentElement.appendChild(popupNameElement);

				let popupAuthorElement = document.createElement("div");
				popupAuthorElement.innerText = properties.author;
				popupContentElement.appendChild(popupAuthorElement);
				
				let popupLinkElement = document.createElement("a");
				popupLinkElement.innerText = "Navegar a Checkin";
				popupLinkElement.href = "https://loxamhunedesarrollo.crm4.dynamics.com/main.aspx?appid=12f6327b-f0e4-e911-a828-000d3aba2a59&pagetype=entityrecord&etn=iav_checkin&id=" + properties.id as string;
			   	popupContentElement.appendChild(popupLinkElement);
 
				
			//window.location.href = "https://[your instance url]/main.aspx?appid=417c49a8-e6e2-e911-a849-000d3a39e21d&pagetype=entityrecord&etn=ts_trafiksignal&id=" + properties.id as string;
			}
		}

		var popup = new atlas.Popup();

		if (popupContentElement && coordinate) {
			//Populate the popupTemplate with data from the clicked point feature.
			popup.setOptions({
			  //Update the content of the popup.
			  content: popupContentElement,
	  
			  //Update the position of the popup with the symbols coordinate.
			  position: coordinate
			});
	  
			//Open the popup.
			popup.open(e.map);
		  }
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}

}