const LOCALIZATION_CONFIG_PATH = "/config.json";
const TRANSLATION_ELEMENT_NAME = "Text";
const TRANSLATION_KEY_ATTRIBUTE = "Id";
const TRANSLATION_VALUE_ATTRIBUTE = "Value";

let localizationSettings;
let activeLanguageCode = null;
let latestLanguageRequestId = 0;
const translationCache = new Map();

function normalizeLanguageCode(languageCode) {
    return String(languageCode || "").toLowerCase().split("-")[0];
}

function selectInitialLanguage(supportedLanguageCodes, defaultLanguageCode) {
    const preferredBrowserLanguages = navigator.languages?.length
        ? navigator.languages
        : [navigator.language];

    for (const browserLanguageCode of preferredBrowserLanguages) {
        const normalizedLanguageCode = normalizeLanguageCode(browserLanguageCode);

        if (supportedLanguageCodes.includes(normalizedLanguageCode)) {
            return normalizedLanguageCode;
        }
    }

    return defaultLanguageCode;
}

function waitForDocumentReady() {
    if (document.readyState !== "loading") {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
}

async function fetchJsonResource(resourcePath) {
    const response = await fetch(resourcePath);

    if (!response.ok) {
        throw new Error(`Could not load ${resourcePath}: ${response.status}`);
    }

    return response.json();
}

function validateLocalizationConfig(rawConfig) {
    const localization = rawConfig?.localization;

    if (!localization || typeof localization !== "object") {
        throw new Error("Localization configuration is missing.");
    }

    const {
        defaultLanguage: defaultLanguageCode,
        languages: languageSettingsByCode
    } = localization;

    if (typeof defaultLanguageCode !== "string" || !defaultLanguageCode) {
        throw new Error("Default language is not configured.");
    }

    if (
        !languageSettingsByCode
        || typeof languageSettingsByCode !== "object"
        || Array.isArray(languageSettingsByCode)
    ) {
        throw new Error("Supported languages are not configured.");
    }

    if (!Object.prototype.hasOwnProperty.call(
        languageSettingsByCode,
        defaultLanguageCode
    )) {
        throw new Error(
            `Default language "${defaultLanguageCode}" is not supported.`
        );
    }

    for (const [languageCode, languageSettings] of Object.entries(
        languageSettingsByCode
    )) {
        if (!languageSettings || typeof languageSettings !== "object") {
            throw new Error(
                `Settings for language "${languageCode}" are invalid.`
            );
        }

        const { translationPath, openGraphLocale } = languageSettings;

        if (typeof translationPath !== "string" || !translationPath) {
            throw new Error(
                `Translation path for "${languageCode}" is invalid.`
            );
        }

        if (typeof openGraphLocale !== "string" || !openGraphLocale) {
            throw new Error(
                `Open Graph locale for "${languageCode}" is invalid.`
            );
        }
    }

    return {
        defaultLanguageCode,
        languageSettingsByCode
    };
}

async function loadTranslations(languageCode) {
    if (translationCache.has(languageCode)) {
        return translationCache.get(languageCode);
    }

    const languageSettings =
        localizationSettings.languageSettingsByCode[languageCode];

    if (!languageSettings) {
        throw new Error(`Unsupported language: ${languageCode}`);
    }

    const { translationPath } = languageSettings;

    const response = await fetch(translationPath);

    if (!response.ok) {
        throw new Error(
            `Could not load ${translationPath}: ${response.status}`
        );
    }

    const xmlSource = await response.text();
    const xmlDocument = new DOMParser().parseFromString(xmlSource, "text/xml");

    if (xmlDocument.querySelector("parsererror")) {
        throw new Error(`Could not parse ${translationPath}`);
    }

    const translationDictionary = {};
    const translationElements = xmlDocument.getElementsByTagName(
        TRANSLATION_ELEMENT_NAME
    );

    for (const translationElement of translationElements) {
        const translationKey = translationElement.getAttribute(
            TRANSLATION_KEY_ATTRIBUTE
        );
        const translatedText = translationElement.getAttribute(
            TRANSLATION_VALUE_ATTRIBUTE
        );

        if (translationKey && translatedText !== null) {
            translationDictionary[translationKey] = translatedText;
        }
    }

    translationCache.set(languageCode, translationDictionary);
    return translationDictionary;
}

function applyTextTranslations(translationDictionary) {
    for (const targetElement of document.querySelectorAll("[data-i18n]")) {
        const translationKey = targetElement.dataset.i18n;
        const translatedText = translationDictionary[translationKey];

        if (translatedText !== undefined) {
            targetElement.textContent = translatedText;
        }
    }
}

function updateLocalizedMetadata(translationDictionary, languageCode) {
    const metadataSelectorsByTranslationKey = {
        "page.title": [
            'meta[property="og:title"]',
            'meta[name="twitter:title"]'
        ],
        "seo.description": [
            'meta[name="description"]',
            'meta[property="og:description"]',
            'meta[name="twitter:description"]'
        ],
        "seo.imageAlt": [
            'meta[property="og:image:alt"]',
            'meta[name="twitter:image:alt"]'
        ]
    };

    for (const [translationKey, metadataSelectors] of Object.entries(
        metadataSelectorsByTranslationKey
    )) {
        const translatedText = translationDictionary[translationKey];

        if (!translatedText) {
            continue;
        }

        for (const metadataSelector of metadataSelectors) {
            document.querySelector(metadataSelector)
                ?.setAttribute("content", translatedText);
        }
    }

    const activeLocale = localizationSettings
        .languageSettingsByCode[languageCode]
        ?.openGraphLocale;
    const alternateLanguageCode = Object.keys(
        localizationSettings.languageSettingsByCode
    ).find(candidateLanguageCode => candidateLanguageCode !== languageCode);
    const alternateLocale = localizationSettings
        .languageSettingsByCode[alternateLanguageCode]
        ?.openGraphLocale;

    if (activeLocale) {
        document.querySelector('meta[property="og:locale"]')
            ?.setAttribute("content", activeLocale);
    }

    if (alternateLocale) {
        document.querySelector('meta[property="og:locale:alternate"]')
            ?.setAttribute("content", alternateLocale);
    }
}

function updateLanguageSwitcher(languageCode, isLoading = false) {
    for (const languageButton of document.querySelectorAll("[data-language]")) {
        const isSelectedLanguage =
            languageButton.dataset.language === languageCode;

        languageButton.classList.toggle("is-selected", isSelectedLanguage);
        languageButton.setAttribute(
            "aria-pressed",
            String(isSelectedLanguage)
        );
        languageButton.disabled = isLoading;
    }
}

async function changeLanguage(requestedLanguageCode) {
    const supportedLanguageCodes = Object.keys(
        localizationSettings.languageSettingsByCode
    );
    const { defaultLanguageCode } = localizationSettings;
    const normalizedLanguageCode = normalizeLanguageCode(
        requestedLanguageCode
    );
    const selectedLanguageCode = supportedLanguageCodes.includes(
        normalizedLanguageCode
    )
        ? normalizedLanguageCode
        : defaultLanguageCode;

    if (selectedLanguageCode === activeLanguageCode) {
        return;
    }

    const languageRequestId = ++latestLanguageRequestId;
    document.body.setAttribute("aria-busy", "true");
    updateLanguageSwitcher(activeLanguageCode, true);

    try {
        const defaultTranslationPromise =
            loadTranslations(defaultLanguageCode);
        const selectedTranslationPromise =
            selectedLanguageCode === defaultLanguageCode
                ? defaultTranslationPromise
                : loadTranslations(selectedLanguageCode);
        const [
            defaultTranslationDictionary,
            selectedTranslationDictionary
        ] = await Promise.all([
            defaultTranslationPromise,
            selectedTranslationPromise
        ]);

        if (languageRequestId !== latestLanguageRequestId) {
            return;
        }

        const translationDictionary = {
            ...defaultTranslationDictionary,
            ...selectedTranslationDictionary
        };

        applyTextTranslations(translationDictionary);
        updateLocalizedMetadata(
            translationDictionary,
            selectedLanguageCode
        );

        activeLanguageCode = selectedLanguageCode;
        document.documentElement.lang = selectedLanguageCode;
        updateLanguageSwitcher(selectedLanguageCode);

        document.dispatchEvent(new CustomEvent("languagechange", {
            detail: { languageCode: selectedLanguageCode }
        }));
    }
    catch (error) {
        console.error("Language loading failed.", error);
    }
    finally {
        if (languageRequestId === latestLanguageRequestId) {
            document.body.removeAttribute("aria-busy");
            updateLanguageSwitcher(activeLanguageCode);
        }
    }
}

async function initializeLocalization() {
    try {
        const rawConfig = await fetchJsonResource(
            LOCALIZATION_CONFIG_PATH
        );
        localizationSettings = validateLocalizationConfig(rawConfig);

        const supportedLanguageCodes = Object.keys(
            localizationSettings.languageSettingsByCode
        );
        const { defaultLanguageCode } = localizationSettings;
        const initialLanguageCode = selectInitialLanguage(
            supportedLanguageCodes,
            defaultLanguageCode
        );

        const initialTranslationLoad = Promise.all([
            loadTranslations(defaultLanguageCode),
            initialLanguageCode === defaultLanguageCode
                ? Promise.resolve()
                : loadTranslations(initialLanguageCode)
        ]);

        await Promise.all([
            waitForDocumentReady(),
            initialTranslationLoad
        ]);

        for (const languageButton of document.querySelectorAll(
            "[data-language]"
        )) {
            languageButton.addEventListener("click", () => {
                changeLanguage(languageButton.dataset.language);
            });
        }

        await changeLanguage(initialLanguageCode);
    }
    catch (error) {
        document.body?.removeAttribute("aria-busy");
        console.error("Localization initialization failed.", error);
    }
}

initializeLocalization();
