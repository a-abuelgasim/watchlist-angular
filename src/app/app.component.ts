import { Component } from '@angular/core';
import { LIGHT_THEME_LS_KEY, LIGHT_THEME_CLASS } from './pages/settings-page/settings-page.component';


export const APP_NAME = 'Watchy';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor() {
		const lightThemeLSVal = localStorage.getItem(LIGHT_THEME_LS_KEY);
    if (lightThemeLSVal == 'true') document.body.classList.add(LIGHT_THEME_CLASS);
  }
}
