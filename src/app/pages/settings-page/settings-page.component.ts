import { Component, ElementRef, ViewChild } from '@angular/core';
import { TMDBService } from '../../services/video/tmdb.service';


export const API_KEY_MESSAGE = `To get the most out of this app you'll need a <a href="https://developer.themoviedb.org/reference/intro/getting-started" target="_blank">TMDB API key</a> so you can search for any movie or TV show. Without a key you'll only be able to search through a limited set of Marvel Cinematic Universe content.`;
export const LIGHT_THEME_CLASS = 'light-theme';
export const LIGHT_THEME_LS_KEY = 'lightTheme';


@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsViewComponent {
  apiKey = this.tmdbs.apiKey;
	apiKeyMsg = API_KEY_MESSAGE;
  canSubmit = true;
  lightTheme: boolean;
  error = false;


  @ViewChild('lightThemeCheckbox') checkbox!: ElementRef<HTMLInputElement>;
  @ViewChild('apiKeyDialog') dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('apiKeyInput') input!: ElementRef<HTMLInputElement>;


  get dialogEl() { return this.dialog.nativeElement }
  get inputEl() { return this.input?.nativeElement }


  constructor(private tmdbs: TMDBService) {
    this.lightTheme = document.body.classList.contains(LIGHT_THEME_CLASS);
  }


  colorThemeChangeHandler() {
    localStorage.setItem(LIGHT_THEME_LS_KEY, this.lightTheme ? 'true' : 'false');
    document.body.classList.toggle(LIGHT_THEME_CLASS);
  }


	showDialog() {
		this.dialogEl.showModal();
		this.dialogEl.focus();
	}


  apiKeySubmitHandler() {
    this.canSubmit = false;

    try {
      this.tmdbs.apiKey = this.inputEl.value;
      this.apiKey = this.inputEl.value;
      this.dialogEl.close();
    } catch(err) {
      this.error = true;
      console.error(err);
    } finally {
      this.canSubmit = true;
    }
  }
}
