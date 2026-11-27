/* Ketuna blog: "All articles" sidebar on article pages.
   Scrolls the current article into view inside the list and adds a title filter.
   The list works without JavaScript; this only improves it. */
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
