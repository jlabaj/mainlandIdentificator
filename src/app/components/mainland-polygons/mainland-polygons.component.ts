import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import Papa from 'papaparse';
import { GeometryCollection } from 'geojson';
import { of } from 'rxjs';

interface LocationData {
  boundaryId: string;
  contryCode: string;
  countryName: string;
  coordinates: string;
}


@Component({
  selector: 'app-mainland-polygons',
  templateUrl: './mainland-polygons.component.html',
  styleUrls: ['./mainland-polygons.component.scss']
})
export class MainlandPolygonsComponent implements AfterViewInit {
  private map!: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
    this.loadGeoJson();
  }

  private initMap(): void {
    this.map = L.map('map').setView([11, 103], 6); // Centered near the coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadGeoJson(): void {
    // Load GeoJSON polygons
    fetch('/assets/ne_110m_land.json')
      .then(response => response.json())
      .then(geoJsonData => {
        this.loadCSV(geoJsonData);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }

  private loadCSV(geoJsonData: any): void {
    // Load CSV file
    fetch('/assets/country-borders.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse<LocationData>(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (result) => {
            const parsedData: LocationData[] = result.data.map<LocationData>((row: any) => ({
              boundaryId: row[0],
              contryCode: row[1],
              countryName: row[2],
              coordinates: row[3],
            }));

            this.checkPointsInsidePolygons(parsedData, geoJsonData);

          }
        });
      })
      .catch(error => console.error('Error loading CSV:', error));
  }

  private arrayToCSV<T extends Record<string, any>>(data: T[], filename: string = "mainlandPolygonIds.csv"): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(",") + "\n";
    const rows = data
        .map(obj => Object.values(obj).map(value => `"${value}"`).join(","))
        .join("\n");

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

  private checkPointsInsidePolygons(csvData: LocationData[], geoJsonData: GeometryCollection): void {
    const matchingPolygons: LocationData[] = [];

    for (let index = 0; index < csvData.length; index++) {
      let isPolygonIsland = false;
      let polygon:[number, number][] = [];
      csvData[index].coordinates.split(':').forEach(coordinates => {
        const lat = parseFloat(coordinates.split(' ')[1]);
        const lon = parseFloat(coordinates.split(' ')[0]);
        const point = turf.point([lon, lat]);
        polygon.push([lat, lon])

        for (let index = 0; index < geoJsonData.geometries.length; index++) {
          if (turf.booleanPointInPolygon(point, geoJsonData.geometries[index] as any)) {
            isPolygonIsland = true;
          }          
        }
      })
      if (isPolygonIsland) {
        matchingPolygons.push(csvData[index]);
        L.polygon(polygon, {
          color: 'red',
          weight: 2
        }).addTo(this.map);
        polygon = [];
      }

    }
    this.arrayToCSV(matchingPolygons.map(c=> {
      return  { boundaryId: c.boundaryId, countryName:c.countryName };
    }));
  }
}