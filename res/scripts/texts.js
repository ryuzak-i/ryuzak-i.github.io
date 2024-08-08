function loadConfig(config_path) {
    fetch(config_path).then(
        function (u) { return u.json(); }
    ).then(
        function (config) {
            let default_language_code = config.TEXTS.DEFAULT_LANGUAGE;
            loadTexts(config, default_language_code);

            let start_language_code = null;
            let user_language_code = navigator.language || navigator.userLanguage;

            for (let language_code in config.TEXTS.LANGUAGES) {
                lang_button = document.getElementById("language_" + language_code);

                if (lang_button === null) {
                    continue;
                };

                lang_button.addEventListener("click", function () {
                    loadTexts(config, language_code);
                });

                if (start_language_code === null) {
                    if (language_code === user_language_code) {
                        start_language_code = user_language_code;
                    };
                };
            };

            if (start_language_code != null && start_language_code !== default_language_code) {
                loadTexts(config, start_language_code);
            };
        }
    )
}

function loadTexts(config, language_code) {
    if (current_language_code === language_code) {
        return;
    }

    current_language_code = language_code;

    let xml_path = config.TEXTS.LANGUAGES[language_code].XML_DOCUMENT_PATH;
    fetch(xml_path)
        .then((response) => response.text())
        .then((xml_string) => {
            let xml_doc = new DOMParser().parseFromString(xml_string, "text/xml");
            let texts_list = xml_doc.getElementsByTagName(config.TEXTS.XML_TAG_NAME);

            for (let i = 0; i < texts_list.length; i++) {
                let text_id = texts_list[i].getAttribute(config.TEXTS.XML_ATTRIBUTE_ID_NAME)
                let text_value = texts_list[i].getAttribute(config.TEXTS.XML_ATTRIBUTE_VALUE_NAME)

                let doc_element = document.getElementById(text_id);

                if (doc_element && text_value) {
                    doc_element.innerHTML = text_value;
                };
            };
        });
}

let current_language_code;
let config_path = "config.json";
loadConfig(config_path);