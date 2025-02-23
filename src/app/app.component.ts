import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainlandPolygonsComponent } from './components/mainland-polygons/mainland-polygons.component';

@Component({
  imports: [RouterModule, MainlandPolygonsComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'mainlandidentificator';
}
