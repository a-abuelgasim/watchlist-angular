import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AppComponent } from './app.component';
import { ListsViewComponent } from './pages/lists-page/lists-page.component';
import { ListViewComponent } from './pages/list-page/list-page.component';
import { SearchViewComponent } from './pages/search-page/search-page.component';
import { VideoViewComponent } from './pages/video-page/video-page.component';
import { AddToListComponent } from './components/add-to-list/add-to-list.component';
import { VideoCardComponent } from './components/video-card/video-card.component';
import { SettingsViewComponent } from './pages/settings-page/settings-page.component';
import { ListFormComponent } from './components/list-dialog/list-dialog.component';
import { HeaderComponent } from './components/header/header.component';
import { VideoDetailsComponent } from './components/video-details/video-details.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    ListsViewComponent,
    ListViewComponent,
    SearchViewComponent,
    VideoViewComponent,
    AddToListComponent,
    VideoCardComponent,
    SettingsViewComponent,
    HeaderComponent,
    VideoDetailsComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    InfiniteScrollModule,
    ListFormComponent,
    ReactiveFormsModule,
  ],
  providers: [
		{provide: LocationStrategy, useClass: HashLocationStrategy}
	],
  bootstrap: [AppComponent]
})
export class AppModule { }
