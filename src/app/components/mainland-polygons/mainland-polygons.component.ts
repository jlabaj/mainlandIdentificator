import { AfterViewInit, Component, OnInit, signal } from '@angular/core';
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

type CountryMap = Record<string, any>;

@Component({
  selector: 'app-mainland-polygons',
  templateUrl: './mainland-polygons.component.html',
  styleUrls: ['./mainland-polygons.component.scss']
})
export class MainlandPolygonsComponent implements AfterViewInit {
  private map!: L.Map;

  private static CSV_FILE_PATH = '/assets/country-borders.csv';
  private static GEO_JSON_FILE_PATH = '/assets/intersecion.geojson';

  isLoading = signal(true);

  async ngAfterViewInit(): Promise<void> {
    
    const geoJsonDataPromise = this.fetchGeoJson(MainlandPolygonsComponent.GEO_JSON_FILE_PATH).then((response) => {
      return this.mapGeoJson(response);
    });

    const csvDataPromise = this.loadCSV(MainlandPolygonsComponent.CSV_FILE_PATH).then((response) => {
      return this.parseCSV(response);
    });

    Promise.allSettled([geoJsonDataPromise, csvDataPromise]).then(([geoJsonResult, csvResult]) => {
      const csvMapped = csvResult.status === "fulfilled" ? csvResult.value : null;
      const geoJsonMapped = geoJsonResult.status === "fulfilled" ? geoJsonResult.value : null;

      if (csvMapped !== null && geoJsonMapped != null) {
        const {locationData, polygons} = this.checkPointsInsidePolygons(csvMapped, geoJsonMapped);
        
        this.initMap();
        for (let index = 0; index < polygons.length; index++) {
          const polygon = polygons[index];
          L.polygon(polygon, {
            color: 'red',
            weight: 2
          }).addTo(this.map);
          
        }      
        
        this.arrayToCSV(locationData.map(c => {
          return { boundaryId: c.boundaryId, countryName: c.countryName };
        }));
      }
      else {
        console.log('mapping eror!')
      }
    });

  }
  private checkPointsInsidePolygons(csvData: LocationData[], geoJsonData: CountryMap): {locationData:LocationData[], polygons:[number, number][][]} {
    const matchingPolygons: LocationData[] = [];
    const result: [number, number][][] =[];

    for (let index = 0; index < csvData.length; index++) {
      let isPolygonMainland = false;
      let polygon: [number, number][] = [];
      const row = csvData[index];

      const coordinates = row.coordinates.split(':');
      for (let index = 0; index < coordinates.length; index++) {
        const coordinate = coordinates[index];
        const lat = parseFloat(coordinate.split(' ')[1]);
        const lon = parseFloat(coordinate.split(' ')[0]);
        const point = turf.point([lon, lat]);
        polygon.push([lat, lon]);

        if (geoJsonData[row.countryName] && turf.booleanPointInPolygon(point, geoJsonData[row.countryName])) {
          isPolygonMainland = true;
        }
        
      }
      
      if (isPolygonMainland) {
        matchingPolygons.push(row);
        result.push(polygon);
      }

    }
    this.isLoading.set(false)
    return {locationData: matchingPolygons, polygons:result}
    
  }

  private initMap(): void {
    this.map = L.map('map').setView([0, 0], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  async fetchGeoJson(url: string): Promise<GeoJSON.FeatureCollection> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: GeoJSON.FeatureCollection = await response.json();
    return data;
  }

  private mapGeoJson(geoJsonData: any): CountryMap {

    const countryMap: CountryMap = {};

    for (let index = 0; index < geoJsonData.features.length; index++) {
      const feature = geoJsonData.features[index];
      const countryName = feature.properties.NAME_EN;
      const coordiantes = feature.geometry;

      if (countryName) {
        countryMap[countryName] = coordiantes;
      }
    }

    return countryMap;
  }
  private async loadCSV(path: any): Promise<string> {
    try {
      const response = await fetch(path);

      return await response.text();
    } catch (error) {
      console.error('Error loading CSV:', error);
      throw error;
    }
  }

  private parseCSV(csvText: string): LocationData[] {
    const parsedResult = Papa.parse<LocationData>(csvText, {
      header: false,
      skipEmptyLines: true
    });

    return parsedResult.data.map<LocationData>((row: any) => ({
      boundaryId: row[0],
      contryCode: row[1],
      countryName: row[2],
      coordinates: row[3],
    }));
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
}