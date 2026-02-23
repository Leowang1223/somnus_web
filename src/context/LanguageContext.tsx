'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/dictionaries/en.json';
import zh from '@/dictionaries/zh.json';
import jp from '@/dictionaries/jp.json';
import ko from '@/dictionaries/ko.json';

type Language = 'en' | 'zh' | 'jp' | 'ko';

const dictionaries = { en, zh, jp, ko };

interface LanguageContextType {
    language: Language | null; // null means not selected yet
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    translate: (obj: any, field: string) => string;
    currency: string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key,
    translate: (obj, field) => '',
    currency: '$'
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('language') as Language;
        if (stored && ['en', 'zh', 'jp', 'ko'].includes(stored)) {
            setLanguageState(stored);
        }
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        // Also write a cookie so server components can read the language
        document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    };

    const t = (key: string) => {
        const lang = language || 'en';
        const dict = dictionaries[lang] as any;
        return dict[key] || key;
    };

    // CMS Translation Helper
    // Handles two formats:
    //   1. Object format: { en: "Explore", zh: "探索", jp: "探索", ko: "탐색" }
    //   2. Suffix format: obj.name_zh, obj.name_jp (legacy DB rows)
    const translate = (obj: any, field: string) => {
        if (!obj) return '';
        const lang = language || 'en';
        const value = obj[field];

        // Object format: { en: "...", zh: "...", jp: "...", ko: "..." }
        if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
            return String(value[lang] || value['en'] || Object.values(value).find(v => v) || '');
        }

        // Suffix format (legacy): obj.name_zh
        if (lang === 'en') return value || '';
        const localizedKey = `${field}_${lang}`;
        return obj[localizedKey] || value || '';
    };

    const currency = t('common.currency');

    if (!isLoaded) return null; // Avoid hydration mismatch

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translate, currency }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
