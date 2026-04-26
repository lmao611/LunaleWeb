import React, { useEffect } from 'react';

const AutoTranslator = () => {
  useEffect(() => {
    const addScript = document.createElement('script');
    addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { 
          pageLanguage: 'vi', 
          includedLanguages: 'en,th,zh-CN,ko,ar',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        },
        'google_translate_element'
      );
    };
  }, []);

  return <div id="google_translate_element" style={{ display: 'none' }}></div>;
};

export default AutoTranslator;