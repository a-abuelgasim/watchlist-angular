import { Component, ElementRef, ViewChild } from '@angular/core';
import { INVALID_KEY_ERROR, TMDBService } from '../../services/video/tmdb.service';
import { catchError, of, tap } from 'rxjs';


export const API_KEY_MESSAGE = `Watchy is in demo mode, so you can only search for movies and TV shows from the Marvel Cinematic Universe. To search for other movies and TV shows you'll need to get a <a href="https://developer.themoviedb.org/reference/intro/getting-started" target="_blank">TMDB API key</a> and add it to Watchy's settings.`;
export const LIGHT_THEME_CLASS = 'light-theme';
export const LIGHT_THEME_LS_KEY = 'lightTheme';


const DEFAULT_API_KEY_ERROR_MSG = 'Sorry, there was an error.';
const INVALID_API_KEY_ERROR_MSG = 'The API key provided was invalid.';


@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsViewComponent {
	addAPIKeyError: string | null = null;
	apiKeyMsg = API_KEY_MESSAGE;
  canSubmit = false;
  lightTheme: boolean;


  @ViewChild('addAPIKeyDialog') addAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('apiKeyInput') input!: ElementRef<HTMLInputElement>;
  @ViewChild('deleteAPIKeyDialog') deleteAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('lightThemeCheckbox') checkbox!: ElementRef<HTMLInputElement>;


  get addAPIKeyDialogEl() { return this.addAPIKeyDialog.nativeElement }
	get apiKey() { return this.tmdbs.apiKey }
  get deleteAPIKeyDialogEl() { return this.deleteAPIKeyDialog.nativeElement }
  get inputEl() { return this.input?.nativeElement }


  constructor(private tmdbs: TMDBService) {
    this.lightTheme = document.body.classList.contains(LIGHT_THEME_CLASS);
  }


  apiKeySubmitHandler() {
		this.tmdbs
			.updateAPIKey(this.inputEl.value)
			.pipe(
				tap(_ => {
					this.addAPIKeyError = null;
					this.addAPIKeyDialogEl.close();
				}),
				catchError((err) => {
					const invalidAPIKey = err == INVALID_KEY_ERROR;
					this.addAPIKeyError = invalidAPIKey ? INVALID_API_KEY_ERROR_MSG :	DEFAULT_API_KEY_ERROR_MSG;
					if (!invalidAPIKey) {
						console.error(err);
					}
					return of(null);
				})
			)
			.subscribe(() => this.canSubmit = false);
  }

	addAPIKeyInputHandler() {
		this.canSubmit = this.inputEl.value != this.apiKey;
	}


  colorThemeChangeHandler() {
    localStorage.setItem(LIGHT_THEME_LS_KEY, this.lightTheme ? 'true' : 'false');
    document.body.classList.toggle(LIGHT_THEME_CLASS);
  }


	deleteAPIKey() {
		this.tmdbs.updateAPIKey(null);
		this.deleteAPIKeyDialogEl.close();
	}


	showAddAPIKeyDialog() {
		this.addAPIKeyDialogEl.showModal();
		this.addAPIKeyDialogEl.focus();
	}
}
