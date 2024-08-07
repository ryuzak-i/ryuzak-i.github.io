function loadConfig(config_path) {
    fetch(config_path).then(
        function (u) { return u.json(); }
    ).then(
        function (config) {
            let default_language_id = config.TEXTS.DEFAULT_LANGUAGE;
            loadTexts(config, default_language_id);

            for (let language_id in config.TEXTS.LANGUAGES) {
                lang_button = document.getElementById("language_" + language_id);

                if (lang_button === null) { continue; }

                lang_button.addEventListener("click", function () {
                    loadTexts(config, language_id);
                });
            }
        }
    )
}

function loadTexts(config, language_id) {
    if (current_language_id === language_id) {
        return;
    }

    current_language_id = language_id;

    let xml_path = config.TEXTS.LANGUAGES[language_id].XML_DOCUMENT_PATH;
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

let current_language_id;
let config_path = "config.json";
loadConfig(config_path);