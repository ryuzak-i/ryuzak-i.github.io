const CONFIG_PATH = "/config.json";

let config;
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

async function fetchJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Could not load ${path}: ${response.status}`);
    }

    return response.json();
}

async function fetchTranslations(languageCode) {
    if (translationsCache.has(languageCode)) {
        return translationsCache.get(languageCode);
    }

    const language = config.TEXTS.LANGUAGES[languageCode];
    const response = await fetch(language.XML_DOCUMENT_PATH);

    if (!response.ok) {
        throw new Error(`Could not load ${language.XML_DOCUMENT_PATH}: ${response.status}`);
    }

    const xmlString = await response.text();
    const xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");

    if (xmlDocument.querySelector("parsererror")) {
        throw new Error(`Could not parse ${language.XML_DOCUMENT_PATH}`);
    }

    const translations = {};
    const textElements = xmlDocument.getElementsByTagName(config.TEXTS.XML_TAG_NAME);

    for (const textElement of textElements) {
        const id = textElement.getAttribute(config.TEXTS.XML_ATTRIBUTE_ID_NAME);
        const value = textElement.getAttribute(config.TEXTS.XML_ATTRIBUTE_VALUE_NAME);

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

function updateLanguageControls(languageCode, isLoading = false) {
    for (const button of document.querySelectorAll("[data-language]")) {
        const isActive = button.dataset.language === languageCode;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
        button.disabled = isLoading;
    }
}

async function setLanguage(languageCode) {
    const supportedLanguages = Object.keys(config.TEXTS.LANGUAGES);
    const defaultLanguage = config.TEXTS.DEFAULT_LANGUAGE;
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

        applyTranslations({ ...defaultTranslations, ...selectedTranslations });
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
        config = await fetchJson(CONFIG_PATH);
        const supportedLanguages = Object.keys(config.TEXTS.LANGUAGES);
        const initialLanguage = getInitialLanguage(
            supportedLanguages,
            config.TEXTS.DEFAULT_LANGUAGE
        );

        for (const button of document.querySelectorAll("[data-language]")) {
            button.addEventListener("click", () => setLanguage(button.dataset.language));
        }

        await setLanguage(initialLanguage);
    }
    catch (error) {
        document.body.removeAttribute("aria-busy");
        console.error("Localization initialization failed.", error);
    }
}

initializeLocalization();
