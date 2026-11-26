/* Ketuna forms (workshop sign-up, mentor interest, partner interest):
 * validation, honeypot, and sending to a configurable endpoint.
 * No dependencies. Never uses mailto.
 *
 * Markup contract, per form (any number of forms per page):
 *   <form class="js-form" data-form="workshop" data-endpoint="" novalidate>
 *     .js-soon / .js-error / .js-success   status boxes (siblings inside the same .form-card)
 *     fieldset.form-body                   disabled while sign-ups are closed
 *     button[type=submit]
 *   A field is checked when it has `required`, type="email" or type="tel".
 *   Its message goes to the element named by data-err="id"; data-msg overrides
 *   the default "required" message. Radio groups: put required, data-err,
 *   data-msg and data-box="<fieldset id>" on the first radio.
 *   The honeypot input is named "website" and is never sent. */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var forms = document.querySelectorAll("form.js-form");
  Array.prototype.forEach.call(forms, setup);

  function setup(form) {
    var card = form.closest(".form-card") || form.parentNode;
    var body = form.querySelector("fieldset.form-body");
    var submit = form.querySelector('button[type="submit"]');
    var boxSoon = card.querySelector(".js-soon");
    var boxError = card.querySelector(".js-error");
    var boxSuccess = card.querySelector(".js-success");

    var endpoint = String(form.getAttribute("data-endpoint") || cfg.formEndpoint || "").trim();
    var mode = cfg.formMode || "form";
    var validEndpoint = /^https:\/\//i.test(endpoint) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint);

    // State 1: no endpoint configured. Say so, and make the form inert.
    if (!validEndpoint) {
      if (boxSoon) boxSoon.hidden = false;
      if (body) body.disabled = true;
      submit.textContent = submit.getAttribute("data-soon-label") || "Opens soon";
      form.setAttribute("data-state", "soon");
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      return;
    }
    form.setAttribute("data-state", "ready");

    // Build the rules from the markup.
    var rules = [];
    var seenGroups = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === "website" || !el.getAttribute("data-err")) return;
      if (el.type === "radio") {
        if (seenGroups[el.name]) return;
        seenGroups[el.name] = true;
        rules.push({ group: el.name, el: el, box: el.getAttribute("data-box"), err: el.getAttribute("data-err"), check: function () {
          return form.querySelector('input[name="' + el.name + '"]:checked') ? "" : (el.getAttribute("data-msg") || "Please choose one option.");
        } });
        return;
      }
      rules.push({ el: el, err: el.getAttribute("data-err"), check: function () {
        var v = el.type === "checkbox" ? (el.checked ? "yes" : "") : String(el.value || "").trim();
        if (!v) return el.required ? (el.getAttribute("data-msg") || "Please fill in this field.") : "";
        if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email address, like name@example.com.";
        if (el.type === "tel") {
          var digits = v.replace(/\D/g, "");
          if (!/^\+?[\d\s\-()]+$/.test(v) || digits.length < 7 || digits.length > 15) return "Please enter a valid phone number, or leave it empty.";
        }
        if (el.getAttribute("minlength") && v.length < Number(el.getAttribute("minlength"))) return el.getAttribute("data-msg") || "Please write a little more.";
        return "";
      } });
    });

    function apply(rule) {
      var msg = rule.check();
      var errEl = document.getElementById(rule.err);
      if (errEl) errEl.textContent = msg;
      if (rule.group) {
        var radios = form.querySelectorAll('input[name="' + rule.group + '"]');
        for (var i = 0; i < radios.length; i++) radios[i].setAttribute("aria-invalid", msg ? "true" : "false");
        var box = rule.box && document.querySelector("#" + rule.box + " .radios");
        if (box) box.classList.toggle("invalid", !!msg);
      } else {
        rule.el.setAttribute("aria-invalid", msg ? "true" : "false");
      }
      return msg;
    }

    // Re-check a field once the person leaves it, or as they fix an error.
    rules.forEach(function (rule) {
      var els = rule.group ? form.querySelectorAll('input[name="' + rule.group + '"]') : [rule.el];
      Array.prototype.forEach.call(els, function (el) {
        el.addEventListener("change", function () { apply(rule); });
        el.addEventListener("blur", function () { if (el.value || el.getAttribute("aria-invalid") === "true") apply(rule); });
      });
    });

    function showError(html) {
      boxError.innerHTML = html;
      boxError.hidden = false;
      boxError.focus();
    }

    function payload() {
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === "website" || el.disabled) return;
        if (el.type === "radio") { if (el.checked) data[el.name] = el.value; else if (!(el.name in data)) data[el.name] = ""; return; }
        if (el.type === "checkbox") {
          if (el.name === "consent") { data.consent = el.checked ? "yes" : "no"; return; }
          if (el.checked) data[el.name] = data[el.name] ? data[el.name] + "," + el.value : el.value;
          else if (!(el.name in data)) data[el.name] = "";
          return;
        }
        if (el.tagName === "BUTTON" || el.tagName === "FIELDSET") return;
        data[el.name] = String(el.value || "").trim();
      });
      data.form = form.getAttribute("data-form") || "";
      data.consent_version = cfg.consentVersion || "";
      data.submitted_at = new Date().toISOString();
      data.page = location.pathname;
      return data;
    }

    function send(data) {
      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
      var opts = { method: "POST", signal: ctrl ? ctrl.signal : undefined };
      if (mode === "json") {
        opts.headers = { "Content-Type": "application/json", "Accept": "application/json" };
        opts.body = JSON.stringify(data);
      } else {
        opts.body = new URLSearchParams(data);
        if (mode === "no-cors") opts.mode = "no-cors";
        else opts.headers = { "Accept": "application/json" };
      }
      return fetch(endpoint, opts).then(function (res) {
        if (timer) clearTimeout(timer);
        if (mode === "no-cors") return; // opaque reply: cannot be read
        if (!res.ok) throw new Error("HTTP " + res.status);
      }, function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
    }

    function succeed() {
      form.hidden = true;
      boxError.hidden = true;
      boxSuccess.hidden = false;
      boxSuccess.focus();
    }

    var busy = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      boxError.hidden = true;

      var problems = [];
      rules.forEach(function (rule) {
        var msg = apply(rule);
        if (msg) problems.push({ rule: rule, msg: msg });
      });
      if (problems.length) {
        var items = problems.map(function (p) {
          return '<li><a href="#' + p.rule.el.id + '">' + escapeHtml(p.msg) + "</a></li>";
        }).join("");
        showError("<h3>Please fix " + (problems.length === 1 ? "1 thing" : problems.length + " things") + "</h3><ul>" + items + "</ul>");
        return;
      }

      // Honeypot filled: almost certainly a bot. Pretend it worked, send nothing.
      if (form.elements.website && form.elements.website.value) { succeed(); return; }

      busy = true;
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Sending…";
      send(payload()).then(succeed, function () {
        showError("<h3>That didn't go through</h3><p>Nothing was sent, maybe because of the network. Your answers are still here; please try again in a minute.</p>");
      }).then(function () {
        busy = false;
        submit.disabled = false;
        submit.textContent = label;
      });
    });

    // Error-summary links: move focus to the field, not just scroll.
    boxError.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (!a) return;
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) { e.preventDefault(); el.focus(); el.scrollIntoView({ block: "center" }); }
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
})();
