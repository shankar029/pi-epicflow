// Injects a "Copy" chip into every code block on hover.
// Per design spec: pill chip, top right, JetBrains Mono label-sm, all caps.

(function () {
  'use strict';

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) {
        document.body.removeChild(ta);
        reject(e);
      }
    });
  }

  function attach(block) {
    if (block.querySelector('.copy-btn')) return;

    // The actual `<pre>` we want to read from
    var pre = block.tagName === 'PRE' ? block : block.querySelector('pre');
    if (!pre) return;

    // Skip inline + very short snippets (e.g. badge alt text)
    if ((pre.innerText || '').trim().length < 8) return;

    // Make sure positioning works — kinetic.css already sets `position: relative`
    // on highlighter-rouge / pre, but add it here too as a safety net.
    if (getComputedStyle(block).position === 'static') {
      block.style.position = 'relative';
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.textContent = 'Copy';

    btn.addEventListener('click', function () {
      var text = pre.innerText.replace(/\u00A0/g, ' ');
      copy(text).then(
        function () {
          btn.textContent = 'Copied';
          btn.setAttribute('data-copied', 'true');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.removeAttribute('data-copied');
          }, 1600);
        },
        function () {
          btn.textContent = 'Error';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
        }
      );
    });

    block.appendChild(btn);
  }

  function init() {
    // Two cases:
    //   1. Rouge wraps: <div class="highlighter-rouge"><div class="highlight"><pre>...</pre></div></div>
    //   2. Plain markdown without rouge:  <pre><code>...</code></pre>
    var wrappers = document.querySelectorAll('.prose div.highlighter-rouge, .prose div.highlight');
    wrappers.forEach(attach);

    // For plain <pre> not inside a rouge wrapper
    document.querySelectorAll('.prose pre').forEach(function (pre) {
      if (pre.closest('.highlighter-rouge') || pre.closest('.highlight')) return;
      attach(pre);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
