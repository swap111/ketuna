/* Ketuna blog: "All articles" sidebar on article pages.
   Scrolls the current article into view inside the list and adds a title filter.
   The list works without JavaScript; this only improves it. */
/* Diagrams: on phones each figure gets an "Enlarge" button that opens the
   diagram full screen at a readable size (scroll and pinch-zoom allowed). */
(function () {
  "use strict";
  var figs = document.querySelectorAll(".post-body figure.diagram");
  if (!figs.length) return;

  var viewer = document.createElement("div");
  viewer.className = "dg-viewer";
  viewer.hidden = true;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Enlarged diagram");
  viewer.innerHTML = '<div class="dg-viewer-bar"><p>Scroll or pinch to explore. Turn the phone sideways for a wider view.</p>' +
    '<button type="button">Close</button></div><div class="dg-viewer-body"></div>';
  document.body.appendChild(viewer);
  var body = viewer.querySelector(".dg-viewer-body");
  var closeBtn = viewer.querySelector("button");
  var opener = null;

  function close() {
    viewer.hidden = true;
    body.innerHTML = "";
    document.body.classList.remove("dg-open");
    if (opener) opener.focus();
  }
  function open(fig, btn) {
    var svg = fig.querySelector("svg");
    if (!svg) return;
    var copy = svg.cloneNode(true);
    var t = svg.querySelector("title");
    // Drop ids in the copy so they do not clash with the original.
    copy.removeAttribute("aria-labelledby");
    if (t) copy.setAttribute("aria-label", t.textContent);
    Array.prototype.forEach.call(copy.querySelectorAll("[id]"), function (el) { el.removeAttribute("id"); });
    body.innerHTML = "";
    body.appendChild(copy);
    var cap = fig.querySelector("figcaption");
    if (cap) {
      var p = document.createElement("p");
      p.className = "dg-viewer-cap";
      p.textContent = cap.textContent;
      body.appendChild(p);
    }
    opener = btn;
    viewer.hidden = false;
    document.body.classList.add("dg-open");
    body.scrollTop = 0;
    body.scrollLeft = 0;
    closeBtn.focus();
  }

  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !viewer.hidden) close();
  });

  Array.prototype.forEach.call(figs, function (fig) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dg-zoom";
    btn.innerHTML = '<span aria-hidden="true">&#x2922;</span> Enlarge diagram';
    btn.addEventListener("click", function () { open(fig, btn); });
    var cap = fig.querySelector("figcaption");
    fig.insertBefore(btn, cap || null);
    // Tapping the drawing itself also opens it on phones.
    var svg = fig.querySelector("svg");
    if (svg) svg.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 699px)").matches) open(fig, btn);
    });
  });
})();

(function () {
  "use strict";
  var box = document.getElementById("all-posts");
  if (!box) return;
  var list = box.querySelector(".ap-list");
  var cur = box.querySelector('a[aria-current="page"]');

  // Centre the current article in the scrolling list (desktop sidebar only).
  if (cur && list && list.scrollHeight > list.clientHeight) {
    var top = cur.offsetTop - list.offsetTop - list.clientHeight / 2 + cur.offsetHeight / 2;
    list.scrollTop = Math.max(0, top);
  }

  var q = document.getElementById("ap-q");
  if (!q) return;
  q.hidden = false;
  var cats = Array.prototype.slice.call(box.querySelectorAll(".ap-cat"));
  var wasOpen = cats.map(function (d) { return d.open; });

  q.addEventListener("input", function () {
    var term = q.value.trim().toLowerCase();
    cats.forEach(function (d, i) {
      var shown = 0;
      Array.prototype.forEach.call(d.querySelectorAll("li"), function (li) {
        var hit = !term || li.textContent.toLowerCase().indexOf(term) !== -1;
        li.hidden = !hit;
        if (hit) shown++;
      });
      d.hidden = term && shown === 0;
      d.open = term ? shown > 0 : wasOpen[i];
    });
  });
})();
