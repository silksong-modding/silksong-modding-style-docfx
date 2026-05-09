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
			navUrl = new URL(meta("docfx:navrel").replace(/.html$/gi, '.json'), window.location.href),
			items = (await (await fetch(navUrl)).json()).items;

		const activeItem = findActiveItem(items, navUrl);
		const links = buildNavTree(items, [], activeItem);

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
		const defaultTheme = localStorage?.getItem("theme") || (await mainJs).defaultTheme || "auto";

		const themeMenuBtn = linksEl.querySelector(".nav-item-icon summary");
		themeMenuBtn.querySelector("i").classList = `bi bi-${getIcon(defaultTheme)}`;
		addAutoCloseEvent(themeMenuBtn.closest("details"));

		for (const btn of linksEl.querySelectorAll(".nav-item-icon button"))
			btn.addEventListener("click", () => setTheme(btn.dataset.theme));

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

		function getIcon(theme) {
			return theme === "light" ? "sun" : theme === "dark" ? "moon" : "circle-half";
		}
	}

	function addAutoCloseEvent(details) {
		details.addEventListener("focusout", e => {
			if (details.open && !details.contains(e.relatedTarget))
				details.querySelector("summary")?.click();
		});
	}
}

export async function initToc() {
	const
		tocEl = document.body.querySelector("#toc-offcanvas ul"),
		tocUrl = new URL(meta("docfx:tocrel").replace(/.html$/gi, ".json"), window.location.href),
		disableTocFilter = meta("docfx:disabletocfilter") === "true";

	const
		locSearchResults = meta("loc:searchResultsCount"),
		locSearchNoResults = meta("loc:searchNoResults");

	const { items, pdf, pdfFileName } = await fetch(tocUrl).then(x => x.json());

	const activeItem = findActiveItem(items, tocUrl);
	tocEl.append(...buildNavTree(items, [], activeItem));

	if (pdf === true) {
		const pdfLink = document.createElement("a");
		pdfLink.href = new URL(pdfFileName || 'toc.pdf', tocUrl);
		pdfLink.textContent = meta("loc:downloadPdf");
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

	for (const item of flatten(items)) {
		if (item.href === undefined)
			continue;
		item.href = new URL(item.href, baseUrl);
		if (externalUrl(item.href))
			continue;

		if (item.href.href === url.href) {
			if (activeItem === undefined)
				activeItem = item;
			else {
				activeItem = undefined;
				break;
			}
		}
	}

	return activeItem;

	function flatten(arr) {
		return arr.flatMap((x) => {
			const y =
				("items" in x)
				? [{ name: x.name, href: x.href }, ...flatten(x.items || [])]
				: [x];
			return [...y];
		});
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

			if ("href" in item)
				console.error("The label for a navigation dropdown may not contain a link.", item);
			summary.append(document.createTextNode(item.name));
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

	function buildLink(text, href, isCurrent) {
		const a = document.createElement("a");
		const url = new URL(href, window.location.href);
		a.textContent = text;
		a.href = url;
		if (externalUrl(url))
			a.target = "_blank";
		if (isCurrent === true)
			a.setAttribute("aria-current", "page");
		return a;
	}
}

function externalUrl(url) {
	return url.hostname !== window.location.hostname || url.protocol !== window.location.protocol;
}
