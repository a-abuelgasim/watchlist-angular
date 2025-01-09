import { Component, ElementRef, ViewChild } from '@angular/core';
import { INVALID_KEY_ERROR, TMDBService } from '../../services/video/tmdb.service';
import { catchError, of, tap } from 'rxjs';
import { db, DEXIE_EXPORT_IMPORT_FORMAT_VERSION, LIBRARY_EXPORTED_FILE_NAME } from '../../db/db';
import { APP_NAME } from '../../app.component';
import { peakImportFile } from 'dexie-export-import';


export const API_KEY_MSG = `Watchy is in demo mode, so you can only search for movies and TV shows from the Marvel Cinematic Universe. To search for other movies and TV shows you'll need to get a <a href="https://developer.themoviedb.org/reference/intro/getting-started" target="_blank">TMDB API key</a> and add it to Watchy's settings.`;
export const LIGHT_THEME_CLASS = 'light-theme';
export const LIGHT_THEME_LS_KEY = 'lightTheme';

const RETRY_MSG = 'Please try again';

const DEFAULT_API_KEY_ERR_MSG = 'Sorry, there was an error adding this API key. ${RETRY_MSG}.';
const INCOMPATIBLE_LIBRARY_ERR_MSG = 'This library is not compatible.';
const INVALID_API_KEY_ERR_MSG = 'The API key provided is invalid.';


@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsViewComponent {
	addAPIKeyError: string | null = null;
	apiKeyMsg = API_KEY_MSG;
	appName = APP_NAME;
  canSubmit = false;
	dropAreaActive = false;
	libraryFileToImport: File | null = null;
  lightTheme: boolean;


  @ViewChild('addAPIKeyDialog') addAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('apiKeyInput') apiKeyInput!: ElementRef<HTMLInputElement>;
  @ViewChild('deleteAPIKeyDialog') deleteAPIKeyDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('deleteLibraryDialog') deleteLibraryDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('importLibraryDialog') importLibraryDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('libraryFileInput') libraryFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('lightThemeCheckbox') checkbox!: ElementRef<HTMLInputElement>;


	get apiKey() { return this.tmdbs.apiKey }
  get addAPIKeyDialogEl() { return this.addAPIKeyDialog.nativeElement }
  get apiKeyInputEl() { return this.apiKeyInput?.nativeElement }
  get deleteAPIKeyDialogEl() { return this.deleteAPIKeyDialog.nativeElement }
  get deleteLibraryDialogEl() { return this.deleteLibraryDialog.nativeElement }
  get importLibraryDialogEl() { return this.importLibraryDialog.nativeElement }
  get libraryFileInputEl() { return this.libraryFileInput?.nativeElement }


  constructor(private tmdbs: TMDBService) {
    this.lightTheme = document.body.classList.contains(LIGHT_THEME_CLASS);
  }


  apiKeySubmitHandler() {
		this.tmdbs
			.updateAPIKey(this.apiKeyInputEl.value)
			.pipe(
				tap(_ => {
					this.addAPIKeyError = null;
					this.addAPIKeyDialogEl.close();
				}),
				catchError((err) => {
					const invalidAPIKey = err == INVALID_KEY_ERROR;
					this.addAPIKeyError = invalidAPIKey ? INVALID_API_KEY_ERR_MSG :	DEFAULT_API_KEY_ERR_MSG;
					if (!invalidAPIKey) {
						console.error(err);
					}
					return of(null);
				})
			)
			.subscribe(() => this.canSubmit = false);
  }


	addAPIKeyInputHandler() {
		this.canSubmit = this.apiKeyInputEl.value != this.apiKey;
	}


  colorThemeChangeHandler() {
    localStorage.setItem(LIGHT_THEME_LS_KEY, this.lightTheme ? 'true' : 'false');
    document.body.classList.toggle(LIGHT_THEME_CLASS);
  }


	deleteAPIKey() {
		this.tmdbs.updateAPIKey(null);
		this.deleteAPIKeyDialogEl.close();
	}


	async deleteLibrary() {
		try {
			await db.reset();
		} catch (error) {
			console.error(error);
			return;
		}

		this.deleteLibraryDialogEl.close();
	}


	async exportLibrary() {
		try {
			const blob = await db.export();
			const fileURL = URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			downloadLink.download = LIBRARY_EXPORTED_FILE_NAME;
			downloadLink.href = fileURL;
			document.body.appendChild(downloadLink);
			downloadLink.click();
			URL.revokeObjectURL(fileURL);
		} catch (error) {
			console.error(error);
		}
	}


	async importLibrary() {
		if (!this.libraryFileToImport) return;

		try {
			// if file name doesn't match pattern, or is not a Dexie exported file of the same format version, throw
			const fileMeta = await peakImportFile(this.libraryFileToImport);
			if (
				this.libraryFileToImport.name !== LIBRARY_EXPORTED_FILE_NAME ||
				fileMeta.formatName !== 'dexie' ||
				fileMeta.formatVersion !== DEXIE_EXPORT_IMPORT_FORMAT_VERSION
			) {
				throw(LIBRARY_IMPORT_ERR_MSG)
			}

			await db.reset();
			await db.import(this.libraryFileToImport);
		} catch (error) {
			console.error(error);
			return;
		}

		this.importLibraryDialogEl.close()
		this.libraryFileToImport = null;
	}


	libraryFileSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		this.libraryFileToImport = file;
		this.importLibraryDialogEl.showModal();
	}


	onDropAreaDragOver(event: DragEvent) {
		event.stopPropagation();
		event.preventDefault();
		this.dropAreaActive = true;
	}


	onDropAreaDrop(event: DragEvent) {
		event.stopPropagation();
    event.preventDefault();
		this.dropAreaActive = false;

		if (!event.dataTransfer) {
			return;
		}

		const file = event.dataTransfer.items ?
			(event.dataTransfer.items[0].kind === 'file' ? event.dataTransfer.items[0].getAsFile() : null) :
			event.dataTransfer.files[0];

		if (!file || file.type !== 'application/json') {
			console.error(`Selected file is not a valid ${APP_NAME} library file`);
			return;
		}

		this.libraryFileToImport = file;
		this.importLibraryDialogEl.showModal();
	}


	showAddAPIKeyDialog() {
		this.addAPIKeyDialogEl.showModal();
		this.addAPIKeyDialogEl.focus();
	}
}
