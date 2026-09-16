const CONFIG_PATH = "/config.json";
const XML_TEXT_TAG = "Text";
const XML_ID_ATTRIBUTE = "Id";
const XML_VALUE_ATTRIBUTE = "Value";

let localizationConfig;
let currentLanguageCode = null;
let latestLanguageRequest = 0;
const translationsCache = new Map();

function normalizeLanguageCode(languageCode) {
    return String(languageCode || "").toLowerCase().split("-")[0];
}

function getInitialLanguage(supportedLanguages, defaultLanguage) {
    const browserLanguages = navigator.languages?.length
        ? navigator.languages
        : [navigator.language];

    for (const browserLanguage of browserLanguages) {
        const normalizedCandidate = normalizeLanguageCode(browserLanguage);

        if (supportedLanguages.includes(normalizedCandidate)) {
            return normalizedCandidate;
        }
    }

    return defaultLanguage;
}

function waitForDocument() {
    if (document.readyState !== "loading") {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
}

async function fetchJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path}: ${response.status}`);
    }

    return response.json();
}

function validateLocalizationConfig(config) {
    const localization = config?.localization;

    if (!localization || typeof localization !== "object") {
        throw new Error("Localization configuration is missing.");
    }

    const { defaultLanguage, languages } = localization;

    if (typeof defaultLanguage !== "string" || !defaultLanguage) {
        throw new Error("Default language is not configured.");
    }

    if (!languages || typeof languages !== "object" || Array.isArray(languages)) {
        throw new Error("Supported languages are not configured.");
    }

    if (!Object.prototype.hasOwnProperty.call(languages, defaultLanguage)) {
        throw new Error(`Default language "${defaultLanguage}" is not supported.`);
    }

    for (const [languageCode, translationPath] of Object.entries(languages)) {
        if (typeof translationPath !== "string" || !translationPath) {
            throw new Error(`Translation path for "${languageCode}" is invalid.`);
        }
    }

    return localization;
}

async function fetchTranslations(languageCode) {
    if (translationsCache.has(languageCode)) {
        return translationsCache.get(languageCode);
    }

    const translationPath = localizationConfig.languages[languageCode];

    if (!translationPath) {
        throw new Error(`Unsupported language: ${languageCode}`);
    }

    const response = await fetch(translationPath);

    if (!response.ok) {
        throw new Error(`Could not load ${translationPath}: ${response.status}`);
    }

    const xmlString = await response.text();
    const xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");

    if (xmlDocument.querySelector("parsererror")) {
        throw new Error(`Could not parse ${translationPath}`);
    }

    const translations = {};
    const textElements = xmlDocument.getElementsByTagName(XML_TEXT_TAG);

    for (const textElement of textElements) {
        const id = textElement.getAttribute(XML_ID_ATTRIBUTE);
        const value = textElement.getAttribute(XML_VALUE_ATTRIBUTE);

        if (id && value !== null) {
            translations[id] = value;
        }
    }

    translationsCache.set(languageCode, translations);
    return translations;
}

function applyTranslations(translations) {
    for (const [id, value] of Object.entries(translations)) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }
}

function updateSeoMetadata(translations, languageCode) {
    const metadataTranslations = {
        title: [
            'meta[property="og:title"]',
            'meta[name="twitter:title"]'
        ],
        seo_description: [
            'meta[name="description"]',
            'meta[property="og:description"]',
            'meta[name="twitter:description"]'
        ],
        seo_image_alt: [
            'meta[property="og:image:alt"]',
            'meta[name="twitter:image:alt"]'
        ]
    };

    for (const [translationId, selectors] of Object.entries(metadataTranslations)) {
        const value = translations[translationId];

        if (!value) {
            continue;
        }

        for (const selector of selectors) {
            document.querySelector(selector)?.setAttribute("content", value);
        }
    }

    const locale = languageCode === "uk" ? "uk_UA" : "en_US";
    const alternateLocale = languageCode === "uk" ? "en_US" : "uk_UA";
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", locale);
    document.querySelector('meta[property="og:locale:alternate"]')
        ?.setAttribute("content", alternateLocale);
}

function updateLanguageControls(languageCode, isLoading = false) {
    for (const button of document.querySelectorAll("[data-language]")) {
        const isActive = button.dataset.language === languageCode;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
        button.disabled = isLoading;
    }
}

async function setLanguage(languageCode) {
    const supportedLanguages = Object.keys(localizationConfig.languages);
    const defaultLanguage = localizationConfig.defaultLanguage;
    const normalizedLanguage = normalizeLanguageCode(languageCode);
    const selectedLanguage = supportedLanguages.includes(normalizedLanguage)
        ? normalizedLanguage
        : defaultLanguage;

    if (selectedLanguage === currentLanguageCode) {
        return;
    }

    const requestId = ++latestLanguageRequest;
    document.body.setAttribute("aria-busy", "true");
    updateLanguageControls(currentLanguageCode, true);

    try {
        const defaultTranslationsPromise = fetchTranslations(defaultLanguage);
        const selectedTranslationsPromise = selectedLanguage === defaultLanguage
            ? defaultTranslationsPromise
            : fetchTranslations(selectedLanguage);
        const [defaultTranslations, selectedTranslations] = await Promise.all([
            defaultTranslationsPromise,
            selectedTranslationsPromise
        ]);

        if (requestId !== latestLanguageRequest) {
            return;
        }

        const translations = { ...defaultTranslations, ...selectedTranslations };
        applyTranslations(translations);
        updateSeoMetadata(translations, selectedLanguage);
        currentLanguageCode = selectedLanguage;
        document.documentElement.lang = selectedLanguage;
        updateLanguageControls(selectedLanguage);

        document.dispatchEvent(new CustomEvent("languagechange", {
            detail: { languageCode: selectedLanguage }
        }));
    }
    catch (error) {
        console.error("Language loading failed.", error);
    }
    finally {
        if (requestId === latestLanguageRequest) {
            document.body.removeAttribute("aria-busy");
            updateLanguageControls(currentLanguageCode);
        }
    }
}

async function initializeLocalization() {
    try {
        const config = await fetchJson(CONFIG_PATH);
        localizationConfig = validateLocalizationConfig(config);
        const supportedLanguages = Object.keys(localizationConfig.languages);
        const defaultLanguage = localizationConfig.defaultLanguage;
        const initialLanguage = getInitialLanguage(
            supportedLanguages,
            defaultLanguage
        );

        const initialTranslationsPromise = Promise.all([
            fetchTranslations(defaultLanguage),
            initialLanguage === defaultLanguage
                ? Promise.resolve()
                : fetchTranslations(initialLanguage)
        ]);

        await Promise.all([
            waitForDocument(),
            initialTranslationsPromise
        ]);

        for (const button of document.querySelectorAll("[data-language]")) {
            button.addEventListener("click", () => setLanguage(button.dataset.language));
        }

        await setLanguage(initialLanguage);
    }
    catch (error) {
        document.body?.removeAttribute("aria-busy");
        console.error("Localization initialization failed.", error);
    }
}

initializeLocalization();
