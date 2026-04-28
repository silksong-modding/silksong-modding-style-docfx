export default {
  iconLinks: [
    {
      icon: "github",
      href: "https://github.com/silksong-modding",
      title: "GitHub",
    },
    {
      icon: "discord",
      href: "https://discord.gg/Bhsxurh2sU",
      title: "Discord",
    },
  ],
  start: () => {
    /* The logo's alt text is redundant because of the site title directly beside it, and
    the image is purely decorative. So we hide it from screenreaders. */
    let logo = document.body.querySelector("#logo");
    logo.ariaHidden = true;
    logo.alt = "";

    // docfx doesn't provide a skip-to-content link. :/

    let skipLink = document.createElement("a");
    skipLink.id = "skip-to-content";
    skipLink.href = "#" + document.body.querySelector("main h1").id;
    skipLink.innerText = "skip to main content";

    document.body.querySelector("header").prepend(skipLink);
  },
};
