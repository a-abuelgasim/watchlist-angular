import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild
} from '@angular/core';
import {
  Observable,
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  merge,
  of,
  switchMap,
  tap
} from 'rxjs';
import { VideoDataService } from '../../services/video/video-data.service';
import { VideoSearchResult } from '../../utils/video';
import { FormControl } from '@angular/forms';
import { NavigationStart, Router } from '@angular/router';
import { API_KEY_MESSAGE } from '../settings-page/settings-page.component';


@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchViewComponent implements OnInit, AfterViewChecked, OnDestroy {
	apiKeyMsg = `${API_KEY_MESSAGE} If you have one, you can add it in the settings.`;
  ariaBusy = false;
	inputFormControl!: FormControl<string | number | null>;
	mainSub!: Subscription;
  noResults = false;
  page!: number;
  query!: string;
  query$ = new Subject<string>;
  results!: VideoSearchResult[];
  results$!: Observable<VideoSearchResult[]>;
	routerEventSub!: Subscription;
  scrollEnd$ = new Subject<null>;
  showAddToListDialog = false;
  totalPages!: number;
  videoToAdd?: VideoSearchResult;


  @ViewChild('resultsFeed', { static: false }) resultsFeed?: ElementRef;


  constructor(
		private cdRef: ChangeDetectorRef,
		private router: Router,
		public vds: VideoDataService
	) {}


  ngOnInit() {
		this.initialise();

		// Observable that fires when new search query is typed or when the user scrolls to the bottom of the results list
		this.mainSub = merge(
			this.query$.pipe(
				debounceTime(500),
				distinctUntilChanged(),
				tap(_ => {
					// New search triggered when new query is typed
					this.page = 1;
					this.results = [];
					this.noResults = false;
				})
			),
			this.scrollEnd$
		).pipe(
			// Search for videos
			switchMap(_ => this.query ? this.vds.search(this.query, this.page) : of(null)),
			tap((searchResponse) => {
				// Set aria-busy = true for the results div with role of 'feed'
				this.ariaBusy = true;
				if (searchResponse) {
					this.results = [...this.results, ...searchResponse.results];
					this.totalPages = searchResponse.totalPages || 0;
				} else {
					this.results = [];
					this.totalPages = 0;
				}
				if (this.results.length == 0 && this.query) this.noResults = true;
			})
		).subscribe();


		// Upon leaving the route, store the search state and scroll position in videoDataService lastSearch Subject
		this.routerEventSub = this.router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				this.vds.lastSearch$?.next({
					page: this.page,
					query: this.query,
					results: this.results,
					totalPages: this.totalPages,
				});
			}
		});
  }


	ngOnDestroy() {
		this.mainSub?.unsubscribe();
		this.routerEventSub?.unsubscribe();
	}


  ngAfterViewChecked() {
    if (this.resultsFeed && this.ariaBusy) {
			// Set ariaBusy to false once new results are rendered in resultsFeed element
      this.ariaBusy = false;
      // Call detectChanges() to prevent 'Expression has changed after it was checked' error
      this.cdRef.detectChanges();
    }
  }


  addVideoToList(video: VideoSearchResult): void {
    this.videoToAdd = video;
    this.showAddToListDialog = true;
  }


  // Handles user scrolling to bottom of infinite scroll resultsFeed element
  infiniteScrollHandler() {
    // If no more pages of results, return
    if (this.page >= this.totalPages) return;
    this.page = this.page + 1;
    this.scrollEnd$.next(null);
  }


	// Initialise component to load previous search results if any
	initialise(): void {
		const {page, query, results, totalPages} = this.vds.lastSearch$?.getValue() || {};
		this.page = page || 1;
		this.results = results || [];
		this.totalPages = totalPages || this.totalPages;
		this.query = query || '';
		this.inputFormControl = new FormControl(this.query);
	}


  // Handles user inputing text in search box
  inputHandler(event: Event) {
    this.query = (event.target as HTMLInputElement).value?.trim();
    this.query$.next(this.query);
  }
}
