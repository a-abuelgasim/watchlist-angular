import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VideoType } from '../../utils/video';


@Component({
  selector: 'app-video-details',
  templateUrl: './video-details.component.html',
  styleUrls: ['./video-details.component.scss']
})
export class VideoDetailsComponent implements OnChanges {
	endYear?: string | null;
	isMovie?: boolean;
	releaseYear?: string | null;
	runtime?: [string, string];
	rating?: number | null;
	status?: number | null;
	seasons?: number;
	seasonCountPluralStringMap = {
		'=1': '1 season',
		'other': '# seasons',
	}


	@Input() video?: any;
	@Input() extended?: boolean;


	ngOnChanges(changes: SimpleChanges): void {
		if (!changes || !changes['video'])  return;

		const video = changes['video'].currentValue;
		if (!video) return;

		this.isMovie = video.type == VideoType.Movie;

		this.releaseYear = video.releaseDate?.split('-')[0];
		const endYear = video.endDate?.split('-')[0];
		this.endYear = this.releaseYear != this.endYear ? endYear :  null;
		this.runtime = this.formatRuntime(video.runtime);
	}


	// Format the runtime of a video into hrs and mins format and an accessibile sentence
	formatRuntime(runtime: string): [string, string] {
		const empty = ['', ''] as [string, string];
		if (!runtime) return empty;

		const runtimeNumber = parseInt(runtime);
		if (!runtimeNumber) return empty;

		const hrs = Math.floor(runtimeNumber / 60);
		const mins = runtimeNumber % 60;
		const visualTime = `${hrs}h ${mins}m`;
		const a11yTime = `${hrs} hour${hrs == 1 ? '' : 's'} and ${mins} minute${mins == 1 ? '' : 's'}`;
		return [visualTime, a11yTime];
	}
}
