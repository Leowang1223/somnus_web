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
    };

    const t = (key: string) => {
        const lang = language || 'en';
        const dict = dictionaries[lang] as any;
        return dict[key] || key;
    };

    // CMS Translation Helper
    // translate(product, 'name') -> returns product.name_jp if lang is jp, else fallback to product.name
    const translate = (obj: any, field: string) => {
        if (!obj) return '';
        const lang = language || 'en';
        if (lang === 'en') return obj[field] || '';

        const localizedKey = `${field}_${lang}`;
        return obj[localizedKey] || obj[field] || '';
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
