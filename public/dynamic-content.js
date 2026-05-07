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
	linksEl.prepend(...navLinks);
	linksEl.querySelector(".icons").prepend(...iconLinks);

	async function buildNavLinks() {
		const
			itemTmpl = document.body.querySelector("#nav-item-tmpl"),
			dropdownTmpl = document.body.querySelector("#nav-item-dropdown-tmpl");

		const
			navUrl = new URL(meta("docfx:navrel").replace(/.html$/gi, '.json'), window.location.href),
			items = (await (await fetch(navUrl)).json()).items;

		const activeItem = findActiveItem(items, navUrl);
		const links = buildNavTree(items, [], activeItem);

		for (const link of links) {
			link.classList = "nav-item";
			for (const x of link.querySelectorAll("a"))
				x.classList = "nav-link";
			for (const x of link.querySelectorAll("summary"))
				x.classList = "nav-link dropdown-toggle";
			for (const x of link.querySelectorAll("ul"))
				x.classList = "dropdown-menu show";
			for (const x of link.querySelectorAll("ul a, ul summary"))
				x.classList.add("dropdown-item");
		}

		return links;
	}
				
	async function buildIconLinks() {
		const iconLinkTmpl = document.body.querySelector("#icon-link-tmpl");

		const
			iconLinks = (await mainJs).iconLinks,
			iconChildren = [];

		for (const link of iconLinks) {
			const el = document.importNode(iconLinkTmpl.content, true),
				a = el.querySelector("a");

			a.title = link.title;
			a.href = link.href;
			el.querySelector("i").classList.add(`bi-${link.icon}`);
			el.querySelector("span").innerText = link.title;

			iconChildren.push(el);
		}

		return iconChildren;
	}
				
	async function setupThemePicker() {
		const locChangeTheme = meta("loc:changeTheme"),
			locLight = meta("loc:themeLight"),
			locDark = meta("loc:themeDark"),
			locAuto = meta("loc:themeAuto"),
			defaultTheme = localStorage.getItem("theme") || (await mainJs).defaultTheme || "auto";
				
		const themeMenuBtn = linksEl.querySelector(".nav-item-icon summary");
		themeMenuBtn.querySelector("i").classList = `bi bi-${getIcon(defaultTheme)}`;
		themeMenuBtn.querySelector("span").innerText = locChangeTheme;
		themeMenuBtn.title = locChangeTheme;
					
		for (const btn of linksEl.querySelectorAll(".nav-item-icon button")) {
			const theme = btn.dataset.theme;
			btn.addEventListener("click", () => setTheme(theme));
			btn.append(theme === "light" ? locLight : theme === "dark" ? locDark : locAuto);
		}

		function getIcon(theme) {
			return theme === "light" ? "sun" : theme === "dark" ? "moon" : "circle-half";
		}
				
		function setTheme(theme, icon) {
			localStorage.setItem("theme", theme);
			if (theme === "auto")
				document.documentElement.dataset.bsTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			else
				document.documentElement.dataset.bsTheme = theme;
			themeMenuBtn.querySelector("i").classList = `bi bi-${getIcon(theme)}`;
			themeMenuBtn.focus();
			themeMenuBtn.click();
		}
	}
}

export async function initToc() {
	const
		tocEl = document.body.querySelector("#toc-offcanvas ul"),
		tocUrl = new URL(meta("docfx:tocrel").replace(/.html$/gi, ".json"), window.location.href),
		disableTocFilter = meta("docfx:disabletocfilter") === "true";

	const { items, pdf, pdfFileName } = await fetch(tocUrl).then(x => x.json());

	// TODO make the filtering work, figure out what's going on with the pdf options...

	const activeItem = findActiveItem(items, tocUrl);
	tocEl.append(...buildNavTree(items, [], activeItem));
}

export async function initAffix() {
	const
		affixEl = document.body.querySelector("#affix-custom ul"),
		headings = document.body.querySelectorAll("article h2, article h3"),
		items = [];

	console.log(headings);

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

/*
UTILS
*/

function meta(name) {
	return document.head.querySelector(`meta[name="${name}"]`)?.content;
}

function findActiveItem(items, baseUrl) {
	const
		url = new URL(window.location.href);
	let
		activeItem = undefined,
		maxPrefixLength = 0;

	for (const item of items.map(x => "items" in x ? x.items : x).flat()) {
		if (item.href === undefined)
			continue;
		item.href = new URL(item.href, baseUrl);
		if (externalUrl(item.href))
			continue;
		const prefixLength = commonUrlPrefixLength(url, item.href);
		if (prefixLength === maxPrefixLength)
			activeItem = undefined;
		else if (prefixLength > maxPrefixLength) {
			maxPrefixLength = prefixLength;
			activeItem = item;
		}
	}

	return activeItem;

	function externalUrl(url) {
		return url.hostname !== window.location.hostname || url.protocol !== window.location.protocol;
	}

	function commonUrlPrefixLength(url, base) {
		const
			urlSegments = url.pathname.split('/'),
			baseSegments = base.pathname.split('/');
		let i = 0;
		while (i < urlSegments.length && i < baseSegments.length && urlSegments[i] === baseSegments[i]) {
			i++;
		}
		return i;
	}
}

function buildNavTree(items, ul, activeItem) {
	ul = ul || [];

	for(const item of items) {
		let li;
		if ("items" in item) {
			li = document.importNode(document.body.querySelector("#subtree-tmpl").content, true).querySelector("li");
			const
				summary = li.querySelector("summary"),
				subUl = li.querySelector("ul");

			summary.append(buildItem(item));
			buildNavTree(item.items, subUl, activeItem);
		}
		else {
			li = document.createElement("li");
			li.append(buildItem(item));
		}

		if (ul instanceof HTMLElement)
			ul.append(li);
		else
			ul.push(li);
	}
	return ul;

	function buildItem(item) {
		return ("href" in item) ? buildLink(item.name, item.href, item === activeItem) : document.createTextNode(item.name);
	}

	function buildLink(text, url, isCurrent) {
		const a = document.createElement("a");
		a.href = url;
		a.textContent = text;
		if (isCurrent === true)
			a.setAttribute("aria-current", "page");
		return a;
	}
}
