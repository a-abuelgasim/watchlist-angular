import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListsViewComponent } from './pages/lists-page/lists-page.component';
import { ListViewComponent } from './pages/list-page/list-page.component';
import { SearchViewComponent } from './pages/search-page/search-page.component';
import { VideoViewComponent } from './pages/video-page/video-page.component';
import { SettingsViewComponent } from './pages/settings-page/settings-page.component';
import { APP_NAME } from './app.component';


const routes: Routes = [
  {
    component: ListsViewComponent,
    path: 'lists',
    title: `${APP_NAME} | Lists`,
  },
  {
    component: SearchViewComponent,
    path: 'search',
    title: `${APP_NAME} | Search`,
  },
  {
    component: ListViewComponent,
    path: 'list/:id',
    title: APP_NAME,
  },
  {
    component: VideoViewComponent,
    path: 'video/:id',
    title: APP_NAME,
  },
  {
    component: SettingsViewComponent,
    path: 'settings',
    title: `${APP_NAME} | Settings`,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/lists',
  },
  {
    path: '**',
    redirectTo: '/lists',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
