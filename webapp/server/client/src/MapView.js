import React, { Component } from 'react'
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import Street from './Street'
import { Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import ReactImageMagnify from 'react-image-magnify';
import './MapView.css'

type State = {
  lat: number,
  lng: number,
  zoom: number,
  img: string
}

class MapView extends Component {
    constructor(){
        super();
        this.locations = {
            "boulder": {
                latLong: [40.0150, -105.270546],
                zoom: 14
            },
            "denver": {
                latLong: [39.742043, -104.991531],
                zoom: 11
            },
            "erie": {
                latLong: [40.05026, -105.049980],
                zoom: 14
            },
            "broomfield": {
                latLong: [39.920540, -105.086647],
                zoom: 13
            }
        }
        this.state = {
            markers: [
                {
                    types: ["fireHydrant","streetLight"],
                    location: {
                        city: "Boulder",
                        latLong: [40.016869, -105.279617]
                    },
                    visible: true,
                },
                {
                    types: ["streetLight"],
                    location: {
                        city: "Boulder",
                        latLong: [40.017924, -105.271966]
                    },
                    visible: true,
                },
                {
                    types: ["streetLight"],
                    location: {
                        city: "Boulder",
                        latLong: [40.024267, -105.270653]
                    },
                    visible: true,
                },
                {
                    types: ["stopSign", "stopSign"],
                    location: {
                        city: "Boulder",
                        latLong: [40.023007, -105.26653]
                    },
                    visible: true,
                },
                {
                    types: ["stopSign"],
                    location: {
                        city: "Denver",
                        latLong: [39.742043, -104.991531]
                    },
                    visible: true,
                },
                {
                    types: ["stopSign"],
                    location: {
                        city: "Denver",
                        latLong: [39.622043, -104.971531]
                    },
                    visible: true,
                },
                {
                    types: ["streetLight"],
                    location: {
                        city: "Denver",
                        latLong: [39.662043, -104.961531]
                    },
                    visible: true,
                },
                {
                    types: ["fireHydrant"],
                    location: {
                        city: "Denver",
                        latLong: [39.68, -104.981531]
                    },
                    visible: true,
                }          
            ],
            zoom: 14,
            img: "sample_image.jpg"
        }
    }
    componentDidMount() {
        this.forceUpdate()
    }

    buildMarkerList() {
        var markers = this.state.markers; 
        var selectedOptions = this.props.selected;
        var city = this.props.city; 
        var img = this.state.img;
        var i = new Image();
        i.src = this.state.img;
        var wid = i.width;
        var hei = i.height;
        var visibleMarkers = [];
        var cit = this.locations[city];
        const newString = (fullStr, str, types) => {
            var english = {'fireHydrant':'Fire Hydrant', 'streetLight':'Stop Light', 'stopSign':'Stop Sign'};
            var len = types.filter(t => t === str).length;
            var retStr = fullStr + ", " + len + " " + english[str];
            if (len > 1) retStr += "s";
            return retStr;
        };
        const getNames = (types) => {
            var x = new Set(types);
            var fullStr = ""
            x.forEach(s => fullStr = newString(fullStr, s, types))
            console.log(fullStr)
            return(fullStr.substring(2));
        };
                                    
        markers.forEach(function(marker, i){
            var long = marker.location.latLong[1];
            var lat = marker.location.latLong[0];
            var conditional = marker.types.filter(t => selectedOptions.includes(t)).length > 0
            if (conditional && Math.abs(lat-cit.latLong[0]) < 0.15 && Math.abs(long-cit.latLong[1]) < 0.15){
                visibleMarkers.push(
                    <Marker position={marker.location.latLong} key={i} title={marker.type}>
                        <Popup className="popup">
                            <p className="centered">    
                                <ReactImageMagnify{...{
                                    smallImage:{
                                        width: 192,
                                        height: 192*hei/wid,
                                        src: img,
                                        isFluidWidth: true
                                    }, largeImage:{
                                        src: img,
                                        width: 1024,
                                        height: 1024*hei/wid
                                    }, enlargedImageContainerStyle:{
                                        "border-width":"4px",
                                        "border-radius":"4px",
                                        "border-color":"#555555aa"
                                    }, enlargedImageContainerDimensions:{
                                        width: '200%',
                                        height: '200%'
                                    }
                                }} />
                            </p>
                            <p>Identified Objects: {getNames(marker.types)}</p>
                            <p/>
                            <p>{"Location: " + lat + ", " + long}</p>
                        </Popup>
                    </Marker>
                );
            }
        });
        return visibleMarkers;
    }

    render() {
        var city = this.props.city; 
        const position = this.locations[city].latLong
        const zoom = this.locations[city].zoom
        var markers = this.buildMarkerList();
        return (
          <div>
            <Route exact path="/" render={()=>
                <div className="shadow p-3 mb-5 bg-white rounded">
                    <Map id='map' center={position} zoom={zoom}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {markers}
                    </Map>
                </div>
            }/>
            <Route path="/street" render={()=>
              <Street image={this.state.img}/>
            } />
          </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selected: state.filter.selected, //selected is the prop for this component, mapped to the state.dropdown.selected prop in the redux store
        city: state.location.city, 
        markers: state.markers
    }
}
const mapDispatchToProps = (dispatch) => {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MapView);