/*
 * Site configuration: the only file to edit when connecting the sign-up form.
 * See site/README.md, "Connect the form".
 *
 * formEndpoint  The https:// URL that receives each form (workshop, mentor, partner) as a POST.
 *               Leave it "" and every form shows its "opens soon" state and sends nothing.
 *               (A data-endpoint="..." attribute on a <form class="js-form">,
 *               if not empty, overrides this value.)
 *
 * formMode      How the browser sends the data:
 *               "json"     POST application/json; success = HTTP 2xx. Use when the
 *                          receiver accepts JSON and allows cross-origin requests.
 *               "form"     POST application/x-www-form-urlencoded; success = HTTP 2xx.
 *                          The format most hosted form services accept.
 *               "no-cors"  POST urlencoded without reading the reply. Use only for a
 *                          receiver that does not send CORS headers (some spreadsheet
 *                          script web apps). The page cannot tell if the receiver failed,
 *                          so test it by checking that rows arrive.
 *
 * consentVersion  Stored with every sign-up so you know which privacy note the
 *                 person agreed to. Change it whenever privacy.html changes.
 */
window.SITE_CONFIG = {
  formEndpoint: "",
  formMode: "form",
  consentVersion: "privacy-draft-0.2"
};
