import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListService } from '../../services/list/list.service';
import { Video, VideoList } from '../../utils/video';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { FormList } from '../../components/list-form/list-form.component';
import { APP_NAME } from '../../app.component';


const LIST_PAGE_NO_TUTORIAL_LS_KEY = 'listNoTutorial';


@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss']
})
export class ListViewComponent implements OnInit, OnDestroy {
  aboutToDeleteList = false;
  deletingList = false;
  deletionError = false;
  formList?: FormList;
  formVisible = false;
  id?: number;
  list?: VideoList;
  listSubscription?: Subscription;
	loading = true;
  removingVideo = false;
  showAddToListDialog = false;
	tutorial = true;
  video?: Video;
  videos?: Video[];


  @ViewChild('deleteDialog') dialog!: ElementRef<HTMLDialogElement>;


  constructor(
    public ls: ListService,
    private route: ActivatedRoute,
    private router: Router,
    private ts: Title
  ) {}


  get dialogEl() { return this.dialog.nativeElement }


  ngOnInit() {
		this.tutorial = !((localStorage.getItem(LIST_PAGE_NO_TUTORIAL_LS_KEY) || 'false') == 'true');

    // Get list ID from URL
    const idString = this.route.snapshot.paramMap.get('id');
    this.id = parseInt(idString as string);
    if (!this.id) return;

    this.listSubscription = this.ls.videoLists$.subscribe(async (lists) => {
			// Find this list in live list
      this.list = lists.filter((list) => list.id == this.id)[0];
			this.loading = false;
      if (!this.list) return;

      // Set page title
      this.ts.setTitle(`${APP_NAME} | ${this.list.name!}`);

      // Add the list details to the edit list form
      this.formList = {name: this.list.name, id: this.id};

      // Get list's videos
      const videos = await this.ls.getVideos(this.list.videoIDs || [])
      this.videos = videos.filter(video => video) as Video[];
			if (this.videos?.length === 0) return;

			localStorage.setItem(LIST_PAGE_NO_TUTORIAL_LS_KEY, 'true');
			this.tutorial = false;
    }) as Subscription;
  }


  ngOnDestroy() {
    this.listSubscription?.unsubscribe();
  }


  addVideoToList(video: Video) {
    if (!video) return;
    this.video = video;
    this.showAddToListDialog = true;
  }


  async deleteList() {
    this.deletingList = true;
    try {
      await this.ls.deleteList(this.list!);
      this.router.navigate(['/lists']);
    } catch(err) {
      console.error(err);
      this.deletionError = true;
    } finally {
      this.deletingList = false;
    }
  }


  hideDeleteDialog() {
    this.dialogEl.close();
    this.deletionError = false;
  }


	// Move a video up or down in the list
	async moveVideo(index: number, direction: -1 | 1): Promise<void> {
		if (!this.videos || this.videos.length == 0 || !this.list?.id) return;

    const videoToMove = this.videos[index];
    this.videos.splice(index, 1);
    this.videos.splice(index + direction, 0, videoToMove);
		const newOrderVideoIDs = this.videos.map(video => video.id);

		try {
			await this.ls.updateList(this.list?.id, {videoIDs: newOrderVideoIDs});
		} catch(err) {
			console.log(err);
		}
	}


  prepareVideoForRemoval(video: Video) {
    this.video = video;
    this.showDeleteDialog(false);
  }


  async removeVideo() {
    if (!this.video || !this.list) return;

    this.removingVideo = true;
    try {
      await this.ls.removeVideoFromLists(this.video, [this.list]);
			this.dialogEl.close();
    } catch(err) {
      console.error(err);
      this.deletionError = true;
    } finally {
      this.removingVideo = false;
    }
  }


  showDeleteDialog(deleteList: boolean) {
    this.aboutToDeleteList = deleteList;
    this.dialogEl.showModal();
    this.dialogEl.focus();
  }
}
