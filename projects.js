/* Ketuna projects page: optional filter chips by domain.
 * Without JavaScript the chips stay hidden and every project is shown.
 * No dependencies. */
(function () {
  "use strict";
  var box = document.querySelector(".js-filter");
  if (!box) return;
  var buttons = box.querySelectorAll("button[data-filter]");
  var cards = document.querySelectorAll(".project[data-domain]");
  var status = document.getElementById("filter-status");

  function apply(filter) {
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var domains = (card.getAttribute("data-domain") || "").split(" ");
      var match = filter === "all" || domains.indexOf(filter) !== -1;
      card.hidden = !match;
      if (match) shown++;
    });
    Array.prototype.forEach.call(buttons, function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === filter ? "true" : "false");
    });
    if (status) {
      status.textContent = (filter === "all" ? "Showing all " : "Showing " + shown + " " + filter + " ") +
        (shown === 1 ? "project" : "projects") + ".";
    }
  }

  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
  });
  box.hidden = false;
})();
