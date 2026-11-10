/*! Login with CampusLoop SDK v1 | https://campusloop.space/developers
 * OAuth 2.0 Authorization Code + PKCE for browser apps. No dependencies.
 *
 *   CampusLoop.init({ clientId, redirectUri, scope? })
 *   CampusLoop.renderButton(element, { theme?: "light" | "dark", size?: "large" | "medium", text?: string })
 *   CampusLoop.login({ prompt? })          redirects to CampusLoop
 *   CampusLoop.handleRedirect()           on your redirect page: returns { user, idToken, accessToken, refreshToken, expiresIn, scope }
 *   CampusLoop.getUserInfo(accessToken)   fresh claims from /oauth/userinfo
 *
 * The SDK decodes the id_token for convenience but does not verify it.
 * Always verify the id_token on your server with the JWKS before trusting it:
 * https://campusloop.space/developers#verify
 */
(function (w) {
  "use strict";
  var ISSUER = "https://campusloop.space";
  var KEY = "campusloop_oauth";
  var cfg = null;
  var LOGO = '<svg width="20" height="20" viewBox="260 230 490 510" aria-hidden="true"><defs><linearGradient id="clsdkg" x1="82%" y1="18%" x2="28%" y2="82%"><stop offset="0%" stop-color="#D19EFF"/><stop offset="35%" stop-color="#B985FF"/><stop offset="100%" stop-color="#9D6CFF"/></linearGradient></defs><path fill="url(#clsdkg)" d="M 491.50 259.00 C 441.40 264.70, 395.40 286.20, 358.40 321.30 C 323.10 354.70, 298.90 400.70, 290.50 450.00 C 289.60 455.20, 288.60 467.80, 288.30 478.00 C 286.90 525.40, 299.40 569.30, 325.80 609.50 C 348.60 644.40, 378.80 671.10, 415.50 689.00 C 462.00 711.70, 513.00 718.40, 563.00 708.40 C 628.10 695.20, 682.50 653.90, 712.60 594.60 C 719.60 580.90, 723.00 572.30, 723.00 568.10 C 723.00 564.70, 718.70 558.40, 715.20 556.60 C 712.70 555.30, 687.20 547.00, 642.50 532.80 C 616.70 524.60, 618.20 524.30, 607.00 541.50 C 591.50 565.50, 565.30 583.10, 537.00 588.50 C 527.40 590.40, 508.80 590.40, 498.40 588.60 C 451.80 580.40, 417.80 543.70, 410.40 493.80 C 406.10 464.50, 414.40 433.90, 433.40 409.00 C 448.10 389.70, 467.90 376.90, 494.00 369.80 C 500.10 368.10, 504.60 367.70, 518.50 367.60 C 533.20 367.60, 536.80 367.90, 545.00 369.90 C 571.00 376.40, 593.40 390.90, 609.70 411.80 C 613.30 416.30, 617.00 420.50, 618.00 421.00 C 620.90 422.50, 628.70 422.20, 632.30 420.40 C 634.10 419.50, 646.30 412.70, 659.50 405.30 C 711.00 376.30, 710.70 376.50, 709.60 370.00 C 708.40 362.50, 690.20 339.00, 672.40 322.10 C 637.60 288.80, 595.40 268.40, 545.30 260.50 C 533.50 258.60, 502.50 257.80, 491.50 259.00 Z"/></svg>';

  function b64url(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function random(n) {
    return b64url(crypto.getRandomValues(new Uint8Array(n || 32)));
  }
  function sha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (h) {
      return b64url(new Uint8Array(h));
    });
  }
  function decodeJwt(token) {
    var part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    var json = decodeURIComponent(
      atob(part + "===".slice((part.length + 3) % 4))
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(json);
  }
  function need() {
    if (!cfg) throw new Error("CampusLoop: call CampusLoop.init({ clientId, redirectUri }) first");
    return cfg;
  }

  var api = {
    version: "1.0.0",

    init: function (options) {
      if (!options || !options.clientId || !options.redirectUri) throw new Error("CampusLoop.init needs clientId and redirectUri");
      cfg = { clientId: options.clientId, redirectUri: options.redirectUri, scope: options.scope || "openid profile student" };
      return api;
    },

    login: function (options) {
      var c = need();
      var verifier = random(32);
      var state = random(16);
      var nonce = random(16);
      return sha256(verifier).then(function (challenge) {
        sessionStorage.setItem(KEY, JSON.stringify({ verifier: verifier, state: state, nonce: nonce, redirectUri: c.redirectUri, clientId: c.clientId }));
        var p = new URLSearchParams({
          response_type: "code",
          client_id: c.clientId,
          redirect_uri: c.redirectUri,
          scope: c.scope,
          state: state,
          nonce: nonce,
          code_challenge: challenge,
          code_challenge_method: "S256",
        });
        if (options && options.prompt) p.set("prompt", options.prompt);
        w.location.assign(ISSUER + "/oauth/authorize?" + p.toString());
      });
    },

    handleRedirect: function () {
      var q = new URLSearchParams(w.location.search);
      var saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      sessionStorage.removeItem(KEY);
      if (q.get("error")) return Promise.reject(new Error(q.get("error_description") || q.get("error")));
      if (!q.get("code")) return Promise.reject(new Error("CampusLoop: no authorization code in the URL"));
      if (!saved || saved.state !== q.get("state")) return Promise.reject(new Error("CampusLoop: state mismatch, start sign-in again"));
      if (q.get("iss") && q.get("iss") !== ISSUER) return Promise.reject(new Error("CampusLoop: unexpected issuer"));
      var body = new URLSearchParams({
        grant_type: "authorization_code",
        code: q.get("code"),
        redirect_uri: saved.redirectUri,
        client_id: saved.clientId,
        code_verifier: saved.verifier,
      });
      return fetch(ISSUER + "/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
        .then(function (r) {
          return r.json().then(function (j) {
            if (!r.ok) throw new Error(j.error_description || j.error || "Token exchange failed");
            return j;
          });
        })
        .then(function (t) {
          var claims = t.id_token ? decodeJwt(t.id_token) : {};
          if (t.id_token && (claims.nonce !== saved.nonce || claims.aud !== saved.clientId || claims.iss !== ISSUER)) {
            throw new Error("CampusLoop: id_token did not match this sign-in");
          }
          // Remove ?code=&state= from the address bar.
          if (w.history && w.history.replaceState) w.history.replaceState(null, "", w.location.pathname + w.location.hash);
          return { user: claims, idToken: t.id_token || null, accessToken: t.access_token, refreshToken: t.refresh_token || null, expiresIn: t.expires_in, scope: t.scope };
        });
    },

    getUserInfo: function (accessToken) {
      return fetch(ISSUER + "/oauth/userinfo", { headers: { Authorization: "Bearer " + accessToken } }).then(function (r) {
        if (!r.ok) throw new Error("CampusLoop: userinfo failed (" + r.status + ")");
        return r.json();
      });
    },

    renderButton: function (el, options) {
      need();
      var o = options || {};
      var dark = o.theme === "dark";
      var large = o.size !== "medium";
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", o.text || "Continue with CampusLoop");
      b.innerHTML = LOGO + "<span>" + (o.text || "Continue with CampusLoop").replace(/[<>&]/g, "") + "</span>";
      var s = b.style;
      s.display = "inline-flex";
      s.alignItems = "center";
      s.justifyContent = "center";
      s.gap = "10px";
      s.height = large ? "48px" : "40px";
      s.padding = large ? "0 20px" : "0 16px";
      s.borderRadius = "12px";
      s.border = dark ? "1px solid #1F1B2E" : "1px solid #D9D4E4";
      s.background = dark ? "#1F1B2E" : "#FFFFFF";
      s.color = dark ? "#FFFFFF" : "#1F1B2E";
      s.font = "700 " + (large ? "15px" : "14px") + " Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      s.cursor = "pointer";
      s.boxShadow = "0 1px 2px rgba(31,27,46,.08)";
      b.onclick = function () {
        b.disabled = true;
        b.style.opacity = "0.7";
        api.login().catch(function () {
          b.disabled = false;
          b.style.opacity = "1";
        });
      };
      el.innerHTML = "";
      el.appendChild(b);
      return b;
    },
  };

  w.CampusLoop = api;
})(window);
