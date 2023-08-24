import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, firstValueFrom, map, Observable, startWith, Subscription } from 'rxjs';
import { ListService } from '../../services/list/list.service';
import { VideoList } from '../../utils/video';
import { ImageSources, VideoDataService } from '../../services/video/video-data.service';
import Fuse from 'fuse.js';


interface ListsSortOption {
  id: number;
  direction: -1 | 1;
  key: string;
  label: string;
}


const FUSE_OPTIONS = {
	keys: ['name'],
	threshold: 0.4
};
const LIST_SORT_OPTION_ID_LS_KEY = 'listSortOptionID';
const LISTS_PAGE_NO_TUTORIAL_LS_KEY = 'listsNoTutorial';

@Component({
  selector: 'app-lists-page',
  templateUrl: './lists-page.component.html',
  styleUrls: ['./lists-page.component.scss'],
})
export class ListsViewComponent implements OnInit, OnDestroy {
	fuse?: Fuse<VideoList>;
  listDialogVisible = false;
	listCount = 0;
  listFilter = new FormControl('');
  listFilter$ = this.listFilter.valueChanges.pipe(startWith(''));
  listSort!: FormControl;
  listSort$?: Observable<number>;
  listSortOptionID?: number;
  listSortOptions: ListsSortOption[] = [
    {id: 1, direction: 1, key: 'name', label: 'Name'},
    {id: 2, direction: 1, key: 'created', label: 'Created ▲'},
    {id: 3, direction: -1, key: 'created', label: 'Created ▼'},
    {id: 4, direction: 1, key: 'updated', label: 'Updated ▲'},
    {id: 5, direction: -1, key: 'updated', label: 'Updated ▼'},
    {id: 7, direction: 1, key: 'videos', label: 'Videos ▲'},
    {id: 6, direction: -1, key: 'videos', label: 'Videos ▼'},
  ];
  sortedFilteredVideoLists$?: Observable<VideoList[]>;
	tutorial = true;
	videoCountPluralStringMap = {
		'=0': 'No videos',
		'=1': '1 video',
		'other': '# videos',
	}
  videoListsSub?: Subscription;
  videoPosterSources: {[key: number]: ImageSources} = {};


  constructor(
		private ls: ListService,
		private vds: VideoDataService
	) {}


  ngOnInit() {
		this.tutorial = !((localStorage.getItem(LISTS_PAGE_NO_TUTORIAL_LS_KEY) || 'false') == 'true');

    // Get list sort option from localStorage or set it to option 1
    let initialSortOptionID = 1;
    const lsListSortOptionID = localStorage.getItem(LIST_SORT_OPTION_ID_LS_KEY);
    if (lsListSortOptionID) {
      initialSortOptionID = parseInt(lsListSortOptionID);
    } else {
      localStorage.setItem(LIST_SORT_OPTION_ID_LS_KEY, `${initialSortOptionID}`);
    }
    this.listSortOptionID = initialSortOptionID;
    const listSortOption: ListsSortOption = this.listSortOptions
      .find(listOption => listOption.id == initialSortOptionID)!;
    this.listSort = new FormControl(listSortOption.id);
    this.listSort$ = this.listSort.valueChanges.pipe(startWith(initialSortOptionID));

    this.sortedFilteredVideoLists$ = combineLatest(
      this.ls.videoLists$,
      this.listSort$,
      this.listFilter$,
    ).pipe(
      // Whenever any of the filter, sort or lists observables emit...
      map(([videoLists, listSortOptionID, filterQuery]) => {
        // Store new sort value in localStorage if changed
        if (listSortOptionID != this.listSortOptionID) {
          localStorage.setItem(LIST_SORT_OPTION_ID_LS_KEY, `${listSortOptionID}`);
          this.listSortOptionID = listSortOptionID;
        }

				const filteredVideoLists = filterQuery ?
					this.fuse?.
						search(filterQuery)?.
						map((fuseResult) => fuseResult.item) || videoLists :
					videoLists;

        // Get current sort option's details
        const listSortOption: ListsSortOption = this.listSortOptions
          .find(listOption => listOption.id == listSortOptionID)!;

        // Return filtered and sorted array of lists
        return filteredVideoLists?.sort((a: VideoList, b: VideoList) => {
					const prop = listSortOption.key as keyof VideoList;
					let aVal, bVal;
					if (prop === 'videos' as keyof VideoList) {
						aVal = a.videoIDs.length;
						bVal = b.videoIDs.length;
					} else {
						aVal = a[prop]!;
						bVal = b[prop]!;
					}

					// Sort property is string then covert to lowercase before sorting
					const x = (typeof aVal === 'string' || aVal instanceof String) ?
						aVal.toLowerCase() :
						aVal;
					const y = (typeof bVal === 'string' || bVal instanceof String) ?
						bVal.toLowerCase() :
						bVal;

					if (x! < y!) return -1 * listSortOption.direction;
					else if (x > y) return 1 * listSortOption.direction;
					else return 0;
				});
      })
    )

		// Get the imag sources for each list's videos
    this.videoListsSub = this.ls.videoLists$.subscribe(async (videoLists) => {
			this.listCount = videoLists.length || 0;
			this.fuse = new Fuse(videoLists, FUSE_OPTIONS);
			if (!this.listCount) return;

			localStorage.setItem(LISTS_PAGE_NO_TUTORIAL_LS_KEY, 'true');
			this.tutorial = false;

      const allVideosIDs = Array.prototype.concat.apply(
        [],
        videoLists.map((videoList) => videoList.videoIDs)
      );

      const allVideosIDsSet = new Set(allVideosIDs);
      (await this.ls.getVideos([...allVideosIDsSet]))
        .forEach(async (video) => {
          if (!video || !video.posterPath) return;
          const imageSource = await firstValueFrom(this.vds.getImgSources(video.posterPath));
          this.videoPosterSources[video.id as number] = imageSource!;
        });
    }) as Subscription;
  }


  ngOnDestroy() {
    this.videoListsSub?.unsubscribe();
  }


  // Identify list items in ngFor loop
  identifyList(_: number, list: VideoList): string {
    return `${list.id}${list.name}`;
  }
}
