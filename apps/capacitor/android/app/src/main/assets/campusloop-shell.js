// Injected at document start into https://campusloop.space pages by ShellPlugin.
// Fills gaps of Android WebView so the website behaves like it does in Chrome:
//  - navigator.share / navigator.canShare (WebView has no Web Share API), files included.
//  - <a download> with blob: or data: URLs (WebView ignores them): saved to the phone.
// Calls go to the native CampusLoopShell plugin through the Capacitor bridge, which is
// looked up lazily because this script can run before Capacitor's own.
(function () {
  if (window.__campusLoopShell) return;
  window.__campusLoopShell = true;

  function call(method, options) {
    var cap = window.Capacitor;
    if (!cap || typeof cap.nativePromise !== "function") {
      return Promise.reject(new Error("CampusLoop app bridge is not ready"));
    }
    return cap.nativePromise("CampusLoopShell", method, options);
  }

  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var s = String(reader.result);
        resolve(s.slice(s.indexOf(",") + 1));
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsDataURL(blob);
    });
  }

  if (typeof navigator.share !== "function") {
    navigator.share = function (data) {
      data = data || {};
      var files = Array.prototype.slice.call(data.files || []);
      return Promise.all(
        files.map(function (file) {
          return toBase64(file).then(function (b64) {
            return { name: file.name || "file", type: file.type || "application/octet-stream", data: b64 };
          });
        })
      )
        .then(function (list) {
          return call("share", {
            title: data.title || "",
            text: data.text || "",
            url: data.url || "",
            files: list,
          });
        })
        .then(function () {
          return undefined;
        });
    };
    navigator.canShare = function (data) {
      if (!data) return false;
      return Boolean(data.url || data.text || data.title || (data.files && data.files.length));
    };
  }

  function isLocalHref(href) {
    return /^(blob|data):/i.test(href || "");
  }

  function save(anchor) {
    var name = anchor.getAttribute("download") || "campusloop-download";
    fetch(anchor.href)
      .then(function (res) {
        return res.blob();
      })
      .then(function (blob) {
        return toBase64(blob).then(function (b64) {
          return call("saveFile", { name: name, type: blob.type || "application/octet-stream", data: b64 });
        });
      })
      .catch(function (err) {
        console.warn("CampusLoop app: download failed", err);
      });
  }

  // Programmatic downloads: const a = document.createElement("a"); a.download = "x.png"; a.click();
  var nativeClick = HTMLElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download") && isLocalHref(this.href)) {
      save(this);
      return;
    }
    return nativeClick.call(this);
  };

  // Downloads the user taps directly.
  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest("a[download]") : null;
      if (anchor && isLocalHref(anchor.href)) {
        event.preventDefault();
        save(anchor);
      }
    },
    true
  );
})();
