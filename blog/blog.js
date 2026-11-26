/* Ketuna blog home: turns the static grouped list into a searchable,
 * filterable card grid rendered from index.json in batches.
 * Without JavaScript (or if index.json cannot be fetched, e.g. opened from disk)
 * the static list and the category links keep working. */
(function () {
  "use strict";
  var root = document.getElementById("blog-results");
  var input = document.getElementById("blog-q");
  var countEl = document.getElementById("blog-count");
  if (!root || !input || !window.fetch) return;

  var BATCH = parseInt(root.getAttribute("data-batch"), 10) || 24;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var chips = Array.prototype.slice.call(document.querySelectorAll(".catchips a[data-cat]"));
  var catName = {};
  chips.forEach(function (a) {
    var c = a.getAttribute("data-cat");
    if (c) catName[c] = a.firstChild.textContent.trim();
  });

  var posts = [], shown = 0, matches = [], cat = "", q = "";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function human(d) {
    var p = d.split("-");
    return parseInt(p[2], 10) + " " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
  }

  function card(p) {
    var li = el("li", "postcard");
    var meta = el("div", "meta");
    var chip = el("a", "chip", catName[p.category] || p.category);
    chip.href = "category-" + p.category + ".html";
    meta.appendChild(chip);
    meta.appendChild(el("span", "lvl", p.level));
    li.appendChild(meta);
    var h = el("h3");
    var a = el("a", null, p.title);
    a.href = p.slug + ".html";
    h.appendChild(a);
    li.appendChild(h);
    li.appendChild(el("p", null, p.summary));
    var date = el("p", "date");
    var t = el("time", null, human(p.date));
    t.setAttribute("datetime", p.date);
    date.appendChild(t);
    date.appendChild(document.createTextNode(" · " + p.minutes + " min read"));
    li.appendChild(date);
    return li;
  }

  function filter() {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    matches = posts.filter(function (p) {
      if (cat && p.category !== cat) return false;
      if (!words.length) return true;
      var hay = p._hay;
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
      return true;
    });
  }

  function render() {
    filter();
    shown = 0;
    root.className = "";
    root.textContent = "";
    var n = matches.length;
    countEl.textContent = n === posts.length && !cat && !q
      ? n + " articles"
      : n + " of " + posts.length + " articles" + (cat ? " in " + catName[cat] : "") + (q ? " matching “" + q + "”" : "");
    if (!n) {
      root.appendChild(el("p", "empty", "No articles match. Try fewer words or another category."));
      return;
    }
    var ul = el("ul", "postgrid");
    root.appendChild(ul);
    var row = el("div", "more-row");
    var btn = el("button", "btn btn-ghost");
    btn.type = "button";
    row.appendChild(btn);
    root.appendChild(row);
    function more() {
      var frag = document.createDocumentFragment();
      var end = Math.min(shown + BATCH, n);
      for (var i = shown; i < end; i++) frag.appendChild(card(matches[i]));
      ul.appendChild(frag);
      shown = end;
      if (shown >= n) row.hidden = true;
      else btn.textContent = "Show more (" + (n - shown) + " left)";
    }
    btn.addEventListener("click", function () {
      var first = shown;
      more();
      var link = ul.children[first] && ul.children[first].querySelector("h3 a");
      if (link) link.focus();
    });
    more();
  }

  function sync() {
    chips.forEach(function (a) {
      a.setAttribute("aria-pressed", a.getAttribute("data-cat") === cat ? "true" : "false");
      a.removeAttribute("aria-current");
    });
    var params = [];
    if (cat) params.push("cat=" + encodeURIComponent(cat));
    if (q) params.push("q=" + encodeURIComponent(q));
    try { history.replaceState(null, "", params.length ? "?" + params.join("&") : location.pathname); } catch (e) {}
  }

  function init(data) {
    posts = data;
    posts.forEach(function (p) {
      p._hay = [p.title, p.summary, (p.tags || []).join(" "), catName[p.category] || "", p.category, p.level].join(" ").toLowerCase();
    });
    var sp = new URLSearchParams(location.search);
    cat = catName[sp.get("cat")] ? sp.get("cat") : "";
    q = (sp.get("q") || "").trim();
    input.value = q;
    input.hidden = false;
    chips.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;
        ev.preventDefault();
        cat = a.getAttribute("data-cat");
        sync();
        render();
      });
    });
    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { q = input.value.trim(); sync(); render(); }, 120);
    });
    sync();
    render();
  }

  fetch("index.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function () { /* keep the static list */ });
})();
