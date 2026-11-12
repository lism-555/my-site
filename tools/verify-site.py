"""tools/verify-site.py — checks the site the way a reader would meet it.

    python tools/verify-site.py

Checks, for every page:
  · the HTML tags balance and nest properly
  · every local link and every asset reference points at a file that exists
  · no placeholder text is left anywhere
  · the notebook really has fifteen or more quotes
  · the workbench really has five or more plans
  · nav.html and the fallback inside nav.js are still the same markup
"""

import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

PAGES = ["index.html", "quotes.html", "project.html", "machine.html"]

PLACEHOLDERS = [
    "lorem ipsum", "todo", "tbd", "placeholder", "coming soon",
    "xxx", "fixme", "your text here",
]

failures = []
notes = []


def fail(page, message):
    failures.append("%s: %s" % (page, message))


class PageParser(HTMLParser):
    """Collects tags, attributes and text, and checks the nesting."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.refs = []
        self.text = []
        self.counts = {}
        self.classes = []

    def handle_starttag(self, tag, attrs):
        self.counts[tag] = self.counts.get(tag, 0) + 1
        attrs = dict(attrs)
        for name in ("href", "src"):
            if name in attrs:
                self.refs.append((name, attrs[name]))
        if "class" in attrs:
            self.classes.extend(attrs["class"].split())
        if tag not in VOID:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append("stray </%s> at %s" % (tag, self.getpos()))
            return
        open_tag, pos = self.stack.pop()
        if open_tag != tag:
            self.errors.append(
                "</%s> closes <%s> opened at line %d" % (tag, open_tag, pos[0])
            )

    def handle_data(self, data):
        self.text.append(data)

    def finish(self):
        for tag, pos in self.stack:
            self.errors.append("<%s> opened at line %d is never closed" % (tag, pos[0]))
        return self.errors


def local(ref):
    """Turn a reference into a path relative to the site root."""
    ref = ref.split("#")[0].split("?")[0]
    if not ref or ref.startswith(("http://", "https://", "mailto:", "data:", "//")):
        return None
    return ref


def main():
    # ---- pages -------------------------------------------------------
    parsed = {}
    for page in PAGES:
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            fail(page, "page is missing")
            continue
        with open(path, encoding="utf-8") as handle:
            source = handle.read()

        parser = PageParser()
        parser.feed(source)
        parser.close()
        for problem in parser.finish():
            fail(page, problem)

        parsed[page] = parser

        low = source.lower()
        for word in PLACEHOLDERS:
            if word in low:
                fail(page, "contains placeholder text: %r" % word)

    # ---- links and assets --------------------------------------------
    referenced = set()
    for page, parser in parsed.items():
        for kind, ref in parser.refs:
            target = local(ref)
            if target is None:
                continue
            referenced.add(target)
            if not os.path.exists(os.path.join(ROOT, target)):
                fail(page, "%s points at a missing file: %s" % (kind, target))

    # ---- the stylesheet and scripts reach their own assets ----------
    for css in ["style.css"]:
        path = os.path.join(ROOT, css)
        if not os.path.exists(path):
            fail(css, "stylesheet is missing")
            continue
        with open(path, encoding="utf-8") as handle:
            sheet = handle.read()
        # data: uris carry their own markup, so take them out first
        sheet = re.sub(r"url\((['\"])data:.*?\1\)", "", sheet, flags=re.S)
        for url in re.findall(r"url\((['\"]?)([^'\")]+)\1\)", sheet):
            target = local(url[1])
            if target is None:
                continue
            referenced.add(target)
            if not os.path.exists(os.path.join(ROOT, target)):
                fail(css, "url() points at a missing file: %s" % target)

    # ---- content the brief asks for ----------------------------------
    quotes = parsed["quotes.html"].counts.get("li", 0)
    plans = parsed["project.html"].counts.get("article", 0)
    if quotes < 15:
        fail("quotes.html", "only %d quotes, needs 15 or more" % quotes)
    else:
        notes.append("quotes.html holds %d quotes (needs 15+)" % quotes)

    if plans < 5:
        fail("project.html", "only %d plans, needs 5 or more" % plans)
    else:
        notes.append("project.html holds %d plans (needs 5+)" % plans)

    # ---- the navigation is written once ------------------------------
    nav_path = os.path.join(ROOT, "nav.html")
    js_path = os.path.join(ROOT, "nav.js")
    if os.path.exists(nav_path) and os.path.exists(js_path):
        with open(nav_path, encoding="utf-8") as handle:
            nav_html = handle.read()
        with open(js_path, encoding="utf-8") as handle:
            nav_js = handle.read()
        match = re.search(r"const NAV_FALLBACK = `([\s\S]*?)`;", nav_js)
        if not match:
            fail("nav.js", "no NAV_FALLBACK block found")
        else:
            strip = lambda text: text.replace("\r\n", "\n").strip()
            if strip(match.group(1)) != strip(nav_html):
                fail("nav.js", "the fallback copy has drifted away from nav.html")
            else:
                notes.append("nav.html and the nav.js fallback are identical")
    else:
        fail("nav.html", "navigation file is missing")

    # ---- report ------------------------------------------------------
    print("checked %d pages, %d referenced files" % (len(parsed), len(referenced)))
    for note in notes:
        print("  ok   %s" % note)
    if failures:
        print("")
        for problem in failures:
            print("  FAIL %s" % problem)
        print("\n%d problem(s) found." % len(failures))
        return 1
    print("\nEverything checks out.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
