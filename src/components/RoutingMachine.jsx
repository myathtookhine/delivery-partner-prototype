import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine";
import { useEffect } from "react";

const RoutingMachine = ({ start, end, color, showItinerary }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: color || "#62A7E4", weight: 4 }],
      },
      show: showItinerary,
      addWaypoints: false,
      routeWhileDragging: true,
      draggableWaypoints: true,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null,
    }).addTo(map);

    if (!showItinerary) {
      routingControl.on("routesfound", function () {
        this._container.style.display = "none";
      });
    }

    return () => {
      if (routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end, color, showItinerary]);

  return null;
};

export default RoutingMachine;
