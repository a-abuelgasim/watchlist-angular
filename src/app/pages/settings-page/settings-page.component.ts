import { Component, ElementRef, ViewChild } from '@angular/core';
import { TMDBService } from '../../services/video/tmdb.service';


export const API_KEY_MESSAGE = `Watchy is in demo mode, so you can only search for movies and TV shows from the Marvel Cinematic Universe. To search for other movies and TV shows you'll need to get a <a href="https://developer.themoviedb.org/reference/intro/getting-started" target="_blank">TMDB API key</a> and add it Watchy in the settings.`;
export const LIGHT_THEME_CLASS = 'light-theme';
export const LIGHT_THEME_LS_KEY = 'lightTheme';


@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsViewComponent {
  addAPIKeyError = false;
	apiKeyMsg = API_KEY_MESSAGE;
  canSubmit = true;
  lightTheme: boolean;


  @ViewChild('addAPIKeyDialog') addAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('apiKeyInput') input!: ElementRef<HTMLInputElement>;
  @ViewChild('deleteAPIKeyDialog') deleteAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('lightThemeCheckbox') checkbox!: ElementRef<HTMLInputElement>;


  get addAPIKeyDialogEl() { return this.addAPIKeyDialog.nativeElement }
	get apiKey() {return this.tmdbs.apiKey }
  get deleteAPIKeyDialogEl() { return this.deleteAPIKeyDialog.nativeElement }
  get inputEl() { return this.input?.nativeElement }


  constructor(private tmdbs: TMDBService) {
    this.lightTheme = document.body.classList.contains(LIGHT_THEME_CLASS);
  }


  apiKeySubmitHandler() {
    this.canSubmit = false;

    try {
      this.tmdbs.apiKey = this.inputEl.value;
      this.addAPIKeyDialogEl.close();
    } catch(err) {
      this.addAPIKeyError = true;
      console.error(err);
    } finally {
      this.canSubmit = true;
    }
  }


  colorThemeChangeHandler() {
    localStorage.setItem(LIGHT_THEME_LS_KEY, this.lightTheme ? 'true' : 'false');
    document.body.classList.toggle(LIGHT_THEME_CLASS);
  }


	deleteAPIKey() {
		this.tmdbs.apiKey = null;
		this.deleteAPIKeyDialogEl.close();
	}


	showAddAPIKeyDialog() {
		this.addAPIKeyDialogEl.showModal();
		this.addAPIKeyDialogEl.focus();
	}
}
