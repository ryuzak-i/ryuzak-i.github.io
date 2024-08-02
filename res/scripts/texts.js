function loadConfig(config_path) {
    fetch(config_path).then(
        function (u) { return u.json(); }
    ).then(
        function (json_config) {
            loadTexts(json_config);
        }
    )
}


function loadTexts(config) {
    fetch(config.TEXTS.XML_DOCUMENT_PATH)
    .then((response) => response.text())
    .then((xml_string) => {
        let xml_doc = new DOMParser().parseFromString(xml_string, "text/xml");
        let texts_list = xml_doc.getElementsByTagName(config.TEXTS.XML_TAG_NAME);

        for (let i = 0; i < texts_list.length; i++) {
            let text_id = texts_list[i].getAttribute(config.TEXTS.XML_ATTRIBUTE_ID_NAME)
            let text_value = texts_list[i].getAttribute(config.TEXTS.XML_ATTRIBUTE_VALUE_NAME)

            let doc_element = document.getElementById(text_id);

            if (doc_element && text_value) {
                // console.log("For id '" + text_id + "' setup text '" + text_value + "'")
                doc_element.innerHTML = text_value;
            };
        }
    });
}

let config_path = "config.json";
loadConfig(config_path)