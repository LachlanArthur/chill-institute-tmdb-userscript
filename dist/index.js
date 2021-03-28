// ==UserScript==
// @name         TMDB Movie Search for Chill Institute
// @version      1.0
// @author       Cyykratahk
// @match        https://chill.institute
// @grant        none
// ==/UserScript==

(() => {
  // src/jsx-shim.ts
  function jsx(tagName, attributes, ...children) {
    if (typeof tagName === "function")
      return tagName(attributes, ...children);
    if (!tagName || typeof tagName !== "string") {
      throw new Error("Invalid tag name");
    }
    if (typeof attributes === "undefined" || attributes === null) {
      attributes = {};
    }
    let element = document.createElement(tagName);
    for (const [key, value] of Object.entries(attributes)) {
      switch (key) {
        default:
          element.setAttribute(key, value);
          break;
        case "style":
        case "dataset":
          Object.assign(element[key], value);
          break;
        case "className":
          element[key] = value;
          break;
        case "classList":
          element.classList.add(...value.filter(String));
          break;
      }
    }
    for (let child of children) {
      if (child instanceof HTMLElement) {
        element.appendChild(child);
      } else
        switch (typeof child) {
          default:
            console.error("Failed to inject child element", child);
            break;
          case "undefined":
            break;
          case "string":
          case "number":
          case "bigint":
            element.appendChild(document.createTextNode(child));
            break;
          case "boolean":
            element.appendChild(document.createTextNode(child ? "true" : "false"));
            break;
        }
    }
    return element;
  }

  // node_modules/ll/dist-web/index.js
  function ensureArray(maybe) {
    return Array.isArray(maybe) ? maybe : [maybe];
  }
  function on(elements, events, targetFilter) {
    const elementsArray = ensureArray(elements).filter((element) => element !== null && typeof element !== "undefined").filter((element) => "addEventListener" in element);
    const eventsArray = ensureArray(events);
    return (listeners, options) => {
      let listenersArray = ensureArray(listeners);
      if (typeof targetFilter !== "undefined") {
        listenersArray = listenersArray.map((f) => function(event) {
          const target = event.target;
          if (target instanceof Element) {
            const filteredTarget = target.closest(targetFilter);
            if (filteredTarget)
              f.call(filteredTarget, event);
          }
        });
      }
      for (let element of elementsArray) {
        for (let event of eventsArray) {
          for (let listener of listenersArray) {
            element.addEventListener.call(element, event, listener, options);
          }
        }
      }
    };
  }

  // src/style.css
  var style_default = '.content {\n	width: auto;\n}\n\n.Search .SearchResults table .SearchResult-Title,\n.Search .SearchResults table thead th:first-child {\n	padding-left: 20px;\n}\n\n.Search .SearchResults table .Actions,\n.Search .SearchResults table thead th:last-child {\n	padding-right: 20px;\n}\n\n.SearchResult-Title button.get-info {\n	font-size: inherit;\n}\n\n.SearchResult-Title button.get-info.-loading {\n	animation: spin infinite linear 1s;\n}\n\n@keyframes spin {\n	to { transform: rotate( 1turn ); }\n}\n\n.SearchResult-Title.-hasinfo > button[title] {\n	display: none;\n}\n\nhtml {\n	--overlay-color: #ececece6;\n}\n\nhtml.dark {\n	--overlay-color: #343434e6;\n}\n\n.SearchResult-Title img.poster {\n	vertical-align: top;\n}\n\n.SearchResult-Title .movie-info {\n	display: grid;\n	grid-template-columns: 92px auto;\n	gap: 20px;\n	white-space: normal;\n}\n\n.SearchResult-Title .movie-info p {\n	margin-top: 0;\n}\n\n.SearchResult-Title .movie-title-year {\n	font-size: 24px;\n	margin-bottom: 8px;\n}\n\n.SearchResult-Title .movie-title {\n	font-weight: bold;\n}\n\n.SearchResult-Title .movie-rating,\n.SearchResult-Title .movie-genres,\n.SearchResult-Title .movie-language,\n.SearchResult-Title .movie-filename {\n	font-size: 14px;\n	margin-bottom: 5px;\n}\n\n.SearchResult-Title .movie-filename {\n	opacity: 0.75;\n}\n\nlinear-gradient(to bottom, #343434e6 0%,#343434e6 100%), url("https://image.tmdb.org/t/p/w1280/xFxk4vnirOtUxpOEWgA1MCRfy6J.jpg")\n';

  // src/generic-api.ts
  var GenericAPI = class {
    base;
    async get(endpoint, params) {
      if (params) {
        const searchParams = new URLSearchParams();
        const [path, oldParams] = endpoint.split("?");
        if (oldParams) {
          for (const [key, value] of new URLSearchParams(oldParams).entries()) {
            searchParams.set(key, value);
          }
        }
        for (const [key, value] of new URLSearchParams(params).entries()) {
          searchParams.set(key, value);
        }
        endpoint = `${path}?${searchParams.toString()}`;
      }
      return this.request("get", endpoint);
    }
    async request(method, endpoint, body) {
      let [path, query] = endpoint.split("?");
      let searchParams = new URLSearchParams(query);
      searchParams = this.filterGetParams(searchParams);
      query = searchParams.toString();
      if (query) {
        query = `?${query}`;
      }
      endpoint = `${path}${query}`;
      const url = new URL(endpoint, this.base);
      const response = await fetch(url.toString(), {
        method,
        body
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const [contentType, encoding] = response.headers.get("Content-Type").split(";");
      switch (contentType) {
        default:
          throw new Error(`Unsupported content type in response: ${contentType}`);
        case "application/json":
          return response.json();
      }
    }
    filterGetParams(params) {
      return params;
    }
  };

  // src/the-movie-database.ts
  var TheMovieDatabaseAPI = class extends GenericAPI {
    constructor(apiKey) {
      super();
      this.apiKey = apiKey;
    }
    base = "https://api.themoviedb.org/3/";
    filterGetParams(params) {
      params.set("api_key", this.apiKey);
      return params;
    }
    async getGenres() {
      return this.get("genre/movie/list");
    }
    async searchMovie(query, year, args = {}) {
      const search = {query};
      if (year)
        search.year = year;
      if (args)
        Object.assign(search, args);
      const response = await this.get("search/movie", search);
      if (!response.total_results)
        return;
      return response.results[0];
    }
    getMoviePoster(movie, size = "w92") {
      if (!movie.poster_path) {
        return;
      }
      return `https://image.tmdb.org/t/p/${size}${movie.poster_path}`;
    }
    getMovieBackdrop(movie, size = "w300") {
      if (!movie.backdrop_path) {
        return;
      }
      return `https://image.tmdb.org/t/p/${size}${movie.backdrop_path}`;
    }
  };

  // src/index.tsx
  var posterSize = "w92";
  var backdropSize = "w1280";
  var app = document.getElementById("root");
  var observer = new MutationObserver(() => addButtons());
  observer.observe(app, {childList: true, subtree: true});
  addButtons();
  addStyles();
  var tmdbApiKey = localStorage.getItem("tmdb|key");
  var tmdbApi = new TheMovieDatabaseAPI(tmdbApiKey || "");
  on(app, "click", "button.get-info")(async function(e) {
    e.preventDefault();
    if (!tmdbApiKey) {
      tmdbApiKey = prompt("API Key for The Movie DB");
      if (!tmdbApiKey) {
        return;
      } else {
        tmdbApi.apiKey = tmdbApiKey;
        localStorage.setItem("tmdb|key", tmdbApiKey);
      }
    }
    if (this.matches(".-loading"))
      return;
    this.classList.add("-loading");
    const title = this.dataset.title;
    const year = this.dataset.year;
    const originalTitle = this.parentElement.querySelector("button[title]").getAttribute("title");
    const movie = await getMovie(title, year);
    if (movie) {
      this.parentElement.insertAdjacentElement("afterbegin", /* @__PURE__ */ jsx("div", {
        className: "movie-info"
      }, movie.poster_url && /* @__PURE__ */ jsx("img", {
        src: movie.poster_url,
        width: 100,
        className: "poster"
      }), /* @__PURE__ */ jsx("div", {
        className: "movie-meta"
      }, /* @__PURE__ */ jsx("p", {
        className: "movie-title-year"
      }, /* @__PURE__ */ jsx("span", {
        className: "movie-title"
      }, movie.title), " ", /* @__PURE__ */ jsx("span", {
        className: "movie-year"
      }, "(", movie.year, ")")), /* @__PURE__ */ jsx("p", {
        className: "movie-overview"
      }, movie.overview), /* @__PURE__ */ jsx("p", {
        className: "movie-genres"
      }, formatList(await getGenres(movie.genre_ids))), /* @__PURE__ */ jsx("p", {
        className: "movie-rating"
      }, "Rated ", movie.vote_average, " by ", movie.vote_count, " users on TMDB"), /* @__PURE__ */ jsx("p", {
        className: "movie-language"
      }, "Original Language: ", getLanguageName(movie.original_language)), /* @__PURE__ */ jsx("p", {
        className: "movie-filename"
      }, "Filename: ", originalTitle))));
      const row = this.parentElement.closest("tr");
      row.style.backgroundImage = `linear-gradient(to bottom, var(--overlay-color) 0%, var(--overlay-color) 100%), url(${movie.backdrop_url})`;
      row.style.backgroundSize = "cover";
      row.style.backgroundPosition = "center 20%";
      this.parentElement.classList.add("-hasinfo");
    } else {
      this.parentElement.insertAdjacentElement("afterbegin", /* @__PURE__ */ jsx("div", {
        className: "movie-info"
      }, /* @__PURE__ */ jsx("span", {
        title: "Could not find movie"
      }, "\u274C")));
    }
    this.remove();
  });
  function addButtons() {
    app.querySelectorAll(".SearchResult-Title").forEach((cell) => {
      if (cell.matches(".-processed"))
        return;
      cell.classList.add("-processed");
      const downloadButton = cell.querySelector("button[title]:not(.get-info)");
      downloadButton.textContent = downloadButton.title;
      const {title, year} = parseFilename(downloadButton.title);
      if (!title) {
        cell.insertAdjacentElement("afterbegin", /* @__PURE__ */ jsx("span", {
          title: "Could not detect title"
        }, "\u274C"));
        return;
      }
      const titleYear = title + (year ? ` (${year})` : "");
      const tooltip = `Get info for "${titleYear}"`;
      const data = {
        title
      };
      if (year) {
        data.year = year;
      }
      const yearNotice = year ? "" : /* @__PURE__ */ jsx("span", {
        title: "Could not detect year"
      }, "\u2753");
      cell.insertAdjacentElement("afterbegin", /* @__PURE__ */ jsx("button", {
        className: "get-info",
        dataset: data
      }, /* @__PURE__ */ jsx("span", {
        title: tooltip
      }, "\u{1F50D}"), yearNotice));
    });
  }
  var genres = ((cachedEntries) => {
    if (cachedEntries) {
      return new Map(JSON.parse(cachedEntries));
    }
  })(localStorage.getItem("tmdb|genres"));
  async function getGenres(ids) {
    if (!genres) {
      genres = new Map();
      for (const {id, name} of (await tmdbApi.getGenres()).genres) {
        genres.set(id, name);
      }
      localStorage.setItem("tmdb|genres", JSON.stringify(Array.from(genres.entries())));
    }
    return ids.map((id) => genres.get(id) || "").filter(String);
  }
  async function getMovie(title, year) {
    const cacheKey = `tmdb|movie|${title}|${year || "-"}`;
    const cachedMovie = localStorage.getItem(cacheKey);
    let movie;
    if (cachedMovie) {
      movie = JSON.parse(cachedMovie);
    } else
      try {
        movie = await tmdbApi.searchMovie(title, year, {language: "en-AU"});
        localStorage.setItem(cacheKey, JSON.stringify(movie));
      } catch (e) {
        console.error(e);
      }
    if (!movie) {
      console.warn("Zero results for %s (%s)", title, year);
      return;
    }
    return {
      ...movie,
      poster_url: tmdbApi.getMoviePoster(movie, posterSize),
      backdrop_url: tmdbApi.getMovieBackdrop(movie, backdropSize),
      year: movie.release_date.split("-")[0]
    };
  }
  function parseFilename(filename) {
    filename = filename.replace(/[\[\]\(\)\{\}]/g, " ").replace(/\b\d{3,4}p\b/ig, "").replace(/\b(web-?dl|b[rd]-?rip|blu-?ray|[hx]\.?26[45]|hevc|avc|aac|dolby|atmos|dts)\b/ig, "").replace(/\.?\b(mkv|mp4|m4v|avi)$/gi, "").replace(/(^| )((www)?[a-z0-9\-]+?\.(org|net|live))\b/ig, "").replace(/[\.\-\:\(\)]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    let matches = filename.match(/^(?<title>.+?)\s+(?<year>(?:19|20)\d\d)/);
    let title;
    let year;
    if (matches && matches.groups) {
      title = matches.groups.title.trim();
      year = matches.groups.year;
    } else if (filename) {
      title = filename;
    }
    return {title, year};
  }
  function addStyles() {
    const style = document.createElement("style");
    style.innerHTML = style_default;
    document.head.insertAdjacentElement("beforeend", style);
  }
  var languageDisplay = new Intl.DisplayNames(navigator.languages, {type: "language"});
  function getLanguageName(code) {
    return languageDisplay.of(code);
  }
  var listFormatter = new Intl.ListFormat(navigator.languages, {type: "conjunction", style: "long"});
  function formatList(items) {
    return listFormatter.format(items);
  }
})();
