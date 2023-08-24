import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Video, VideoSearchResult, VideoDetails, VideoList } from '../../utils/video';
import { ListService } from '../../services/list/list.service';
import { Subscription } from 'rxjs';
import { FormArray, FormControl, FormGroup } from '@angular/forms';


const ADD_TO_LIST_DIALOG_INVISIBLE_CLASS = 'dialog--invisible';

@Component({
  selector: 'app-add-to-list',
  templateUrl: './add-to-list.component.html',
  styleUrls: ['./add-to-list.component.scss']
})
export class AddToListComponent implements OnInit, OnChanges, OnDestroy {
  addToListFormGroup: FormGroup = new FormGroup({
    listsArray: new FormArray([])
  });
  error = false;
  formLists?: VideoList[];
  formListsArrayPrevVal: boolean[] = [];
	listDialogVisible = false;
  lists?: VideoList[];
  videoListsSub?: Subscription;
  submitting = false;
  _video?: Video;


  @Input() video: Video | VideoSearchResult | VideoDetails | undefined;
  @Input()
  set show(show: boolean) {
    if (show) {
			this.addToListDialogEl.showModal();
			this.addToListDialogEl.focus();
		}
  }


  @Output() hidden = new EventEmitter<boolean>();


  @ViewChild('addToListDialog') addToListDialog!: ElementRef<HTMLDialogElement>;


  constructor(private ls: ListService) {}


  get canSubmit() { return this.formValuesChanged && !this.submitting }
  get addToListDialogEl() { return this.addToListDialog.nativeElement }
  get formListsArray(): FormArray { return this.addToListFormGroup.get('listsArray') as FormArray }
  get formValuesChanged() {
    return !this.formListsArrayPrevVal.every(
      (val, index) => val === this.formListsArray.value[index]
    );
  }


  ngOnInit(): void {
    this.videoListsSub = this.ls.videoLists$.subscribe((lists) => {
      lists.sort((a, b) => a.name > b.name ? 1 : -1);
      this.lists = [...lists];
			this.updateCheckboxes();
    }) as Subscription;
  }


  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    this.error = false;

    const videoChanges = changes['video'];
    if (videoChanges && videoChanges.currentValue) {
      this._video! = videoChanges.currentValue;

      // If video has no ID try to get video from DB using serverID
      if (!('id' in this._video!)) {
        this._video = await this.ls.getVideoUsingServerID(this._video!) || this._video;
      }
    };

		this.updateCheckboxes();
  }


  ngOnDestroy(): void {
    this.videoListsSub?.unsubscribe();
  }


	// Creates formArray with checkboxes and checks those of lists the video is in
	updateCheckboxes() {
		if (!this._video || !this.lists || this.lists.length == 0) return;

    // Build form array
		this.formListsArray.clear();
    this.lists.forEach((list) => {
      this.formListsArray.push(new FormControl(
        ('id' in this._video!) ?
          list.videoIDs.includes((this._video as Video).id!) :
          false
      ))
    });

    this.formListsArrayPrevVal = [...this.formListsArray.value];
	}


	showAddListDialog() {
		this.addToListDialogEl.classList.add(ADD_TO_LIST_DIALOG_INVISIBLE_CLASS);
		this.listDialogVisible = true;
	}


	addListDialogHidden() {
		this.addToListDialogEl.classList.remove(ADD_TO_LIST_DIALOG_INVISIBLE_CLASS);
		this.listDialogVisible = false;
	}


  async submitHandler(): Promise<void> {
    if (!this._video) return;
    this.submitting = true;
    this.error = false;

    const listsToRemoveVideoFrom: VideoList[] = [];
    const listsToAddVideoTo: VideoList[] = [];
    const formListsArrayCurVal = this.formListsArray.value;

    this.lists?.forEach((list, i) => {
      const prevState = this.formListsArrayPrevVal[i];
      const curState = formListsArrayCurVal[i];

      if (prevState === curState) return;
      if (curState) listsToAddVideoTo.push(list);
      else listsToRemoveVideoFrom.push(list);
    });

    try {
      const videoWithUpdatedListIDs = await this.ls.addVideoToLists(this._video, listsToAddVideoTo);
      this._video = videoWithUpdatedListIDs || this._video;
      await this.ls.removeVideoFromLists(this._video as Video, listsToRemoveVideoFrom);
      this.formListsArrayPrevVal = [...this.formListsArray.value];
      this.addToListDialogEl.close();
    } catch(err) {
      this.error = true;
      console.error(err);
    } finally {
      this.submitting = false;
    }
  }
}
