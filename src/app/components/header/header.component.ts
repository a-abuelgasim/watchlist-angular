import { Component, OnDestroy, OnInit } from '@angular/core';
import { APP_NAME } from '../../app.component';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
	appName = APP_NAME;
	menuVisible = false;
	routerEventsSub!: Subscription;


	constructor(private router: Router) {}


	ngOnInit() {
		this.routerEventsSub = this.router.events
			.subscribe(event => {
				if (this.menuVisible && event instanceof NavigationStart) this.toggleMenu();
			});
	}


	ngOnDestroy() {
		this.routerEventsSub.unsubscribe();
	}


  toggleMenu() {
		this.menuVisible = !this.menuVisible;
	}
}
