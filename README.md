# Watchy

![watchy](https://github.com/user-attachments/assets/21085f7b-e90b-45ba-9f52-75b4cac9cbb1)

[Watchy](https://a-abuelgasim.github.io/watchlist-angular) is an Angular app that allows users to create lists of movies and TV shows. It uses TMDB's API to get movie and TV show details and saves the lists locally to indexedDB using Dexie.js so there's no need for user accounts or a back-end server. The app is written in Angular but I configured it to run Jest unit tests instead of Jasmine, as a personal preference.

Although a TMDB API key is required to search content to add to lists, for demonstration purposes I hardcoded movies and TV shows from the Marvel Cinematic Universe that can be searched and added to lists without the need for a key.

If you wish to unlock the app and search for any other content on TMDB you can follow the instructions [here](https://developer.themoviedb.org/docs/getting-started) to obtain a free API key.
