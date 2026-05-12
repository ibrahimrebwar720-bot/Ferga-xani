export interface GrammarCategory {
  title: {
    Sorani: string;
    Kurmanji: string;
  };
  content: {
    Sorani: string;
    Kurmanji: string;
  };
}

export interface DialectGrammar {
  id: string;
  name: string;
  alphabet: {
    script: 'Aramaic' | 'Latin';
    letters: string[];
    specialLetters?: string[];
    note: {
      Sorani: string;
      Kurmanji: string;
    };
  };
  sections: GrammarCategory[];
}

export const grammarData: DialectGrammar[] = [
  {
    id: 'sorani',
    name: 'Sorani',
    alphabet: {
      script: 'Aramaic',
      letters: ['ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د', 'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ', 'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'و', 'وو', 'ۆ', 'هـ', 'ە', 'ی', 'ێ'],
      note: {
        Sorani: 'ئەلفوبێی سۆرانی (ئارامی) ٣٤ پیتی هەیە. جیاوازییەکانی لەگەڵ فارسی و عەرەبیدا بریتین لە پیتەکانی (ڕ، ڵ، ڤ، ۆ، ێ).',
        Kurmanji: 'Alfabeya Soranî 34 tîpan bikar tîne. Cudahiya sereke tîpên (ڕ, ڵ, ڤ, ۆ, ێ) ne ku di terekî û farisî de nîn in.'
      }
    },
    sections: [
      {
        title: { Sorani: 'پیتە تایبەتەکان و دەنگناسی', Kurmanji: 'Tîpên Taybet û Fonetîk' },
        content: {
          Sorani: 'سۆرانی خاوەنی چەند دەنگێکی تایبەتە کە لە زۆر زماندا نین:\n\n- **ڕ (Heavy R):** دەنگێکی تێر و لەرەیییە، وەک "کەڕ".\n- **ڵ (Heavy L):** دەنگێکی ئەستوورە (Dark L)، وەک "ماڵ".\n- **ڤ (V):** دەنگی (V)ی ئینگلیزییە، وەک "تاڤگە".\n- **ۆ (O):** بزوێنێکی درێژ و نێوەندییە، وەک "ڕۆژ".\n- **ێ (Ê):** بزوێنێکی درێژ و نێوەندییە، وەک "دێ".',
          Kurmanji: 'Soranî xwedî çend dengên taybet e: ڕ (R-ya giran), ڵ (L-ya giran), ڤ (V), ۆ (O) û ێ (Ê).'
        }
      },
      {
        title: { Sorani: 'جێناوەکان', Kurmanji: 'Cînav' },
        content: {
          Sorani: 'لە سۆرانیدا دوو کۆمەڵە جێنامان هەیە:\n\n١. جێناوی سەربەخۆ (بکەر و بەرکار):\n\n| کەس | تاک | کۆ |\n| :--- | :--- | :--- |\n| ١ | من | ئێمە |\n| ٢ | تۆ | ئێوە |\n| ٣ | ئەو | ئەوان |\n\nنموونە:\n- من دەڕۆم. (Subjective)\n- ئەو منی بینی. (Objective)\n- ئەمانی من (Possessive - with Izafe).\n\n٢. جێناوی لکاو:\n\n| کەس | تاک | کۆ |\n| :--- | :--- | :--- |\n| ١ | -م | -مان |\n| ٢ | -ت | -تان |\n| ٣ | -ی | -یان |\n\nنموونە:\n- کتێبـم. (Possessive)\n- بینیمـی. (Objective)',
          Kurmanji: 'Di Soranî de cînavên serbixwe (Min, to, ew, ême, êwe, ewan) û pêvekirî (-m, -t, -y) hene.'
        }
      },
      {
        title: { Sorani: 'ناوەکان و ناساندن', Kurmanji: 'Nav û Nasandin' },
        content: {
          Sorani: 'لە سۆرانیدا ڕەگەزی (نێر و مێ) نییە، بەڵام (ناسراو و نەناسراو) هەیە:\n\n- نەناسراو: بە پاشگری (-ێک) دروست دەبێت (کتێبێک).\n- ناسراو: بە پاشگری (-ەکە) دروست دەبێت (کتێبەکە).\n\nئیزافە:\nبۆ پەیوەندی نێوان ناو و هاوەڵناو، یان ناو و ناو، پاشگری (-ی) یان (-یی) بەکاردێت: (ماڵی گەورە).',
          Kurmanji: 'Di Soranî de zayend nîn e. Indefinite bi (-êk) û Definite bi (-eke) tê çêkirin.'
        }
      },
      {
        title: { Sorani: 'کاتەکانی کردار', Kurmanji: 'Demên Lêkeran' },
        content: {
          Sorani: 'لە سۆرانیدا چوار کاتی سەرەکیمان هەیە:\n\n١. کاتی ئێستا: (دە- + ڕەگی ئێستا + کۆتایی)، وەک: "من دەخوێنم".\n٢. کاتی ڕابردووی سادە: (ڕەگی ڕابردوو + کۆتایی)، وەک: "من ڕۆیشتم".\n٣. کاتی ڕابردووی دوور: (ڕەگی ڕابردوو + بوو + کۆتایی)، وەک: "من خوێندبووم".\n٤. کاتی داهاتوو: بەزۆری کاتی ئێستا یان شێوەی (ب-) بەکاردێت لەگەڵ ئاماژەی کاتی، وەک: "بەیانی دەڕۆم".\n\n**خشتەی نموونەی کردارەکان:**\n\n| کردار | ئێستا | ڕابردوو | داهاتوو |\n| :--- | :--- | :--- | :--- |\n| خوێندن | دەخوێنم | خوێندم | دەخوێنم |\n| چوون | دەچم | چووم | دەچم |',
          Kurmanji: 'Di Soranî de dema niha (di-), dema borî, dema borî ya dûr (-bû-) û dema bê hene.\n\n**Tabloya Nimûneyan:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Xwendin | Dixwînim | Xwendim | Dexwînim |\n| Çûn | Deçim | Çûm | Deçim |'
        }
      },
      {
        title: { Sorani: 'نەرێکردن (نافی)', Kurmanji: 'Neyînî (Negation)' },
        content: {
          Sorani: 'بۆ نەرێکردنی کردار لە سۆرانیدا:\n\n- لە کاتی ئێستادا: (نا-) لە جیاتی (دە-) دادەنرێت. وەک: دەڕۆم -> ناڕۆم.\n- لە کاتی ڕابردوودا: (نە-) بەکاردێت. وەک: چووم -> نەچووم.\n- فرمانی داخوازی: (مە-) بەکاردێت. وەک: بڕۆ -> مەڕۆ.',
          Kurmanji: 'Ji bo neyînîkirinê:\n- Dema niha: (na-). Wek: na-çim.\n- Dema borî: (ne-). Wek: ne-çûm.\n- Împeratîv: (me-). Wek: me-çe.'
        }
      },
      {
        title: { Sorani: 'ئامرازەکانی بەستەر (Adpositions)', Kurmanji: 'Daçek (Adpositions)' },
        content: {
          Sorani: 'ئامرازە سەرەکییەکان لە سۆرانیدا:\n\n- **لە (In/From):** وەک: لە شار (In town).\n- **بە (By/With):** وەک: بە ئۆتۆمبێل (By car).\n- **بۆ (For/To):** وەک: بۆ ماڵەوە (To home).\n- **لەگەڵ (With):** وەک: لەگەڵ هاوڕێیان (With friends).',
          Kurmanji: 'Daçekên Soranî: Le (in/ji), Be (bi), Bo (ji bo), Legel (bi re/digel).'
        }
      },
      {
        title: { Sorani: 'ئامۆژگاری خانی: جیاوازی "ڕ" و "ڵ"', Kurmanji: 'Şîreta Xanî: Cudahiya "ڕ" û "ڵ"' },
        content: {
          Sorani: 'ئایا دەزانی؟ لە زمانی کوردیدا تەنها یەک "ر"مان نییە! ئەگەر بڵێیت "کەر" (گوێدرێژ) دەنگەکە سادەیە، بەڵام ئەگەر بڵێیت "کەڕ" (کەسێک کە نابیستێت) پێویستە زمانت زیاتر بلەرێنیتەوە. ئەم جیاوازییە زۆر گرنگە بۆ مانای وشەکان.',
          Kurmanji: 'Ma we zanibû? Di Kurdî de ne tenê yek "r" heye! Ger tu bibêjî "ker" (heywan), deng sade ye, lê ger tu bibêjî "keڕ" (kesê nabihîze), divê tu zimanê xwe bilerizînî.'
        }
      }
    ]
  },
  {
    id: 'kurmanji',
    name: 'Kurmanji',
    alphabet: {
      script: 'Latin',
      letters: ['A', 'B', 'C', 'Ç', 'D', 'E', 'Ê', 'F', 'G', 'H', 'I', 'Î', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'Ş', 'T', 'U', 'Û', 'V', 'W', 'X', 'Y', 'Z'],
      note: {
        Sorani: 'کرمانجی ئەلفوبێی لاتینی (هاوار) بەکاردێنێت. خاوەنی ٣١ پیتە، بزوێنەکان ڕۆڵێکی گرنگیان هەیە لە دیاریکردنی ڕێزماندا.',
        Kurmanji: 'Kurmancî alfabeya Latînî (Hawar) bikar tîne ku ji 31 tîpan pêk tê. Dengdar roleke sereke dilîzin.'
      }
    },
    sections: [
      {
        title: { Sorani: 'پیتە تایبەتەکان و دەنگناسی', Kurmanji: 'Tîpên Taybet û Fonetîk' },
        content: {
          Sorani: 'کرمانجی لە ڕێگەی ئەلفوبێی لاتینییەوە دەنگە کوردییەکان دەردەبڕێت:\n\n- **Ç:** وەک "Çاو" (چ)، هاوشێوەی "Church"ی ئینگلیزی.\n- **Ê:** بزوێنێکی درێژە، وەک "Êوار" (ێ).\n- **Î:** بزوێنێکی درێژە، وەک "Îرو" (ی/ئی).\n- **Ş:** وەک "Şاخ" (ش)، هاوشێوەی "She"ی ئینگلیزی.\n- **Û:** بزوێنێکی درێژە، وەک "Ûرد" (وو).\n- **X:** دەنگی "خ"، وەک "Xۆش".\n- **W:** وەک "Wڵات" (و)، هاوشێوەی "Wow"ی ئینگلیزی.',
          Kurmanji: 'Kurmancî bi alfabeya Hawarê dengên xwe diyar dike: Ç, Ê, Î, Ş, Û, X, W.'
        }
      },
      {
        title: { Sorani: 'زانیاری: ئەلفوبێی هاوار', Kurmanji: 'Agahî: Alfabeya Hawarê' },
        content: {
          Sorani: 'ئەلفوبێی لاتینی کرمانجی لە ساڵی ١٩٣٢ لەلایەن جەلالەت عالیزەدری بەدرخان لە گۆڤاری "هاوار"دا بڵاوکرایەوە. ئەم ئەلفوبێیە بووە بنەمای نووسینی کرمانجی مۆدێرن و یارمەتیدەرێکی گەورە بوو بۆ پاراستنی زمانەکە.',
          Kurmanji: 'Alfabeya Latînî ya Kurmancî di sala 1932an de ji hêla Celadet Alî Bedirxan ve di kovara "Hawar" de hat weşandin. Ev alfabe bû bingeha nivîsandina Kurmanciya nûjen.'
        }
      },
      {
        title: { Sorani: 'جێناوەکان', Kurmanji: 'Cînav' },
        content: {
          Sorani: 'کرمانجی خاوەن دەوڵەمەندترین سیستەمی جێناوە و بارەکان دەیان گۆڕێت:\n\n| کەس | ڕاستەوخۆ (بکەر) | ناڕاستەوخۆ (بەرکار/خاوەندارێتی) |\n| :--- | :--- | :--- |\n| ١ تاک | Ez | Min |\n| ٢ تاک | Tu | Te |\n| ٣ تاک | Ew | Wî (Nێر) / Wê (Mێ) |\n| ١ کۆ | Em | Me |\n| ٢ کۆ | Hûn | We |\n| ٣ کۆ | Ew | Wan |\n\nنموونە:\n- **Ez** diçim. (بکەر - ئێستا)\n- **Min** xwar. (بکەر - ڕابردووی تێپەڕ)\n- Hevalê **min**. (خاوەندارێتی)\n- Ez **te** dibînim. (بەرکار)',
          Kurmanji: 'Di Kurmancî de cînav dibin du cure: Rast (Ez, tu, ew) û Tewandî (Min, te, wî/wê, me, we, wan).'
        }
      },
      {
        title: { Sorani: 'ڕەگەز', Kurmanji: 'Zayend' },
        content: {
          Sorani: 'کرمانجی خاوەن دوو ڕەگەزی (نێر و مێ)ـیە بۆ ناوەکان:\n\n- نێر: وەک Çiya (چیا)، Heval (هاوڕێ - نێر).\n- مێ: وەک Erd (زەوی)، Dayik (دایک).\n\nڕەگەز کاریگەری هەیە لەسەر ئیزافە و جێناوەکان.',
          Kurmanji: 'Di Kurmancî de nav nêr û mê ne. Zayend bandorê li tewandin û îzafeyê dike.'
        }
      },
      {
        title: { Sorani: 'بارەکانی ناو', Kurmanji: 'Tewandin' },
        content: {
          Sorani: 'کرمانجی خاوەن بارەکانە:\n\n١. باری ڕاستەوخۆ:\nبەکاردێت بۆ بکەر لە کاتی ئێستادا. (Ez diçim).\n\n٢. باری ناڕاستەوخۆ:\nبەکاردێت بۆ بەرکار یان دوای ئامرازەکان.\nجێناوەکانی باری ناڕاستەوخۆ: Min, Te, Wî/Wê, Me, We, Wan.',
          Kurmanji: 'Kurmancî xwedî rewşa rast û tewandî ye. Cînavên tewandî: Min, te, wî/wê, me, we, wan.'
        }
      },
      {
        title: { Sorani: 'ئیزافە', Kurmanji: 'Îzafe' },
        content: {
          Sorani: 'ئیزافە لە کرمانجیدا بەپێی ڕەگەز دەگۆڕێت:\n- مێ تەنی: -a (Kevçiyê min)\n- نێر تەنی: -ê (Hevalê min)\n- کۆ (هەردوو ڕەگەز): -ên (Hevalên min)',
          Kurmanji: 'Îzafe li gorî zayendê diguhere: Nêr (-ê), Mê (-a), Pirjimar (-ên).'
        }
      },
      {
        title: { Sorani: 'کاتەکانی کردار', Kurmanji: 'Demên Lêkeran' },
        content: {
          Sorani: 'کرمانجی سیستمێکی دەوڵەمەندی کاتەکانی هەیە:\n\n١. کاتی ئێستا: (Di- + ڕەگ + کۆتایی)، وەک: "Ez dixwînim".\n٢. کاتی ڕابردوو: (ڕەگی ڕابردوو + کۆتایی)، وەک: "Ez çûm". تێبینی: بۆ کرداری تێپەڕ سیستەمی ئەرگاتیڤ بەکاردێت (Min xwar).\n٣. کاتی ڕابردووی دوور: (ڕەگی ڕابردوو + -bû- + کۆتایی)، وەک: "Ez çûbûm".\n٤. کاتی داهاتوو: (ê/dê + ب- + ڕەگ + کۆتایی)، وەک: "Ez ê bixwînim".\n\n**Tabloya Lêkeran:**\n\n| Lêker | Dema Niha | Dema Borî | Dema Bê |\n| :--- | :--- | :--- | :--- |\n| Xwendin | Dixwînim | Min xwend | Ez ê bixwînim |\n| Çûn | Diçim | Ez çûm | Ez ê biçim |',
          Kurmanji: 'Demên Kurmancî:\n- Dema Niha: Ez di-xwîn-im.\n- Dema Borî: Ez çû-m / Min xwar.\n- Dema Borî ya Dûr: Ez çû-bû-m.\n- Dema Bê: Ez ê bi-xwîn-im.\n\n**Tablo:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Xwendin | Dixwînim | Min xwend | Ez ê bixwînim |\n| Çûn | Diçim | Ez çûm | Ez ê biçim |'
        }
      },
      {
        title: { Sorani: 'نەرێکردن', Kurmanji: 'Neyînîkirin' },
        content: {
          Sorani: 'لە کرمانجیدا نەرێکردن بەم شێوەیە دەکرێت:\n\n- ئێستا: (Na-) + ڕەگ. وەک: Ez na-xwînim.\n- ڕابردوو: (Ne-) + ڕەگ. وەک: Ez ne-çûm / Min ne-xwar.\n- داخوازی: (Me-). وەک: Me-çe (مڕۆ).',
          Kurmanji: 'Neyînîkirina lêkeran:\n- Dema Niha: (na-). Wek: Ez na-çim.\n- Dema Borî: (ne-). Wek: Ez ne-çûm.\n- Împeratîv: (me-). Wek: Me-bêje.'
        }
      },
      {
        title: { Sorani: 'ئامرازەکان (Daçek)', Kurmanji: 'Daçekan' },
        content: {
          Sorani: 'کرمانجی خاوەن سیستەمی (Daçek)ـە کە پێکدێت لە پێشگر و پاشگر:\n\n- **Bi ... re:** (لەگەڵ). وەک: Bi te re (لەگەڵ تۆ).\n- **Li ... :** (لە - شوێن). وەک: Li mal (لە ماڵ).\n- **Ji ... :** (لە - سەرچاوە). وەک: Ji Almanyayê (لە ئەڵمانیاوە).\n- **Bi ... :** (بە - کەرەستە). وەک: Bi pênûsê (بە پێنووسەکە).',
          Kurmanji: 'Di Kurmancî de daçek pir girîng in: Li (di), Ji (ji), Bi (bi), Bo (ji bo), Bi...re (bi...re).'
        }
      }
    ]
  },
  {
    id: 'hawrami',
    name: 'Hawrami',
    alphabet: {
      script: 'Aramaic',
      letters: ['ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د', 'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ', 'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'و', 'وو', 'ۆ', 'هـ', 'ە', 'ی', 'ێ'],
      specialLetters: ['ۊ', 'ۉ', 'ﮆ'],
      note: {
        Sorani: 'هەورامی (یان هەورامانی) شێوەزارێکی پارێزراوە. پیتە تایبەتەکانی (ۊ، ۉ) لەسەر بنەمای دەنگی کۆن پارێزراون.',
        Kurmanji: 'Hewramî zaravayekî parastî ye. Tîpên taybet (ۊ, ۉ) xwedî dengên kevn in.'
      }
    },
    sections: [
      {
        title: { Sorani: 'پیتە تایبەتەکان و دەنگناسی', Kurmanji: 'Tîpên Taybet û Fonetîk' },
        content: {
          Sorani: 'هەورامی چەند دەنگێکی زۆر تایبەتی تێدایە کە لە زاراوەکانی تردا کەمتر دەبیسترێن:\n\n- **ۊ (Ü):** بزوێنێکی خڕی پێشەوەیە، هاوشێوەی (Ü)ی ئەڵمانی یان (U)ی فەرەنسی.\n- **ۉ (Ô/AW):** دەنگێکی نێوان "ئۆ" و "ئاو"ە، زۆر تایبەتە بە شێوەزاری هەورامی.\n- **ﮆ (Soft D):** دەنگێکی (د)ی نەرمە کە هەندێک جار بەرەو (ز یان زە) دەڕوات (Interdental D).',
          Kurmanji: 'Hewramî xwedî dengên taybet e: ۊ (Ü), ۉ (Ô/AW), ﮆ (D-ya nerm).'
        }
      },
      {
        title: { Sorani: 'ڕەگەز و چەمانەوە', Kurmanji: 'Zayend û Tewandin' },
        content: {
          Sorani: 'هەورامی هاوشێوەی کرمانجی ڕەگەزی نێر و مێی هەیە، بەڵام سیستەمی چەمانەوەی ئاڵۆزترە.\n\n- نێر: بی ئاماژە کۆتایی دێت.\n- مێ: بە (ە - e) کۆتایی دێت.\nنموونە: کوڕ (نێر)، کناچە (مێ).',
          Kurmanji: 'Hewramî xwedî zayend e (Nêr û Mê). Tewandin tê de pir pêşketî ye.'
        }
      },
      {
        title: { Sorani: 'جێناوەکان', Kurmanji: 'Cînav' },
        content: {
          Sorani: 'جێناوەکانی هەورامی زۆر تایبەتن و ڕەگەزیان تێدایە:\n\n| کەس | جێناوی سەربەخۆ |\n| :--- | :--- |\n| ١ تاک | من (Min) |\n| ٢ تاک | تۆ (To) |\n| ٣ تاک | ئەو (Ew - نێر) / پەنە (Pene - مێ) |\n| ١ کۆ | ئێمە (Ême) |\n| ٢ کۆ | شما (Şima) |\n| ٣ کۆ | ئەدیشا (Edîşa) |\n\nجێناوە لکاوەکان (-م، -ت، -ش، -ما، -تا، -شا) بەکاردێن بۆ خاوەندارێتی:\n- کتێبـم، کتێبـتا.',
          Kurmanji: 'Hewramî xwedî cînavên serbixwe û pêvekirî ye. Cînavên serbixwe: Min, to, ew, ême, şima, edîşa.'
        }
      },
      {
        title: { Sorani: 'کاتەکانی کردار', Kurmanji: 'Demên Lêkeran' },
        content: {
          Sorani: 'هەورامی زۆر بە وردی کاتەکان جیا دەکاتەوە:\n\n١. کاتی ئێستا: (م- + ڕەگ + کۆتایی)، وەک: "من مه‌وانو" (Min mewanu).\n٢. کاتی ڕابردوو: (ڕەگی ڕابردوو + کۆتایی)، وەک: "من وەندەم" (Min wendem).\n٣. کاتی ڕابردووی دوور: پاشگری (-بێ) یان (-بی) بەکاردێت.\n٤. کاتی داهاتوو: زۆرجار بە هۆی ئامرازی تایبەت و کاتی ئێستاوە گوزارشت دەکرێت.\n\n**خشتەی کردارەکان (Hewramî):**\n\n| کردار | کاتی ئێستا | کاتی ڕابردوو | داهاتوو |\n| :--- | :--- | :--- | :--- |\n| وەندەی | مه‌وانو | وەندەم | مه‌وانو |\n| لوای | ملۆ | لوانێ | ملۆ |',
          Kurmanji: 'Demên Hewramî:\n- Niha: Min m-ewan-u.\n- Borî: Min wend-em.\n- Borî ya Dûr: Bi paşgira (-bê).\n\n**Tablo:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Wendey | Mewanu | Wendem | Mewanu |\n| Lway | Mlo | Lwane | Mlo |'
        }
      },
      {
        title: { Sorani: 'نەرێکردن', Kurmanji: 'Neyînî' },
        content: {
          Sorani: 'لە هەورامیدا نەرێکردن بەم شێوەیەیە:\n\n- ئێستا: (نە- یان ن-) لە جیاتی (م-). وەک: من نه‌وانو (من ناخوێنم).\n- ڕابردوو: (نە-). وەک: من نه‌وەندەم (من نەخوێندم).',
          Kurmanji: 'Neyînî kirin di Hewramî de:\n- Niha: (ne/n-). Wek: Min mewanu -> Min newanu.\n- Borî: (ne-). Wek: Min nwendem.'
        }
      },
      {
        title: { Sorani: 'خانی دەڵێت: هەورامی و ئەدەبیات', Kurmanji: 'Xanî Dibêje: Hewramî û Edebiyat' },
        content: {
          Sorani: 'هەورامی بۆ چەند سەدەیەک زمانی ئەدەبی و فەرمی میرنشینە کوردییەکان بووە (وەک میرنشینی ئەردەڵان). زۆربەی شاعیرە کلاسیکەکان بەم شێوەزارە شیعرەکانیان نووسیوە، تەنانەت ئەوانەشی کە سۆران بوون.',
          Kurmanji: 'Hewramî bi sedsalan zimanê edebî yê mîrnişînên Kurd bû (wek Mîrnişîna Erdelan). Gelek helbestvanên klasîk bi vî zaravayî berhemên xwe afirandine.'
        }
      }
    ]
  },
  {
    id: 'zazaki',
    name: 'Zazaki',
    alphabet: {
      script: 'Latin',
      letters: ['A', 'B', 'C', 'Ç', 'D', 'E', 'Ê', 'F', 'G', 'H', 'I', 'Î', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'Ş', 'T', 'U', 'Û', 'V', 'W', 'X', 'Y', 'Z'],
      note: {
        Sorani: 'زازاکی سیستەمی لاتینی بەکاردێنێت. جیاوازی سەرەکی لە بزوێنەکان و دەنگە تایبەتەکاندایە.',
        Kurmanji: 'Zazakî bi alfabeya Latînî tê nivîsandin û pir nêzîkî Kurmancî ye.'
      }
    },
    sections: [
      {
        title: { Sorani: 'پیتە تایبەتەکان و دەنگناسی', Kurmanji: 'Tîpên Taybet û Fonetîk' },
        content: {
          Sorani: 'زازاکی لە ڕووی دەنگناسییەوە زۆر دەوڵەمەندە و هەندێک بزوێنی جیاوازی هەیە:\n\n- **I/i:** دەنگێکی کورت و بێهێزە، وەک "Bize" (بزە).\n- **Ê/ê:** بزوێنێکی درێژە، وەک "Dê" (دێ).\n- **Û/û:** بزوێنێکی درێژ و خڕە.\n- **Ç:** وەک "Çا" (چ).',
          Kurmanji: 'Zazakî bi alfabeya Latînî dengên xwe diyar dike. Dengên I, Ê, Û, Ç tê de girîng in.'
        }
      },
      {
        title: { Sorani: 'زانیاری: زازاکی یان دەملی؟', Kurmanji: 'Agahî: Zazakî an Dimilkî?' },
        content: {
          Sorani: 'زازاکی بە چەندین ناو دەناسرێت وەک: (دەملی، کرادیکی، زازاکی). ئەم شێوەزارە زۆرترین دەنگی ڕەسەنی ئێرانییە کۆنەکانی تێدا ماوەتەوە، بۆیە بۆ مێژوونووسان و زمانەوانان زۆر گرنگە.',
          Kurmanji: 'Zazakî bi navên mîna Dimilkî an Kirmanckî jî tê zanîn. Ev zarava dengên pir kevnar ên zimanên Îranî parastiye.'
        }
      },
      {
        title: { Sorani: 'ڕەگەز و بارەکان', Kurmanji: 'Zayend û Tewandin' },
        content: {
          Sorani: 'زازاکی یەکێکە لە پارێزراوترین شێوەزارە کوردییەکان:\n\n- نێر (Nêr): پاشگری تایبەت وەرناگرێ.\n- مێ (Mê): زۆربەی کات بە (-e) کۆتایی دێت.\n\nسیستەمی ئەرگاتیڤ لە زازاکیدا زۆر توندە و لە کاتی ڕابردوودا بەکاردێت.',
          Kurmanji: 'Zazakî yek ji zaravayên herî parastî ye. Zayend û ergativîte tê de girîng in.'
        }
      },
      {
        title: { Sorani: 'جێناوەکان', Kurmanji: 'Cînav' },
        content: {
          Sorani: 'زازاکی خاوەن سیستەمی دوو بارییە (Case System) هاوشێوەی کرمانجی:\n\n| کەس | باری ڕاست (Direct) | باری چەماوە (Oblique) |\n| :--- | :--- | :--- |\n| ١ تاک | Ez | Min |\n| ٢ تاک | Ti | To |\n| ٣ تاک (نێر) | Ew | Ey |\n| ٣ تاک (مێ) | Ew | Aye |\n| ١ کۆ | Ma | Ma |\n| ٢ کۆ | Şima | Şima |\n| ٣ کۆ | Ê | În |\n\nنموونە:\n- **Ez** tora hes kena. (من تۆم خۆش دەوێت)\n- Ine kitaba **min**a. (ئەمە کتێبی منە)',
          Kurmanji: 'Di Zazakî de cînav dibin du cure: Rast (Ez, ti, ew) û Tewandî (Min, to, ey/aye, ma, şima, în).'
        }
      },
      {
        title: { Sorani: 'کاتەکانی کردار', Kurmanji: 'Demên Lêkeran' },
        content: {
          Sorani: 'زازاکی کاتەکانی بەم شێوەیەیە:\n\n١. کاتی ئێستا: ڕەگی ئێستا + پاشگری (-en-) + کۆتایی، وەک: "Ez wanena" (من دەخوێنم).\n٢. کاتی ڕابردوو: سیستەمی ئەرگاتیڤ تێیدا ڕوونە، وەک: "Min xwar" (من خواردم).\n٣. کاتی ڕابردووی دوور: پاشگری (-bi) بەکاردێت، وەک: "Ez şibi" (من چووبووم).\n٤. کاتی داهاتوو: ئامرازی (ê) بەکاردێت لەگەڵ شێوەی تایبەت، وەک: "Ez ê bixwînî".\n\n**Tabloya Zazakî:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Wanayen | Wanena | Min wana | Ez ê biwanî |\n| Şîyayen | Şona | Ez şîyî | Ez ê şêrî |',
          Kurmanji: 'Demên Zazakî:\n- Niha: Ez wan-en-a.\n- Borî: Min xwar.\n- Borî ya Dûr: Ez şi-bi.\n- Dema Bê: Ez ê bi-wan-î.\n\n**Tablo:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Wanayen | Wanena | Min wana | Ez ê biwanî |\n| Şîyayen | Şona | Ez şîyî | Ez ê şêrî |'
        }
      },
      {
        title: { Sorani: 'نەرێکردن', Kurmanji: 'Neyînî' },
        content: {
          Sorani: 'زازاکی شێوازی تایبەتی هەیە:\n\n- ئێستا: (Nê-) + ڕەگ. وەک: Ez nê-wanena.\n- ڕابردوو: (Nê-) + ڕەگ. وەک: Ez nê-şibi / Min nê-wana.',
          Kurmanji: 'Neyînî di Zazakî de:\n- Niha: (nê-). Wek: Ez nê-wanena.\n- Borî: (nê-). Wek: Ez nê-şibi.'
        }
      }
    ]
  },
  {
    id: 'luri',
    name: 'Luri',
    alphabet: {
      script: 'Aramaic',
      letters: ['ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د', 'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ', 'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'و', 'وو', 'ۆ', 'هـ', 'ە', 'ی', 'ێ'],
      specialLetters: ['ۉ', 'ۊ'],
      note: {
        Sorani: 'لوڕی سیستەمی ئارامی بەکاردێنێت. لە ڕووی دەنگییەوە زۆر دەوڵەمەندە و بزوێنەکانی (ۊ، ۉ) تێدایە.',
        Kurmanji: 'Lurî alfabeya Aramî bikar tîne û xwedî tîpên taybet (ۊ, ۉ) e.'
      }
    },
    sections: [
      {
        title: { Sorani: 'پیتە تایبەتەکان و دەنگناسی', Kurmanji: 'Tîpên Taybet û Fonetîk' },
        content: {
          Sorani: 'لوڕی خاوەن دەنگگەلێکی کۆن و ڕەسەنە کە لە زۆر شێوەزاری تردا گۆڕاون:\n\n- **ۊ (Ü):** دەنگێکی خڕی نێوان (ئوو) و (ئی)یە.\n- **ۉ (Ô):** دەنگێکی خڕ و درێژە، زۆرجار لە جێی (ئۆ) بەکاردێت.\n- **ڕ (Heavy R):** وەک لە سۆرانیدا هەیە، دەنگێکی توند و لەرەیییە.',
          Kurmanji: 'Lurî xwedî dengên taybet e: ۊ (Ü), ۉ (Ô), ڕ (R-ya giran).'
        }
      },
      {
        title: { Sorani: 'زانیاری: میواندۆستی لوڕەکان', Kurmanji: 'Agahî: Mêvanyariya Lurî' },
        content: {
          Sorani: 'کۆمەڵگای لوڕ بە میواندۆستی و بەخشندەیی بەناوبانگن. ئەمە ڕەنگی داوەتەوە لە زمانەکەشیاندا، بۆ نموونە زۆرێک لە دەربڕینەکانیان بۆ بەخێرهێنان و ڕێزگرتن وەک "تیە کال" یان "سەر دە چاو" زۆر ناسراون.',
          Kurmanji: 'Lurî bi mêvanyariya xwe navdar in. Zimanê wan jî bi van rûmetan dagirtî ye.'
        }
      },
      {
        title: { Sorani: 'جێناوەکان', Kurmanji: 'Cînav' },
        content: {
          Sorani: 'جێناوەکانی لوڕی زۆر نێزیکن لە زمانی کوردیی کۆن:\n\n| کەس | تاک | کۆ |\n| :--- | :--- | :--- |\n| ١ | مه (Me) | ایما (Îma) |\n| ٢ | تۆ (To) | ایشما (Îşma) |\n| ٣ | هو (Ho) | هونو (Huno) |\n\nجێناوە لکاوەکان بۆ خاوەندارێتی و بەرکار بەکاردێن:\n- کتابـم (کتێبم)\n- کتابـت (کتێبت)\n- کتابـش (کتێبی)',
          Kurmanji: 'Cînavên Lurî: Me, tu, ho, îma, îşma, huno. Cînavên pêvekirî (-m, -t, -ş) jî hene.'
        }
      },
      {
        title: { Sorani: 'کردار و کاتەکان', Kurmanji: 'Lêker û Dem' },
        content: {
          Sorani: 'لوڕی بەم شێوەیە کاتەکان ڕێکدەخات:\n\n١. کاتی ئێستا: (می- + ڕەگ + کۆتایی)، وەک: "مه می خواروم" (من دەخۆم).\n٢. کاتی ڕابردوو: (ڕەگی ڕابردوو + کۆتایی)، وەک: "مه هوردوم" (من خواردم).\n٣. کاتی ڕابردووی دوور: بە پاشگری تایبەت دروست دەبێت.\n٤. کاتی داهاتوو: هاوشێوەی سۆرانی زۆرجار کاتی ئێستا لەگەڵ وشەی داهاتوو بەکاردێت.\n\n**خشتەی نموونەی لوڕی:**\n\n| کردار | کاتی ئێستا | کاتی ڕابردوو | کاتی داهاتوو |\n| :--- | :--- | :--- | :--- |\n| خوەردن | می خوەرم | هوردوم | می خوەرم |\n| ڕەوتن | می ڕؤم | ڕەوتم | می ڕؤم |',
          Kurmanji: 'Demên Lurî:\n- Niha: Me mi-hwer-um.\n- Borî: Me hwer-dum.\n- Dema Bê: Bi amrazên taybet.\n\n**Tablo:**\n\n| Lêker | Niha | Borî | Bê |\n| :--- | :--- | :--- | :--- |\n| Xwerden | Mi hwerem | Hwerdum | Mi hwerem |\n| Rewten | Mi rom | Rewtem | Mi rom |'
        }
      },
      {
        title: { Sorani: 'نەرێکردن', Kurmanji: 'Neyînî' },
        content: {
          Sorani: 'نەرێکردن لە لوڕیدا:\n\n- ئێستا: (نە-) + ڕەگ. وەک: مه نە-می خواروم.\n- ڕابردوو: (نە-). وەک: مه نە-هوردوم.',
          Kurmanji: 'Neyînî di Lurî de:\n- Niha: (ne-). Wek: Me nemixwarum.\n- Borî: (ne-). Wek: Me nehwerdum.'
        }
      }
    ]
  }
];
