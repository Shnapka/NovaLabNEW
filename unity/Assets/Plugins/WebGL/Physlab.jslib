mergeInto(LibraryManager.library, {
  PhyslabPost: function (ptr) {
    var s = UTF8ToString(ptr);
    try {
      var m = JSON.parse(s);
      m.source = "physlab-module";
      window.parent.postMessage(m, "*");
    } catch (e) {}
  }
});
