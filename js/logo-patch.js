/* Properties 714 — shared sidebar logo patch */
/* Logo is now 714 everywhere — this file handles dynamic injection */
document.addEventListener('DOMContentLoaded', function() {
  // Fix any logo that still says P7 or Σ
  document.querySelectorAll('.sb-logo, .sa-logo-box, .nav-logo-box').forEach(function(el) {
    if (el.textContent.trim() === 'P7' || el.textContent.trim() === '\u03a3' || el.textContent.trim() === 'M') {
      el.textContent = '714';
      el.style.fontSize = '11px';
      el.style.letterSpacing = '-0.03em';
    }
  });
});
