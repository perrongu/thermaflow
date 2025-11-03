/**
 * i18n.js - Runtime i18n léger (UI uniquement)
 * - FR par défaut, EN/ES/PT supportés
 * - Dictionnaires attendus: window.I18N_FR/EN/ES/PT
 * - API: I18n.init(), I18n.setLanguage(lang), I18n.getCurrentLanguage(), I18n.t(key, vars), I18n.applyTranslations(root)
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'thermaflow_lang';
  const SUPPORTED = ['fr', 'en', 'es', 'pt'];

  let currentLang = 'fr';
  let dicts = {
    fr: window.I18N_FR || {},
    en: window.I18N_EN || {},
    es: window.I18N_ES || {},
    pt: window.I18N_PT || {}
  };

  function getSavedLang() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && SUPPORTED.includes(v)) return v;
    } catch (e) {}
    return null;
  }

  function detectBrowserLang() {
    const nav = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
    const base = nav.slice(0, 2);
    return SUPPORTED.includes(base) ? base : 'fr';
  }

  function setHtmlLang(lang) {
    try { document.documentElement.setAttribute('lang', lang); } catch (e) {}
  }

  function format(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function(_, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : '{' + k + '}';
    });
  }

  function getKey(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, parts[i])) {
        cur = cur[parts[i]];
      } else {
        return null;
      }
    }
    return typeof cur === 'string' ? cur : null;
  }

  function t(key, vars) {
    const d = dicts[currentLang] || {};
    let str = getKey(d, key);
    if (!str) {
      // fallback FR
      str = getKey(dicts.fr || {}, key) || key;
    }
    return format(str, vars);
  }

  function applyTranslations(root) {
    const scope = root || document;
    if (!scope) return;
    // Elements with data-i18n -> textContent (exclure SELECT qui garde ses options)
    const nodes = scope.querySelectorAll('[data-i18n]');
    nodes.forEach(function(el) {
      // Ne pas traduire le contenu des SELECT, seulement leurs attributs
      if (el.tagName === 'SELECT') return;
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const varsAttr = el.getAttribute('data-i18n-vars');
      const vars = varsAttr ? JSON.parse(varsAttr) : null;
      el.textContent = t(key, vars);
    });
    // Elements with data-i18n-attr="attrName" (pour SELECT et autres)
    const attrNodes = scope.querySelectorAll('[data-i18n-attr]');
    attrNodes.forEach(function(el) {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      if (!key || !attr) return;
      el.setAttribute(attr, t(key));
    });
  }

  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'fr';
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    setHtmlLang(lang);
    applyTranslations(document);
    
    // Recréer les options du dropdown après applyTranslations
    const sel = document.getElementById('lang-select');
    if (sel && sel.options.length === 0) {
      const langs = ['fr', 'en', 'es', 'pt'];
      const labels = ['FR', 'EN', 'ES', 'PT'];
      langs.forEach((l, i) => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = labels[i];
        if (l === lang) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.value = lang;
    } else if (sel) {
      sel.value = lang;
    }
    
    const evt = new CustomEvent('thermaflow:language-changed', { detail: { lang } });
    document.dispatchEvent(evt);
    console.log('🌐 I18n: événement language-changed dispatché →', lang);
  }

  function init() {
    const saved = getSavedLang();
    const initial = saved || detectBrowserLang();
    currentLang = initial;
    setHtmlLang(initial);
    
    // Appliquer les traductions AVANT de créer les options du dropdown
    applyTranslations(document);
    
    // Sync dropdown if exists
    const sel = document.getElementById('lang-select');
    if (sel) {
      // Créer les options si elles n'existent pas (protection contre applyTranslations)
      if (sel.options.length === 0) {
        const langs = ['fr', 'en', 'es', 'pt'];
        const labels = ['FR', 'EN', 'ES', 'PT'];
        langs.forEach((lang, i) => {
          const opt = document.createElement('option');
          opt.value = lang;
          opt.textContent = labels[i];
          if (lang === initial) opt.selected = true;
          sel.appendChild(opt);
        });
      }
      sel.value = initial;
      sel.addEventListener('change', function() {
        setLanguage(sel.value);
      });
    }
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  window.I18n = {
    init,
    setLanguage,
    getCurrentLanguage,
    t,
    applyTranslations
  };

  document.addEventListener('DOMContentLoaded', function() {
    // Auto-init only if dictionaries exist
    if (window.I18N_FR || window.I18N_EN || window.I18N_ES || window.I18N_PT) {
      init();
    }
  });
})();


