/*
I've opted to replace large portions of DocFx Modern's dynamic content generation so that I can use different html for it which I think gets the job done more cleanly and accessibly.

See partials/subtemplates.tmpl.partial for some of the html fragments used here.
*/

export async function initNav() {
	const
		mainJs = import("./main.js").then(m => m.default),
		navbarEl = document.body.querySelector("#navbar-custom"),
		linksEl = navbarEl.querySelector("ul.navbar-nav");

	setupThemePicker();
	const [navLinks, iconLinks] = await Promise.all([buildNavLinks(), buildIconLinks()]);
	linksEl.prepend(...navLinks, ...iconLinks);

	async function buildNavLinks() {
		const
			itemTmpl = document.body.querySelector("#nav-item-tmpl"),
			dropdownTmpl = document.body.querySelector("#nav-item-dropdown-tmpl");

		const
			navUrl = new URL(meta("docfx:navrel").replace(/.html$/gi, ".json"), window.location.href),
			items = (await (await fetch(navUrl)).json()).items;

		const links = buildNavTree(items, [], navUrl);

		for (const link of links) {
			link.classList = "nav-item nav-link";

			const ul = link.querySelector("ul");
			if (ul instanceof HTMLElement) {
				ul.classList = "dropdown-menu show";
				addAutoCloseEvent(ul.closest("details"));
				for (const x of ul.querySelectorAll("li"))
					x.classList = "nav-item nav-link dropdown-item";
			}
		}
		return links;
	}

	async function buildIconLinks() {
		const
			iconLinks = (await mainJs).iconLinks,
			iconChildren = [];

		for (const link of iconLinks) {
			const li = cloneTemplate("icon-link-tmpl", "li"),
				a = li.querySelector("a"),
				title = document.createTextNode(link.title).textContent;

			a.title = title;
			a.href = new URL(link.href);
			li.querySelector("i").classList.add(`bi-${link.icon}`);
			li.querySelector("span").textContent = title;

			iconChildren.push(li);
		}

		// fallback for if bootstrap's icon font doesn't load; replace icons with visible text
		onFontsLoaded(fonts => {
			if (fonts.findIndex(x => x.family === "bootstrap-icons") !== -1)
				return;
			for(const li of iconChildren) {
				li.classList.add("nav-item", "nav-link");
				li.querySelector("a").removeAttribute("class");
				li.querySelector(".sr-only").removeAttribute("class");
			}
		});

		return iconChildren;
	}

	async function setupThemePicker() {
		const defaultTheme = localStorage?.getItem("theme") || (await mainJs).defaultTheme || "auto";

		const themeMenuBtn = linksEl.querySelector(".nav-item-icon summary");
		themeMenuBtn.querySelector("i").classList = `bi bi-${getIcon(defaultTheme)}`;
		addAutoCloseEvent(themeMenuBtn.closest("details"));

		for (const btn of linksEl.querySelectorAll(".nav-item-icon button"))
			btn.addEventListener("click", () => setTheme(btn.dataset.theme));

		// fallback for if bootstrap's icon font doesn't load; replace dropdown icon with visible text
		onFontsLoaded(fonts => {
			if (fonts.findIndex(x => x.family === "bootstrap-icons") !== -1)
				return;
			themeMenuBtn.closest("li").classList.add("nav-item", "nav-link");
			themeMenuBtn.querySelector(".sr-only").removeAttribute("class");
		});

		function setTheme(theme) {
			localStorage.setItem("theme", theme);
			if (theme === "auto")
				document.documentElement.dataset.bsTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			else
				document.documentElement.dataset.bsTheme = theme;
			themeMenuBtn.querySelector("i").classList = `bi bi-${getIcon(theme)}`;
			themeMenuBtn.focus();
			themeMenuBtn.click();
		}

		function getIcon(theme) {
			return theme === "light" ? "sun" : theme === "dark" ? "moon" : "circle-half";
		}
	}

	function addAutoCloseEvent(details) {
		details.addEventListener("focusout", e => {
			if (details.open && !details.contains(e.relatedTarget))
				details.removeAttribute("open");
		});
	}
}

export async function initToc() {
	const
		tocEl = document.body.querySelector("#toc-offcanvas ul"),
		tocUrl = new URL(meta("docfx:tocrel").replace(/.html$/gi, ".json"), window.location.href),
		disableTocFilter = meta("docfx:disabletocfilter") === "true";

	const
		locSearchResults = loc("searchResultsCount"),
		locSearchNoResults = loc("searchNoResults");

	const { items, pdf, pdfFileName } = await fetch(tocUrl).then(x => x.json());

	tocEl.append(...buildNavTree(items, [], tocUrl));

	if (pdf === true) {
		const pdfLink = document.createElement("a");
		pdfLink.href = new URL(pdfFileName || "toc.pdf", tocUrl);
		pdfLink.textContent = loc("downloadPdf");
		tocEl.parentElement.append(pdfLink);
	}

	if (!disableTocFilter) {
		let tocFilter;
		const filterEl = tocEl.parentElement.querySelector("search input"),
			announceEl = tocEl.parentElement.querySelector("search div[aria-live]");

		filterEl.addEventListener("input", filterChanged);
		filterEl.addEventListener("change", filterChanged);

		filterEl.value = localStorage?.getItem("tocFilter") || "";
		filterEl.dispatchEvent(new Event("change"));

		function filterChanged() {
			if (filterEl.value === tocFilter)
				return;
			tocFilter = filterEl.value;
			localStorage?.setItem("tocFilter", filterEl.value);

			let count = 0;

			announceEl.classList.add("sr-only");

			for (const li of tocEl.querySelectorAll("li")) {
				li.removeAttribute("style");
				count++;
			}

			if (tocFilter === "") {
				announceEl.textContent = "";
				return;
			}

			const filterLower = tocFilter.toLowerCase();

			const treeWalker = document.createTreeWalker(
				tocEl,
				NodeFilter.SHOW_ELEMENT,
				(node) =>
					(
						node.tagName === "LI"
						&& !node.textContent.toLowerCase().includes(filterLower)
						&& ![...node.querySelectorAll("li, a, summary")].some((child) => child.textContent.toLowerCase().includes(filterLower))
					)
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_SKIP,
			);
			while (treeWalker.nextNode()) {
				treeWalker.currentNode.style.display = "none";
				count--;
			}

			announceEl.textContent =
				((count > 0) ? locSearchResults.replace("{count}", count) : locSearchNoResults)
				.replace("{query}", tocFilter);

			if (count <= 0)
				announceEl.classList.remove("sr-only");
		}
	}

	const active = tocEl.querySelector("a[aria-current]");
	if (active instanceof HTMLElement) {
		let current = active.closest("details");
		while (current instanceof HTMLElement) {
			current.setAttribute("open", true);
			current = current.parentElement.closest("details");
		}
		active.scrollIntoView({ block: "start", container: "nearest" });
	}
}

export async function initAffix() {
	await DOMReady();

	const
		affixEl = document.body.querySelector("#affix-custom ul"),
		headings = document.body.querySelectorAll("article h2, article h3"),
		items = [];

	if (headings.length <= 0)
		return;

	for (const h of headings) {
		const li = document.createElement("li"),
			a = document.createElement("a");

		a.href = `#${h.id}`;
		a.textContent = h.textContent;
		a.classList = (h.tagName === "H2") ? "link-body-emphasis" : "link-secondary";

		li.append(a);
		items.push(li);
	}
	affixEl.append(...items);
}

export async function initSearch() {
	const
		searchForm = document.querySelector("#search form"),
		searchBar = searchForm.querySelector("input"),
		searchBtn = searchForm.querySelector("button");

	if (!searchBar)
		return;
	if (!window.Worker) {
		searchBar.style.display = "none";
		return;
	}

	const
		skipLink = document.querySelector(".skip-link"),
		skipLinkOrigHref = skipLink.href;

	const
		containerEl = document.querySelector("#search-results-container"),
		countEl = containerEl.querySelector(".search-list"),
		resultsEl = containerEl.querySelector("div"),
		paginateEl = containerEl.querySelector("nav ul");

	let query = "";

	const relHref = meta("docfx:rel") || "";
	const worker = new Worker(new URL(`${relHref}./public/search-worker.min.js`, window.location.href), { type: "module" });

	worker.onerror = event => console.error("Error occurred in search-worker:", event);

	worker.onmessage = event => {
		switch(event.data.e) {
			case "index-ready":
				searchBar.disabled = searchBtn.disabled = false;
				searchBar.addEventListener("input", onQuerySubmit);
				searchForm.addEventListener("submit", (e) => {
					e.preventDefault();
					if (query !== "")
						location.replace("#" + containerEl.id);
				});
				window.docfx.searchReady = true;
				break;
			case "query-ready":
				if (searchBar.value === "")
					document.body.removeAttribute("data-search");
				else {
					document.body.setAttribute("data-search", "true");
					displayPage(event.data.d, 0);
				}
				window.docfx.searchResultReady = true;
				break;
		}
	};

	const { lunrLanguages } = await import("./main.js").then(m => m.default);
	worker.postMessage({ init: { lunrLanguages } });

	function onQuerySubmit() {
		query = searchBar.value;
		if (query === "") {
			skipLink.href = skipLinkOrigHref;
			document.body.removeAttribute("data-search");
		}
		else {
			skipLink.href = `#${containerEl.id}`;
			worker.postMessage({ q: query.replace(/\s+/g, " ").split(" ").map(w => "+" + w).join(" ") });
		}
	}

	function displayPage(hits, page) {
		const
			perPage = parseInt(meta("docfx:searchResultsPerPage")) || 10,
			pages = Math.ceil(hits.length / perPage),
			start = page * perPage;

		// reset search content

		resultsEl.textContent = paginateEl.textContent = "";
		paginateEl.parentElement.style.display = "none";

		if (hits.length <= 0) {
			countEl.textContent = loc("searchNoResults", { query });
			return;
		}
		else
			countEl.textContent = loc("searchResultsCount", { query, count: hits.length }) + ` - Page ${page + 1} of ${pages}`;

		// display results

		const ul = document.createElement("ul");
		for (let i = start; i < start + perPage; i++) {
			if (i >= hits.length)
				break;
			const li = cloneTemplate("search-hit-tmpl", "li");

			const title = li.querySelector(".item-title");
			title.href = new URL(hits[i].href, window.location.href);
			title.append(document.createTextNode(hits[i].title));

			const url = li.querySelector(".item-href");
			url.href = title.href;
			url.append(document.createTextNode(title.href));

			li.querySelector(".item-brief").append(extractContentBrief(hits[i].summary));

			ul.append(li);
		}
		resultsEl.append(ul);

		// display pagination

		if (pages > 1) {
			const
				numLinks = parseInt(meta("docfx:searchNumPaginationLinks")) || 5,
				half = Math.floor(numLinks / 2),
				pStart = Math.max(0, Math.min(page - half, pages - numLinks)),
				pEnd = Math.min(pages, pStart + numLinks);

			for (let i = pStart; i < pEnd; i++) {
				let li;
				if (i === page)
					li = cloneTemplate("search-pagination-active-tmpl", "li");
				else {
					li = cloneTemplate("search-pagination-tmpl", "li");
					const cur = i;
					li.querySelector("a").addEventListener("click", e => displayPage(hits, cur));
				}
				li.querySelector("a").textContent = i+1;
				paginateEl.append(li);
			}
			paginateEl.parentElement.removeAttribute("style");
		}
	}

	function extractContentBrief(content) {
		const
			briefOffset = 512,
			words = query.split(/\s+/g),
			queryIndex = content.indexOf(words[0]);

		const text = (queryIndex > briefOffset)
			? "..." + content.slice(queryIndex - briefOffset, queryIndex + briefOffset) + "..."
			: content.slice(0, queryIndex + briefOffset) + "...";

		return document.createTextNode(text);
	}
}

/*
UTILS
*/

function meta(name) {
	return document.head.querySelector(`meta[name="${name}"]`)?.content;
}

function loc(name, args) {
	let result = meta(`loc:${name}`) || "";
	if (args) {
		for (const key in args) {
			result = result.replace(`{${key}}`, args[key]);
		}
	}
	return result;
}

const templates = {};
function cloneTemplate(id, selector) {
	if (id in templates === false)
		templates[id] = document.getElementById(id);
	return document.importNode(templates[id].content, true).querySelector(selector);
}

function buildNavTree(items, ul, baseUrl) {
	const currentUrl = new URL(window.location.href);
	baseUrl = new URL(baseUrl, window.location.href);
	ul = ul || [];

	for(const item of items) {
		const nameNode = document.createTextNode(item.name);
		let li;
		if ("items" in item) {
			li = cloneTemplate("subtree-tmpl", "li");
			const
				summary = li.querySelector("summary"),
				subUl = li.querySelector("ul");

			if ("href" in item)
				console.error("The label for a navigation dropdown may not contain a link.", item);
			summary.append(nameNode);
			buildNavTree(item.items, subUl, baseUrl);
		}
		else {
			li = document.createElement("li");
			if ("href" in item) {
				const
					url = new URL(item.href, baseUrl),
					a = document.createElement("a");

				a.append(nameNode);
				a.href = url;
				if (externalUrl(url)) {
					a.target = "_blank";
					a.classList.add("external");
				}
				else if (sameUrl(url, currentUrl))
					a.setAttribute("aria-current", "page");

				li.append(a);
			}
			else
				li.append(nameNode);
		}

		if (ul instanceof HTMLElement)
			ul.append(li);
		else
			ul.push(li);
	}
	return ul;
}

function sameUrl(url1, url2) {
	return url1.host === url2.host && (
		url1.pathname === url2.pathname
		|| (
			(url1.pathname === "/" || url1.pathname === "/index.html")
			&& (url2.pathname === "/" || url2.pathname === "/index.html")
		)
	);
}

function externalUrl(url) {
	return url.hostname !== window.location.hostname || url.protocol !== window.location.protocol;
}

function DOMReady() {
	return new Promise(function (resolve) {
		if (document.readyState != "loading")
			return resolve();
		else
			document.addEventListener("DOMContentLoaded", function () {
				return resolve();
			});
	});
}

async function onFontsLoaded(callback) {
	const fonts = Array.from((await document.fonts).values());
	callback(fonts);
}
