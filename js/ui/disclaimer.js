/**
 * disclaimer.js
 *
 * Disclaimer modal management: display, focus trap, i18n content,
 * and session-level acceptance tracking.
 *
 * Extracted from app.js (Phase 2, Item 7).
 * The onAccepted callback connects back to the app orchestrator.
 */

(function () {
  'use strict';

  // Callback to invoke when the user accepts the disclaimer.
  // Set by showDisclaimerModal() — avoids a direct circular dependency on app.js.
  let _onAccepted = null;

  // ========== VÉRIFICATION ACCEPTATION ==========

  /**
   * Checks whether the user already accepted the disclaimer this session.
   * @returns {boolean} true if already accepted
   */
  function checkDisclaimerAccepted() {
    return sessionStorage.getItem('thermaflow_disclaimer_accepted') === 'true';
  }

  // ========== MISE À JOUR CONTENU ==========

  /**
   * Builds a paragraph element from an array of segment objects.
   * Each segment: { text: string, bold?: true }
   *
   * @param {Array<{text: string, bold?: boolean}>} segments
   * @returns {HTMLParagraphElement}
   */
  function buildParagraph(segments) {
    const p = document.createElement('p');
    segments.forEach(function (seg) {
      if (seg.bold) {
        const strong = document.createElement('strong');
        strong.textContent = seg.text;
        p.appendChild(strong);
      } else {
        p.appendChild(document.createTextNode(seg.text));
      }
    });
    return p;
  }

  /**
   * Fills the modal with translated content using safe DOM construction.
   * No innerHTML is used — XSS safe regardless of i18n data source.
   *
   * @param {HTMLElement} title   - Modal title element
   * @param {HTMLElement} content - Modal content element
   * @param {HTMLElement} button  - Accept button element
   */
  function updateDisclaimerContent(title, content, button) {
    if (!window.I18n) {
      // Fallback if I18n not yet available
      title.textContent = "Avertissement et conditions d'utilisation";
      content.textContent = '';
      const fallbackP1 = document.createElement('p');
      fallbackP1.textContent =
        "Cette application fournit une estimation du risque de gel dans des conduites d'eau à partir de modèles thermiques et hydrauliques validés.";
      const fallbackP2 = document.createElement('p');
      fallbackP2.appendChild(
        document.createTextNode("Les résultats ne doivent être utilisés qu'à titre ")
      );
      const strong = document.createElement('strong');
      strong.textContent = 'indicatif';
      fallbackP2.appendChild(strong);
      fallbackP2.appendChild(document.createTextNode('.'));
      content.appendChild(fallbackP1);
      content.appendChild(fallbackP2);
      button.textContent = "J'accepte";
      return;
    }

    title.textContent = window.I18n.t('disclaimer.title');

    // Build paragraphs from structured segment arrays — no innerHTML, XSS safe
    const paragraphs = window.I18n.t('disclaimer.paragraphs');
    content.textContent = '';
    if (Array.isArray(paragraphs)) {
      paragraphs.forEach(function (segments) {
        content.appendChild(buildParagraph(segments));
      });
    }

    button.textContent = window.I18n.t('disclaimer.accept');
  }

  // ========== FOCUS TRAP ==========

  /**
   * Traps keyboard focus inside the modal for accessibility.
   * @param {HTMLElement} modal  - Modal element
   * @param {HTMLElement} button - First focusable element (accept button)
   */
  function setupFocusTrap(modal, button) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = function (e) {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        // SHIFT + TAB
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // TAB
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);

    // Delay focus by 100 ms to ensure the CSS display transition has completed
    // before the browser processes the focus call (instant focus on display:none fails).
    setTimeout(() => button.focus(), 100);
  }

  // ========== AFFICHER LE MODAL ==========

  /**
   * Displays the disclaimer modal with i18n content, language switcher,
   * and focus trap.
   *
   * @param {Function} onAccepted - Callback to invoke after user accepts.
   *   Defaults to the stored _onAccepted callback.
   */
  function showDisclaimerModal(onAccepted) {
    if (typeof onAccepted === 'function') {
      _onAccepted = onAccepted;
    }

    const modal = document.getElementById('disclaimer-modal');
    const title = document.getElementById('disclaimer-title');
    const content = document.getElementById('disclaimer-content');
    const button = document.getElementById('disclaimer-accept');

    if (!modal || !title || !content || !button) {
      console.error('Éléments du modal disclaimer manquants');
      // If modal elements are missing, proceed with app initialization anyway
      if (typeof _onAccepted === 'function') {
        _onAccepted();
      }
      return;
    }

    // Fill with i18n translations
    updateDisclaimerContent(title, content, button);

    // Show the modal
    modal.style.display = 'flex';

    // Configure language selector
    const langSelect = document.getElementById('disclaimer-lang-select');
    if (langSelect && window.I18n) {
      const currentLang = window.I18n.getCurrentLanguage() || 'fr';
      const supportedLangs = ['fr', 'en', 'es', 'pt'];

      if (supportedLangs.includes(currentLang)) {
        langSelect.value = currentLang;
      } else {
        langSelect.value = 'fr'; // Safe fallback
      }

      langSelect.addEventListener('change', function () {
        const newLang = this.value;
        window.I18n.setLanguage(newLang);
        updateDisclaimerContent(title, content, button);
      });
    }

    // Configure focus trap for accessibility
    setupFocusTrap(modal, button);

    // Handle acceptance
    button.addEventListener('click', handleDisclaimerAccept, { once: true });
  }

  // ========== GÉRER L'ACCEPTATION ==========

  /**
   * Records disclaimer acceptance and triggers the onAccepted callback.
   */
  function handleDisclaimerAccept() {
    sessionStorage.setItem('thermaflow_disclaimer_accepted', 'true');
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    if (typeof _onAccepted === 'function') {
      _onAccepted();
    }
  }

  // ========== EXPORTS ==========

  const DisclaimerModal = {
    checkDisclaimerAccepted,
    showDisclaimerModal,
    handleDisclaimerAccept,
    updateDisclaimerContent,
    setupFocusTrap,
  };

  // Browser export
  if (typeof window !== 'undefined') {
    window.DisclaimerModal = DisclaimerModal;
  }

  // Node.js export (for tests)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisclaimerModal;
  }
})();
