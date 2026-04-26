import React, { useEffect } from 'react';

const AutoTranslator = () => {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    const addScript = document.createElement('script');
    addScript.id = 'google-translate-script';
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

  return (
    <div 
      id="google_translate_element" 
      className="absolute opacity-0 -z-50 pointer-events-none w-0 h-0 overflow-hidden"
    ></div>
  );
};

export default AutoTranslator;