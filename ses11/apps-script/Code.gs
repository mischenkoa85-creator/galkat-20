/**
 * Журнал СЕС площадки 11 (ГалКат, проєкт ОС-108) — сервер для сайту
 * https://mischenkoa85-creator.github.io/galkat-20/ses11/
 *
 * Зберігає звіти робіт, документи складу і фото в Google-таблиці та на Google Диску.
 * Доступ — за особистими кодами з аркуша «Доступи».
 *
 * Як встановити (один раз):
 *   1. Виконати функцію setup — створить аркуші та код адміністратора (у аркуші «Доступи»).
 *   2. Розгорнути → Нове розгортання → Вебзастосунок: «Виконувати як: я», «Доступ: усі».
 *   3. Скопіювати адресу вебзастосунку (…/exec) і передати для сайту.
 *
 * Зміни 16.10.2026:
 *   - ідемпотентність: сайт надсилає ID запису з телефона (cid). Повтор із черги офлайн із тим самим cid
 *     не створює другий запис — сервер повертає вже записаний (dup: true). Колонка «ID клієнта».
 *   - записи складу мають «Тип»: «видача» (як раніше) або «зберігання ГАЛ-КАТ» — передача матеріалів
 *     відкладених дахів 10–11 на відповідальне зберігання ТзДВ «ГАЛ-КАТ», з номером акта (колонка «Акт»).
 *   - нові колонки дописуються праворуч у наявні аркуші самі, старі рядки не змінюються.
 *
 * Зміни 17.10.2026 — модуль «Склад», кроки 1–2:
 *   - нові аркуші «Номенклатура» (дзеркало довідника), «Надходження», «Рух», «Серійні». Створюються під блокуванням
 *     (LockService) з повторною перевіркою; ПЕРЕД публікацією нової версії виконайте setup() у редакторі.
 *   - колонка «Бригада» в «Доступи» і «Звіти» шукається за назвою заголовка; якщо її немає — дописується
 *     після останньої заповненої колонки. Інші колонки сервер за цією назвою не чіпає.
 *   - дії: receipt (надходження), move (видача / повернення / брак / передача на зберігання / інвентаризація /
 *     початкові залишки), stockRead (читання складу за роллю). stock з items — як раніше, запис у «Видачі».
 *   - сервер сам перевіряє позицію за довідником (CATALOG нижче), власника, серійні номери, наявність у місці
 *     «звідки» і ліміт даху; понад ліміт або наявність — лише з причиною.
 *   - текст від користувача, що починається з = + - @, пишеться з апострофом (без формул); текстові колонки — формат «@».
 *   - stockStart у «Налаштування» — дата переходу на склад; старіші звіти й видачі не йдуть у залишки бригад.
 *   Після заміни коду: setup() → Розгорнути → Керувати розгортаннями → редагувати → Нова версія.
 */

const SHEET_ID = '1muZlfeTZ3U5FoOCJ7Pbu1u5Jg8Dw0KVevxPisuX0d0Y';
const TZ = 'Europe/Kyiv';
const PHOTO_FOLDERS = {
  '1': '1Tiw8pVq_NpKVJqC6ul0swUcPlTvtsDiN', '2': '1hpR58TU6YNunEWBLWOdw910eAv3niHZV',
  '3': '1EvqNegY9elOC8KB2VhxUxdIR0Tx2VIus', '4': '1BUDiD3xfUXUAmfUmrcNU8aNKIZL3EDkP',
  '5': '1L-j0eFM6pXjUQnIbYf6bhnjpMApsiVmD', '6': '1kSWZ86_SSbIDqscXanjpLtzzYXd1fbVT',
  '7': '1l7rf0p_tXY2e-I-52vB9faHYFEQEZYQW', '8': '1YS5Fx7aep3WCJ1RlvBUSuGQnHwbh6Lxr',
  '9': '1tmJdNkYU-zQCffz4YHldrUox9uMiGQ1b', '10': '1ULm5sAUwqL5ak5RN8UAabue84_8VYCOC',
  '11': '1KJlSYPOwR5mxcWamAkhWZh4lNQZHGLUI', 'S': '1hmhkMO8utPaSVNM9cTjvdVj8Ahok2iDj'
};
const OBJECTS = Object.keys(PHOTO_FOLDERS);
const ROLES = ['адмін', 'виконавець', 'комірник', 'замовник'];
const MAX_PHOTOS = 8;
const STOCK_TYPES = ['видача', 'зберігання ГАЛ-КАТ'];
const CID_RE = /^[A-Za-z0-9_-]{8,64}$/;
/* межі завантажень: base64 фото ≤ 2 МБ, підпису ≤ 200 КБ (у байтах файлу) */
const MAX_PHOTO_B64 = Math.ceil(2 * 1024 * 1024 * 4 / 3);
const MAX_SIGN_B64 = Math.ceil(200 * 1024 * 4 / 3);

/* ---- склад (крок 2) ---- */
const P_STORE = 'склад';
const P_KEEP = 'зберігання ГАЛ-КАТ';
const P_SCRAP = 'брак';
const P_BRIG = 'бригада: ';
const BRIG_HEAD = 'Бригада';
/* тип документа → дозволені місця «звідки» / «куди» (вид місця) */
const MOVE_TYPES = {
  'видача': { from: ['склад'], to: ['бригада'], roof: true, prefix: 'V' },
  'повернення': { from: ['бригада'], to: ['склад'], prefix: 'P' },
  'брак': { from: ['склад', 'бригада'], to: ['брак'], reason: true, prefix: 'B' },
  'передача на зберігання': { from: ['склад'], to: ['зберігання'], roof: true, prefix: 'Z' },
  'інвентаризація': { from: ['склад', 'бригада', 'зберігання'], to: [''], signed: true, reason: true, prefix: 'I' },
  'початкові залишки': { from: ['склад', 'бригада', 'зберігання'], to: [''], opening: true, prefix: 'O' }
};
/* статус серійного номера за видом місця; «вмонтовано» ставитиме приймання (крок 3) */
const SERIAL_STATUS = { 'склад': 'склад', 'бригада': 'бригада', 'зберігання': 'зберігання', 'брак': 'брак' };
const SERIAL_RE = /^[A-Za-z0-9._\/-]{3,40}$/;
const MAX_LINES = 100;
const MAX_SERIALS = 2000;
const MAX_DOC_PHOTOS = 4;

/* BEGIN CATALOG — згенеровано tools/build_stock.py з data.js; не редагувати вручну.
   items: код → [власник c|g, облік q|s, назва, од.]; need: об’єкт → код → потреба за проєктом; legacy: об’єкт → ключ рядка специфікації → код */
const CATALOG = {
  items: {"MK01":["c","q","Балка 41х41х1,5 мм 1250 мм","шт"],"MK02":["c","q","Лага 41х41х1,5 мм 1150 мм","шт"],"MK03":["c","q","Стійка 41х41х1,5 мм 500 мм","шт"],"MK04":["c","q","З'єднувач кутовий","шт"],"MK05":["c","q","Баласт 400х400х80 мм","шт"],"MK06":["c","q","Шуруп для бетону 7,5 (6) × 42 пресшайба WAF ТХ30 оц","шт"],"MK07":["c","q","Шайба з гумовою прокладкою 6,2х16 А2 EPDM","шт"],"MK08":["c","q","Хімічно зшитий спінений поліетилен UKRIZOL 5 мм (ширина 1,5 м)","м.п."],"MK09":["c","q","Болт М10х20","шт"],"MK10":["c","q","Болт М10х60","шт"],"MK11":["c","q","Гайка з фланцем М10","шт"],"MK12":["c","q","Перев'язка між рядами 41х41х1,5 мм 1050 мм","шт"],"MK13":["c","q","Діагональ 41х41х1,5 мм 1100 мм","шт"],"MK14":["c","q","Прижим крайній 30 мм","шт"],"MK15":["c","q","Монтажна гайка з обоймою М8","шт"],"MK16":["c","q","Болт вн.шест. н/ж М8х30","шт"],"MK17":["c","q","Гровер н/ж 8","шт"],"EL01":["g","s","Модуль LONGI LR8-66HYD-645M 645 Вт","шт"],"EL02":["g","q","Провід Solar 1×6,0 мм² (із запасом 6 %) DB+","м"],"EL03":["c","q","Розгалужувач T-Branch MC-4","компл."],"EL04":["c","q","Конектор MC-4 на 6 мм²","компл."],"LT01":["c","q","Лоток сітчастий 50×50, гаряче цинк. 3000 мм","шт"],"LT02":["c","q","Кришка з заземленням, основа 50 3000 мм","шт"],"LT03":["c","q","Скоба на лоток до 100 мм BMM1010","шт"],"LT04":["c","q","Баласт під лоток (тротуарна плитка)","шт"],"LT05":["c","q","Гвинт для дротового лотка M6×20","шт"],"LT06":["c","q","Шуруп для бетону, HEX13 7,5 (6)×40","шт"],"LT07":["c","q","Шайба M6","шт"],"GF01":["c","q","Труба ПВХ гофрована, стійка до УФ Ø50 мм","м"],"TR01":["c","q","Трос сталевий 4 мм","м"],"TR02":["c","q","Затискач для троса подвійний 4 мм","шт"],"TR03":["c","q","Гак для плоских поверхонь GHP 12","шт"],"TR04":["c","q","Талреп гак/гак M16","шт"],"TR05":["c","q","Анкер латунний розпірний M12×100","шт"],"TR06":["c","q","Болт M10×100","шт"],"MK18":["c","q","Стійка 41х41х1,5 мм 550 мм","шт"],"MK19":["c","q","Перев'язка між рядами 41х41х1,5 мм 950 мм","шт"],"GF02":["c","q","Труба ПВХ гофрована, стійка до УФ Ø40","м"],"MK20":["c","q","Мінірейка 300х100х50 мм","шт"],"MK21":["c","q","Саморіз М4х17","шт"],"MK22":["c","q","Прижим міжмодульний","шт"],"GF03":["c","q","Труба ПВХ гофрована, стійка до УФ Ø20","м"],"MK23":["c","q","Стійка 41х41х1,5 мм 450 мм","шт"],"MK24":["c","q","Перев'язка між рядами 41х41х1,5 мм 1200 мм","шт"],"MK25":["c","q","Саморіз М4х15","шт"],"DC01":["g","s","Щит захисту DC DC1, DC2","шт"]},
  need: {"1":{"MK01":564,"MK02":564,"MK03":564,"MK04":564,"MK05":1128,"MK06":1272,"MK07":1272,"MK08":188,"MK09":2188,"MK10":1692,"MK11":3880,"MK12":72,"MK13":248,"MK14":1128,"MK15":1128,"MK16":1128,"MK17":1128,"EL01":282,"EL02":3045,"EL03":12,"EL04":48,"LT01":43,"LT02":43,"LT03":129,"LT04":129,"LT05":258,"LT06":258,"LT07":258,"GF01":30,"TR01":15,"TR02":6,"TR03":2,"TR04":2,"TR05":6,"TR06":6},"2":{"MK01":1248,"MK02":1248,"MK03":616,"MK18":632,"MK04":1248,"MK05":2496,"MK06":2770,"MK07":2770,"MK08":416,"MK09":4842,"MK10":3744,"MK11":8586,"MK19":71,"MK12":66,"MK13":549,"MK14":2496,"MK15":2496,"MK16":2496,"MK17":2496,"EL01":624,"EL02":3933,"EL03":24,"EL04":112,"LT01":66,"LT02":66,"LT03":198,"LT04":198,"LT05":396,"LT06":396,"LT07":396},"3":{"MK01":164,"MK02":164,"MK03":68,"MK18":96,"MK04":164,"MK05":328,"MK06":364,"MK07":364,"MK08":55,"MK09":632,"MK10":492,"MK11":1124,"MK19":4,"MK12":14,"MK13":70,"MK14":328,"MK15":328,"MK16":328,"MK17":328,"EL01":82,"EL02":1162,"EL03":4,"EL04":16,"GF02":125},"4":{"MK01":140,"MK02":140,"MK03":56,"MK18":84,"MK04":140,"MK05":280,"MK06":292,"MK07":292,"MK08":47,"MK09":550,"MK10":420,"MK11":970,"MK19":2,"MK12":4,"MK13":65,"MK14":280,"MK15":280,"MK16":280,"MK17":280,"EL01":70,"EL02":1147,"EL03":3,"EL04":12},"5":{"MK20":264,"MK21":1056,"MK14":48,"MK22":216,"MK15":264,"MK16":264,"MK17":264,"EL01":120,"EL02":1834,"EL03":5,"EL04":20,"GF02":70},"6":{"MK01":656,"MK02":656,"MK03":656,"MK04":656,"MK05":1312,"MK06":1630,"MK07":1630,"MK08":219,"MK09":2462,"MK10":1968,"MK11":4430,"MK19":159,"MK13":247,"MK14":1312,"MK15":1312,"MK16":1312,"MK17":1312,"EL01":328,"EL02":5860,"EL03":14,"EL04":56,"LT01":32,"LT02":32,"LT03":96,"LT04":96,"LT05":192,"LT06":192,"LT07":192},"7":{"MK20":52,"MK21":208,"MK14":16,"MK22":36,"MK15":52,"MK16":52,"MK17":52,"EL01":22,"EL02":483,"EL03":1,"EL04":4,"GF03":10},"8":{"MK20":154,"MK21":616,"MK14":20,"MK22":134,"MK15":154,"MK16":154,"MK17":154,"EL01":72,"EL02":950,"EL03":3,"EL04":12},"9":{"MK20":52,"MK21":208,"MK14":8,"MK22":44,"MK15":52,"MK16":52,"MK17":52,"EL01":24,"EL02":211,"EL03":1,"EL04":4,"GF03":10},"10":{"MK01":352,"MK02":352,"MK23":352,"MK04":352,"MK05":704,"MK06":784,"MK07":784,"MK08":118,"MK09":1364,"MK10":1056,"MK11":2420,"MK19":40,"MK13":154,"MK14":704,"MK15":704,"MK16":704,"MK17":704,"EL01":176,"EL02":1584,"EL03":7,"EL04":32,"LT01":22,"LT02":22,"LT03":66,"LT04":66,"LT05":132,"LT06":132,"LT07":132},"11":{"MK01":350,"MK02":350,"MK18":350,"MK04":350,"MK05":700,"MK06":772,"MK07":772,"MK08":117,"MK09":1358,"MK10":1050,"MK11":2408,"MK24":36,"MK13":154,"MK14":700,"MK15":700,"MK16":700,"MK17":700,"EL01":175,"EL02":1329,"EL03":7,"EL04":32,"LT01":30,"LT02":30,"LT03":90,"LT04":90,"LT05":180,"LT06":180,"LT07":180},"S":{"DC01":2}},
  legacy: {"1":{"m1":"MK01","m2":"MK02","m3":"MK03","m4":"MK04","m5":"MK05","m6":"MK06","m7":"MK07","m8":"MK08","m9":"MK09","m10":"MK10","m11":"MK11","m12":"MK12","m13":"MK13","m14":"MK14","m15":"MK15","m16":"MK16","m17":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","t1":"LT01","t2":"LT02","t3":"LT03","t4":"LT04","t5":"LT05","t6":"LT06","t7":"LT07","r1":"GF01","r2":"TR01","r3":"TR02","r4":"TR03","r5":"TR04","r6":"TR05","r7":"TR06"},"2":{"m1":"MK01","m2":"MK02","m3":"MK03","m4":"MK18","m5":"MK04","m6":"MK05","m7":"MK06","m8":"MK07","m9":"MK08","m10":"MK09","m11":"MK10","m12":"MK11","m13":"MK19","m14":"MK12","m15":"MK13","m16":"MK14","m17":"MK15","m18":"MK16","m19":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","t1":"LT01","t2":"LT02","t3":"LT03","t4":"LT04","t5":"LT05","t6":"LT06","t7":"LT07"},"3":{"m1":"MK01","m2":"MK02","m3":"MK03","m4":"MK18","m5":"MK04","m6":"MK05","m7":"MK06","m8":"MK07","m9":"MK08","m10":"MK09","m11":"MK10","m12":"MK11","m13":"MK19","m14":"MK12","m15":"MK13","m16":"MK14","m17":"MK15","m18":"MK16","m19":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","g1":"GF02"},"4":{"m1":"MK01","m2":"MK02","m3":"MK03","m4":"MK18","m5":"MK04","m6":"MK05","m7":"MK06","m8":"MK07","m9":"MK08","m10":"MK09","m11":"MK10","m12":"MK11","m13":"MK19","m14":"MK12","m15":"MK13","m16":"MK14","m17":"MK15","m18":"MK16","m19":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04"},"5":{"m1":"MK20","m2":"MK21","m3":"MK14","m4":"MK22","m5":"MK15","m6":"MK16","m7":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","g1":"GF02"},"6":{"m1":"MK01","m2":"MK02","m3":"MK03","m4":"MK04","m5":"MK05","m6":"MK06","m7":"MK07","m8":"MK08","m9":"MK09","m10":"MK10","m11":"MK11","m12":"MK19","m13":"MK13","m14":"MK14","m15":"MK15","m16":"MK16","m17":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","t1":"LT01","t2":"LT02","t3":"LT03","t4":"LT04","t5":"LT05","t6":"LT06","t7":"LT07"},"7":{"m1":"MK20","m2":"MK21","m3":"MK14","m4":"MK22","m5":"MK15","m6":"MK16","m7":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","g1":"GF03"},"8":{"m1":"MK20","m2":"MK21","m3":"MK14","m4":"MK22","m5":"MK15","m6":"MK16","m7":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04"},"9":{"m1":"MK20","m2":"MK21","m3":"MK14","m4":"MK22","m5":"MK15","m6":"MK16","m7":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","g1":"GF03"},"10":{"m1":"MK01","m2":"MK02","m3":"MK23","m4":"MK04","m5":"MK05","m6":"MK06","m7":"MK07","m8":"MK08","m9":"MK09","m10":"MK10","m11":"MK11","m12":"MK19","m13":"MK13","m14":"MK14","m15":"MK15","m16":"MK16","m17":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","t1":"LT01","t2":"LT02","t3":"LT03","t4":"LT04","t5":"LT05","t6":"LT06","t7":"LT07"},"11":{"m1":"MK01","m2":"MK02","m3":"MK18","m4":"MK04","m5":"MK05","m6":"MK06","m7":"MK07","m8":"MK08","m9":"MK09","m10":"MK10","m11":"MK11","m12":"MK24","m13":"MK13","m14":"MK14","m15":"MK15","m16":"MK16","m17":"MK17","e1":"EL01","e2":"EL02","e3":"EL03","e4":"EL04","t1":"LT01","t2":"LT02","t3":"LT03","t4":"LT04","t5":"LT05","t6":"LT06","t7":"LT07"}}
};
/* END CATALOG */

const TABS = {
  access: { name: 'Доступи', head: ['Код', 'Ім’я', 'Роль', 'Активний', 'Примітка'] },
  reports: { name: 'Звіти', head: ['ID звіту', 'Дата', 'Об’єкт', 'Дія', 'Кількість', 'Кран, маш.-год', 'Фото дня', 'Фото, шт', 'Примітка', 'Хто', 'Записано', 'ID клієнта'] },
  stock: { name: 'Видачі', head: ['ID видачі', 'Дата', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Примітка', 'Хто', 'Записано', 'Тип', 'Акт', 'ID клієнта'] },
  settings: { name: 'Налаштування', head: ['Параметр', 'Значення', 'Пояснення'] },
  norms: { name: 'Норми', head: ['Ключ', 'Норма, люд-год/од.', 'Пояснення'] },
  plan: { name: 'Обсяги', head: ['Об’єкт', 'Дія', 'Обсяг', 'Пояснення'] },
  nomen: { name: 'Номенклатура', head: ['Код', 'Назва', 'Од.', 'Облік', 'Власник', 'Примітка'] },
  receipts: { name: 'Надходження', head: ['ID документа', 'Дата', 'Постачальник / накладна', 'Позиція', 'Найменування', 'Кількість', 'Од.', 'Власник', 'Серійні номери', 'Фото', 'Хто', 'Записано', 'ID клієнта'] },
  moves: { name: 'Рух', head: ['ID документа', 'Дата', 'Тип', 'Звідки', 'Куди', 'Дах', 'Позиція', 'Найменування', 'Кількість', 'Серійні номери', 'Причина', 'Хто', 'Підпис', 'Записано', 'Власник', 'Акт', 'ID клієнта'] },
  serials: { name: 'Серійні', head: ['Серійний номер', 'Позиція', 'Статус', 'Місце', 'Дах', 'Останній документ', 'Змінено'] }
};
/* аркуші з колонкою «Бригада» (шукається за назвою) */
const BRIG_TABS = ['access', 'reports'];
/* номер колонки «ID клієнта» (з 1) */
const CID_COL = { reports: 12, stock: 12, receipts: 13, moves: 17 };
/* колонка «Хто» (з 0) — для видалення власних записів */
const WHO_COL = { reports: 9, stock: 7, receipts: 10, moves: 11 };
/* текстові колонки (формат «@»: «00123», «3/10» лишаються текстом) */
const TEXT_COLS = {
  access: ['A', 'B', 'E'], reports: ['B', 'I', 'J', 'L'], stock: ['B', 'D', 'E', 'G', 'H', 'J', 'K', 'L'],
  nomen: ['A', 'B', 'C', 'D', 'E', 'F'], receipts: ['B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'M'],
  moves: ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'O', 'P', 'Q'], serials: ['A', 'B', 'C', 'D', 'E', 'F']
};
const DEFAULT_SETTINGS = [
  ['day1', '', 'День 1 за план-графіком договору (дата РРРР-ММ-ДД): перший робочий день після виконання стартових умов, п. 3.1'],
  ['days', 60, 'Строк монтажу і ПНР у робочих днях, п. 3.2 договору'],
  ['week', 5, 'Робочих днів на тиждень: 5 (Пн–Пт) або 6 (Пн–Сб)'],
  ['rain', 60, 'Ймовірність дощу, %, з якої день вважається дощовим для робіт на даху'],
  ['gust', 12, 'Пориви вітру, м/с, з яких кран і монтаж модулів — під ризиком'],
  ['holidays', '', 'Неробочі дати через кому, РРРР-ММ-ДД'],
  ['acceptance', 'foreman', 'Хто приймає приховані роботи: foreman (прораб підрядника), supervision (технагляд замовника), both (обидва послідовно)'],
  ['customerSeesContractorStock', 'ні', 'Замовник бачить залишки матеріалів підрядника: так / ні. Давальницькі ГАЛ-КАТ замовник бачить завжди']
];
const STOCK_START_NOTE = 'Дата переходу на облік складу (РРРР-ММ-ДД). Звіти й старі «Видачі» раніше цієї дати не йдуть у залишки бригад; стан на цю дату — документ «Початкові залишки»';

/* ---------------- безпечний текст ---------------- */
/* = + - @ на початку — Таблиця вважала б це формулою: пишемо з апострофом; читаємо — без нього */
function safe_(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function unsafe_(v) { v = String(v == null ? '' : v); return /^'[=+\-@]/.test(v) ? v.slice(1) : v; }
const r3_ = v => Math.round(v * 1000) / 1000;
const today_ = () => Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
const itemOwner_ = c => CATALOG.items[c] && CATALOG.items[c][0] === 'g' ? 'ГАЛ-КАТ' : 'підрядник';

/* ---------------- setup ---------------- */
/* Виконати в редакторі перед публікацією нової версії: аркуші, колонки «Бригада», формати, stockStart, довідник */
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    createSheets_(ss);
    for (const k in TABS) applyTextFormats_(ss.getSheetByName(TABS[k].name), k);
    fillNomen_(ss);
    const sh = ss.getSheetByName(TABS.access.name);
    if (sh.getLastRow() < 2) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      sh.getRange(2, 1, 1, 5).setValues([[code, 'Адміністратор', 'адмін', 'так', 'Змініть ім’я; код можна змінити']]);
      Logger.log('Код адміністратора: ' + code);
    }
    const first = ss.getSheets()[0];
    if (first.getName() === 'Аркуш1' || first.getName() === 'Sheet1') { if (first.getLastRow() === 0) ss.deleteSheet(first); }
  } finally { lock.releaseLock(); }
  Logger.log('Готово. Аркуші створено або перевірено.');
}

function headOf_(sh) { const lc = sh.getLastColumn(); return lc ? sh.getRange(1, 1, 1, lc).getValues()[0].map(function (v) { return String(v).trim(); }) : []; }
/* номер колонки (з 1) за назвою заголовка, 0 — немає */
function colOf_(sh, name) { return headOf_(sh).indexOf(name) + 1; }

/* швидка перевірка без блокування: усі аркуші є, старі мають повні заголовки, «Бригада» є, stockStart заданий */
function sheetsReady_(ss) {
  const names = ss.getSheets().map(function (s) { return s.getName(); });
  for (const k in TABS) if (names.indexOf(TABS[k].name) < 0) return false;
  for (const k of ['access', 'reports', 'stock']) {
    const h = headOf_(ss.getSheetByName(TABS[k].name));
    if (h.length < TABS[k].head.length) return false;
    if (BRIG_TABS.indexOf(k) >= 0 && h.indexOf(BRIG_HEAD) < 0) return false;
  }
  return settingRow_(ss, 'stockStart') > 0;
}
function settingRow_(ss, key) {
  const v = ss.getSheetByName(TABS.settings.name).getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (String(v[i][0]).trim() === key) return i + 1;
  return 0;
}

/* створення аркушів — лише під блокуванням і з повторною перевіркою: паралельний перший запит не загубить рядок */
function ensureSheets_(ss) {
  if (sheetsReady_(ss)) return;
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { if (!sheetsReady_(ss)) createSheets_(ss); } finally { lock.releaseLock(); }
}

function createSheets_(ss) {
  for (const k in TABS) {
    const t = TABS[k];
    let sh = ss.getSheetByName(t.name);
    if (!sh) {
      sh = ss.insertSheet(t.name);
      sh.getRange(1, 1, 1, t.head.length).setValues([t.head]).setFontWeight('bold').setBackground('#e8eef6');
      sh.setFrozenRows(1);
      applyTextFormats_(sh, k);
      if (k === 'settings') sh.getRange(2, 1, DEFAULT_SETTINGS.length, 3).setValues(DEFAULT_SETTINGS);
      if (k === 'nomen') fillNomen_(ss);
      sh.autoResizeColumns(1, t.head.length);
    } else {
      /* аркуш створено старою версією: дописати відсутні заголовки праворуч */
      const lc = sh.getLastColumn();
      if (lc >= 1 && lc < t.head.length) sh.getRange(1, lc + 1, 1, t.head.length - lc).setValues([t.head.slice(lc)]).setFontWeight('bold').setBackground('#e8eef6');
    }
    if (BRIG_TABS.indexOf(k) >= 0 && !colOf_(sh, BRIG_HEAD)) {
      const c = Math.max(sh.getLastColumn(), t.head.length) + 1;
      sh.getRange(1, c, 1, 1).setValues([[BRIG_HEAD]]).setFontWeight('bold').setBackground('#e8eef6');
      sh.getRange(1, c, sh.getMaxRows ? sh.getMaxRows() : 1000, 1).setNumberFormat('@');
    }
  }
  if (!settingRow_(ss, 'stockStart')) {
    const s = ss.getSheetByName(TABS.settings.name);
    s.getRange(s.getLastRow() + 1, 1, 1, 3).setValues([['stockStart', today_(), STOCK_START_NOTE]]);
  }
}

function applyTextFormats_(sh, k) {
  (TEXT_COLS[k] || []).forEach(function (L) { sh.getRange(L + ':' + L).setNumberFormat('@'); });
  if (BRIG_TABS.indexOf(k) >= 0) { const c = colOf_(sh, BRIG_HEAD); if (c) sh.getRange(1, c, sh.getMaxRows ? sh.getMaxRows() : 1000, 1).setNumberFormat('@'); }
}

/* «Номенклатура» — дзеркало довідника з CATALOG (лише якщо аркуш порожній) */
function fillNomen_(ss) {
  const sh = ss.getSheetByName(TABS.nomen.name); if (!sh || sh.getLastRow() > 1) return;
  const rows = Object.keys(CATALOG.items).map(function (c) { const x = CATALOG.items[c]; return [c, safe_(x[2]), x[3], x[1] === 's' ? 'серійний' : 'кількісний', x[0] === 'g' ? 'ГАЛ-КАТ' : 'підрядник', '']; });
  if (rows.length) sh.getRange(2, 1, rows.length, 6).setValues(rows);
}

/* ---------------- web app ---------------- */
function doGet() {
  return ContentService.createTextOutput('Журнал СЕС площадки 11: сервер працює.');
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'bad_request' }); }
  if (!req || typeof req !== 'object') return out_({ ok: false, error: 'bad_request' });
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    ensureSheets_(ss);
    const me = auth_(ss, req.code);
    if (!me) return out_({ ok: false, error: 'bad_code' });
    const writer = me.role === 'адмін' || me.role === 'комірник';
    switch (req.action) {
      case 'login': return out_({ ok: true, me: me });
      case 'data': return out_({ ok: true, me: me, data: readAll_(ss, me) });
      case 'report':
        if (!(me.role === 'адмін' || me.role === 'виконавець')) return out_({ ok: false, error: 'forbidden' });
        return out_(saveReport_(ss, me, req));
      case 'stock':
        /* лише запис старого формату («Видачі»): items — об’єкт {ключ: {q, name}} */
        if (!req.items || typeof req.items !== 'object' || Array.isArray(req.items)) return out_({ ok: false, error: 'bad_request' });
        if (!writer) return out_({ ok: false, error: 'forbidden' });
        return out_(saveStock_(ss, me, req));
      case 'stockRead': return out_({ ok: true, me: me, stock: readStock_(ss, me) });
      case 'receipt':
        if (!writer) return out_({ ok: false, error: 'forbidden' });
        return out_(saveReceipt_(ss, me, req));
      case 'move':
        if (!writer) return out_({ ok: false, error: 'forbidden' });
        return out_(saveMove_(ss, me, req));
      case 'delete':
        return out_(deleteRows_(ss, me, req));
      default: return out_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return out_({ ok: false, error: 'server', message: String(err && err.message || err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function auth_(ss, code) {
  code = String(code || '').trim();
  if (!code) return null;
  const sh = ss.getSheetByName(TABS.access.name);
  const rows = sh.getDataRange().getValues(); const bc = rows[0].map(function (v) { return String(v).trim(); }).indexOf(BRIG_HEAD);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim() === code) {
      const active = String(r[3]).trim().toLowerCase();
      if (active === 'ні' || active === 'no' || active === 'false') return null;
      const role = String(r[2]).trim().toLowerCase();
      const me = { name: unsafe_(String(r[1] || 'Без імені').trim()), role: ROLES.indexOf(role) >= 0 ? role : 'замовник' };
      if (me.role === 'виконавець') me.brigade = (bc >= 0 ? unsafe_(String(r[bc] || '').trim()).slice(0, 60) : '') || me.name;
      return me;
    }
  }
  return null;
}

function ymd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '').trim();
}

function stamp_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return String(v || '');
}

function yes_(v) { return v === true || /^(так|true|yes|1|да)$/i.test(String(v == null ? '' : v).trim()); }

/* ім’я виконавця → бригада, і перелік бригад активних виконавців (колонка «Бригада» — за назвою) */
function brigades_(ss) {
  const rows = ss.getSheetByName(TABS.access.name).getDataRange().getValues();
  const bc = rows[0].map(function (v) { return String(v).trim(); }).indexOf(BRIG_HEAD);
  const byName = {}; const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; if (String(r[2]).trim().toLowerCase() !== 'виконавець') continue;
    const name = unsafe_(String(r[1] || '').trim()); const br = (bc >= 0 ? unsafe_(String(r[bc] || '').trim()).slice(0, 60) : '') || name;
    if (name && !byName[name]) byName[name] = br;
    const active = String(r[3]).trim().toLowerCase();
    if (br && list.indexOf(br) < 0 && !(active === 'ні' || active === 'no' || active === 'false')) list.push(br);
  }
  return { byName: byName, list: list };
}

/* ---------------- read ---------------- */
function readAll_(ss, me) {
  const repSh = ss.getSheetByName(TABS.reports.name);
  const rep = repSh.getDataRange().getValues();
  const bc = rep[0].map(function (v) { return String(v).trim(); }).indexOf(BRIG_HEAD);
  const brs = brigades_(ss).byName;
  const reports = {};
  for (let i = 1; i < rep.length; i++) {
    const r = rep[i]; const id = String(r[0]); if (!id) continue;
    const x = reports[id] || (reports[id] = { id: id, cid: String(r[11] || ''), d: ymd_(r[1]), o: String(r[2]), items: {}, crane: 0, photo: '', photos: 0, n: '', by: '', at: '', br: '' });
    const w = String(r[3]); const q = Number(r[4]);
    if (w && w !== '—' && isFinite(q)) x.items[w] = (x.items[w] || 0) + q;
    if (Number(r[5]) > 0) x.crane += Number(r[5]);
    if (r[6]) x.photo = String(r[6]);
    if (Number(r[7]) > 0) x.photos = Math.max(x.photos, Number(r[7]));
    if (r[8]) x.n = unsafe_(r[8]);
    x.by = unsafe_(r[9]); x.at = stamp_(r[10]);
    x.br = (bc >= 0 ? unsafe_(String(r[bc] || '').trim()) : '') || brs[x.by] || '';
  }
  const settings = readSettings_(ss);
  /* замовник без customerSeesContractorStock — лише давальницькі рядки старих «Видач» (власник — за довідником сервера) */
  const custOnly = me && me.role === 'замовник' && !yes_(settings.customerSeesContractorStock);
  const st = ss.getSheetByName(TABS.stock.name).getDataRange().getValues();
  const stock = {};
  for (let i = 1; i < st.length; i++) {
    const r = st[i]; const id = String(r[0]); if (!id) continue;
    const k = String(r[3]); const q = Number(r[5]); const o = String(r[2]);
    if (custOnly && itemOwner_((CATALOG.legacy[o] || {})[k]) !== 'ГАЛ-КАТ') continue;
    const x = stock[id] || (stock[id] = { id: id, cid: String(r[11] || ''), d: ymd_(r[1]), o: o, items: {}, type: String(r[9] || '').trim() || 'видача', act: unsafe_(r[10]), n: '', by: '', at: '' });
    if (k && isFinite(q)) x.items[k] = (x.items[k] || 0) + q;
    if (r[6]) x.n = unsafe_(r[6]);
    x.by = unsafe_(r[7]); x.at = stamp_(r[8]);
  }
  const norms = {};
  const n = ss.getSheetByName(TABS.norms.name).getDataRange().getValues();
  for (let i = 1; i < n.length; i++) { const k = String(n[i][0]).trim(); const v = Number(n[i][1]); if (k && isFinite(v) && n[i][1] !== '') norms[k] = v; }
  const plan = {};
  const p = ss.getSheetByName(TABS.plan.name).getDataRange().getValues();
  for (let i = 1; i < p.length; i++) { const o = String(p[i][0]).trim(); const w = String(p[i][1]).trim(); const v = Number(p[i][2]); if (o && w && isFinite(v) && p[i][2] !== '') plan[o + '.' + w] = v; }
  return { reports: Object.values(reports), stock: Object.values(stock), settings: settings, norms: norms, plan: plan };
}

function readSettings_(ss) {
  const settings = {};
  const s = ss.getSheetByName(TABS.settings.name).getDataRange().getValues();
  for (let i = 1; i < s.length; i++) { const k = String(s[i][0]).trim(); if (k) settings[k] = s[i][1] instanceof Date ? ymd_(s[i][1]) : (typeof s[i][1] === 'string' ? unsafe_(s[i][1]) : s[i][1]); }
  return settings;
}

const splitSerials_ = v => unsafe_(v).split(/[\s,;]+/).filter(Boolean);

/* документи складу. Фільтр за роллю:
   адмін, комірник — усе; виконавець — лише рух своєї бригади; замовник — давальницькі ГАЛ-КАТ,
   матеріали підрядника — лише якщо customerSeesContractorStock. Власник — за довідником сервера. */
function readStock_(ss, me) {
  const settings = readSettings_(ss);
  const seeAll = yes_(settings.customerSeesContractorStock);
  const acceptance = ['foreman', 'supervision', 'both'].indexOf(String(settings.acceptance || '').trim()) >= 0 ? String(settings.acceptance).trim() : 'foreman';
  const full = me.role === 'адмін' || me.role === 'комірник';
  const myPlace = me.role === 'виконавець' ? P_BRIG + me.brigade : '';
  const lineOk = owner => full || me.role === 'виконавець' || seeAll || owner === 'ГАЛ-КАТ';

  const receipts = {};
  if (me.role !== 'виконавець') {
    const rv = ss.getSheetByName(TABS.receipts.name).getDataRange().getValues();
    for (let i = 1; i < rv.length; i++) {
      const r = rv[i]; const id = String(r[0]); if (!id) continue;
      const c = String(r[3]); const owner = itemOwner_(c); if (!lineOk(owner)) continue;
      const x = receipts[id] || (receipts[id] = { id: id, cid: String(r[12] || ''), d: ymd_(r[1]), doc: unsafe_(r[2]), lines: [], photo: '', by: '', at: '' });
      x.lines.push({ c: c, name: unsafe_(r[4]), q: Number(r[5]) || 0, unit: unsafe_(r[6]), owner: owner, serials: splitSerials_(r[8]) });
      if (r[9]) x.photo = String(r[9]);
      x.by = unsafe_(r[10]); x.at = stamp_(r[11]);
    }
  }
  const moves = {};
  const mv = ss.getSheetByName(TABS.moves.name).getDataRange().getValues();
  for (let i = 1; i < mv.length; i++) {
    const r = mv[i]; const id = String(r[0]); if (!id) continue;
    const from = unsafe_(r[3]); const to = unsafe_(r[4]);
    if (myPlace && from !== myPlace && to !== myPlace) continue;
    const c = String(r[6]); const owner = itemOwner_(c); if (!lineOk(owner)) continue;
    const x = moves[id] || (moves[id] = { id: id, cid: String(r[16] || ''), d: ymd_(r[1]), type: String(r[2] || ''), from: from, to: to, o: String(r[5] || ''), lines: [], reason: unsafe_(r[10]), by: '', sign: '', act: unsafe_(r[15]), at: '' });
    x.lines.push({ c: c, name: unsafe_(r[7]), q: Number(r[8]) || 0, owner: owner, serials: splitSerials_(r[9]) });
    if (r[12]) x.sign = String(r[12]);
    x.by = unsafe_(r[11]); x.at = stamp_(r[13]);
  }
  const serials = [];
  const sv = ss.getSheetByName(TABS.serials.name).getDataRange().getValues();
  for (let i = 1; i < sv.length; i++) {
    const r = sv[i]; const sn = unsafe_(r[0]).trim(); if (!sn) continue;
    const x = { sn: sn, c: String(r[1]), status: String(r[2] || ''), place: unsafe_(r[3]), o: String(r[4] || ''), doc: String(r[5] || '') };
    if (myPlace && x.place !== myPlace) continue;
    if (!lineOk(itemOwner_(x.c))) continue;
    serials.push(x);
  }
  /* залишки за місцями лише з документів (без списання за звітами — його рахує сайт за специфікаціями виробів) */
  const bal = {};
  const add = function (place, c, q) { if (!place) return; const b = bal[place] || (bal[place] = {}); b[c] = r3_((b[c] || 0) + q); };
  for (const id in receipts) receipts[id].lines.forEach(function (l) { add(P_STORE, l.c, l.q); });
  for (const id in moves) {
    const m = moves[id]; const T = MOVE_TYPES[m.type] || {};
    m.lines.forEach(function (l) { if (T.signed || T.opening) add(m.from, l.c, l.q); else { add(m.from, l.c, -l.q); add(m.to, l.c, l.q); } });
  }
  if (myPlace) for (const p in bal) if (p !== myPlace) delete bal[p];
  let brigades;
  const fromMoves = function (list) { for (const id in moves) [moves[id].from, moves[id].to].forEach(function (p) { if (p.indexOf(P_BRIG) === 0) { const b = p.slice(P_BRIG.length); if (list.indexOf(b) < 0) list.push(b); } }); return list; };
  if (full) brigades = fromMoves(brigades_(ss).list);
  else if (myPlace) brigades = [me.brigade];
  else brigades = fromMoves([]);
  return {
    receipts: Object.values(receipts), moves: Object.values(moves), serials: serials, bal: bal, brigades: brigades,
    cfg: { customerSeesContractorStock: seeAll, acceptance: acceptance, contractorVisible: full || me.role === 'виконавець' || seeAll, stockStart: ymd_(settings.stockStart || '') }
  };
}

/* ---------------- write ---------------- */
function newId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss') + Math.floor(Math.random() * 1000);
}

/* перший рядок аркуша з цим ID клієнта або null; col — номер колонки «ID клієнта» (з 1) */
function findCid_(sh, cid, col) {
  if (!cid) return null;
  col = col || 12;
  const last = sh.getLastRow(); if (last < 2) return null;
  const vals = sh.getRange(2, 1, last - 1, col).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][col - 1]) === cid) return vals[i];
  return null;
}

function dayFolder_(objectId, d) {
  const root = DriveApp.getFolderById(PHOTO_FOLDERS[objectId]);
  const it = root.getFoldersByName(d);
  return it.hasNext() ? it.next() : root.createFolder(d);
}

/* фото накладних і підписи: «Загальна частина» → «Склад» → дата */
function stockFolder_(d) {
  const root = DriveApp.getFolderById(PHOTO_FOLDERS.S);
  const a = root.getFoldersByName('Склад'); const sk = a.hasNext() ? a.next() : root.createFolder('Склад');
  const b = sk.getFoldersByName(d); return b.hasNext() ? b.next() : sk.createFolder(d);
}

/* фото з запиту: перевірка розміру base64; null — завелике */
function photosOf_(list, max, cap) {
  const out = Array.isArray(list) ? list.slice(0, max) : [];
  for (let i = 0; i < out.length; i++) if (out[i] && out[i].b64 && String(out[i].b64).length > cap) return null;
  return out.filter(function (p) { return p && p.b64; });
}

function saveReport_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0) return { ok: false, error: 'bad_object' };
  const items = req.items && typeof req.items === 'object' ? req.items : {}; const keys = Object.keys(items).filter(function (w) { return /^[a-z_0-9]{2,20}$/.test(w) && isFinite(Number(items[w])) && Number(items[w]) !== 0; });
  const crane = Math.max(0, Number(req.crane) || 0);
  const photos = photosOf_(req.photos, MAX_PHOTOS, MAX_PHOTO_B64);
  if (!photos) return { ok: false, error: 'bad_request', message: 'photo_too_big' };
  if (!keys.length && !crane && !photos.length) return { ok: false, error: 'empty' };
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.reports.name);
  const prev = findCid_(sh, cid);
  if (prev) return { ok: true, dup: true, id: String(prev[0]), photo: String(prev[6] || ''), photos: Number(prev[7]) || 0 };
  const id = newId_('R');
  const files = [];
  let folderUrl = '';
  let saved = 0;
  if (photos.length) {
    const folder = dayFolder_(o, d);
    folderUrl = folder.getUrl();
    const stamp = Utilities.formatDate(new Date(), TZ, 'HHmmss');
    photos.forEach(function (p, i) {
      const blob = Utilities.newBlob(Utilities.base64Decode(p.b64), p.mime || 'image/jpeg', (o === 'S' ? 'Загальна' : 'Дах' + o) + '_' + d + '_' + stamp + '_' + (i + 1) + '.jpg');
      files.push(folder.createFile(blob)); saved++;
    });
  }
  const note = safe_(String(req.note || '').slice(0, 300)); const who = safe_(me.name);
  const now = new Date();
  const rows = [];
  if (!keys.length) rows.push([id, d, o, '—', '', crane || '', folderUrl, saved || '', note, who, now, cid]);
  keys.forEach(function (w, i) { rows.push([id, d, o, w, Number(items[w]), i === 0 ? (crane || '') : '', folderUrl, i === 0 ? (saved || '') : '', i === 0 ? note : '', who, now, cid]); });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    /* дві одночасні спроби з тим самим cid: записує лише перша, фото другої — у кошик */
    const again = findCid_(sh, cid);
    if (again) { files.forEach(function (f) { f.setTrashed(true); }); return { ok: true, dup: true, id: String(again[0]), photo: String(again[6] || ''), photos: Number(again[7]) || 0 }; }
    const at = sh.getLastRow() + 1;
    sh.getRange(at, 1, rows.length, rows[0].length).setValues(rows);
    /* бригада — лише в колонку з заголовком «Бригада» */
    const bc = colOf_(sh, BRIG_HEAD);
    if (bc && me.brigade) sh.getRange(at, bc, rows.length, 1).setValues(rows.map(function () { return [safe_(me.brigade)]; }));
  } finally { lock.releaseLock(); }
  return { ok: true, id: id, photo: folderUrl, photos: saved };
}

/* старий формат складу («Видачі»): лишається для записів із черги телефонів зі старою версією сайту */
function saveStock_(ss, me, req) {
  const d = String(req.d || ''); const o = String(req.o || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  if (OBJECTS.indexOf(o) < 0 || o === 'S') return { ok: false, error: 'bad_object' };
  const items = req.items;
  const keys = Object.keys(items).filter(function (k) { return /^[a-z0-9]{1,8}$/.test(k) && items[k] && isFinite(Number(items[k].q)) && Number(items[k].q) !== 0; });
  if (!keys.length) return { ok: false, error: 'empty' };
  const type = String(req.type || req.phase || 'видача').trim();
  if (STOCK_TYPES.indexOf(type) < 0) return { ok: false, error: 'bad_type' };
  const act = safe_(String(req.act || '').slice(0, 60));
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const id = newId_(type === 'видача' ? 'V' : 'Z'); const note = safe_(String(req.note || '').slice(0, 200)); const now = new Date();
  const rows = keys.map(function (k, i) { return [id, d, o, k, safe_(String(items[k].name || '').slice(0, 200)), Number(items[k].q), i === 0 ? note : '', safe_(me.name), now, type, act, cid]; });
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss.getSheetByName(TABS.stock.name);
    const prev = findCid_(sh, cid);
    if (prev) return { ok: true, dup: true, id: String(prev[0]) };
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}

/* рядки документа складу: [{c, q, serials}] → перевірені за довідником сервера, або { error }.
   Серійна позиція (модулі, щитки DC) — лише з серійними номерами, їх кількість = кількості. */
function cleanLines_(req, signed) {
  const src = Array.isArray(req.lines) ? req.lines : [];
  if (!src.length) return { error: 'empty' };
  if (src.length > MAX_LINES) return { error: 'bad_lines' };
  const lines = []; const seen = {}; let nSer = 0;
  for (let i = 0; i < src.length; i++) {
    const l = src[i] || {}; const c = String(l.c || ''); const cat = CATALOG.items[c];
    if (!cat) return { error: 'bad_item', message: c };
    const q = r3_(Number(l.q));
    if (!isFinite(q) || q === 0 || (!signed && q < 0) || Math.abs(q) > 1e7) return { error: 'bad_qty' };
    const serials = Array.isArray(l.serials) ? l.serials.map(function (s) { return String(s).trim(); }).filter(Boolean) : [];
    for (let j = 0; j < serials.length; j++) {
      if (!SERIAL_RE.test(serials[j])) return { error: 'bad_serial', message: serials[j] };
      if (seen[serials[j]]) return { error: 'serial_dup', message: serials[j] };
      seen[serials[j]] = true;
    }
    if (signed) { if (serials.length) return { error: 'serial_state' }; }
    else if (cat[1] === 's' ? serials.length !== q : serials.length > 0) return { error: 'serial_count', message: c };
    nSer += serials.length; if (nSer > MAX_SERIALS) return { error: 'bad_lines' };
    lines.push({ c: c, q: q, name: safe_(String(l.name || cat[2]).slice(0, 200)), unit: cat[3], owner: itemOwner_(c), serials: serials });
  }
  return { lines: lines };
}

function placeKind_(p) {
  p = String(p || '');
  if (p === P_STORE) return 'склад';
  if (p === P_KEEP) return 'зберігання';
  if (p === P_SCRAP) return 'брак';
  if (p.indexOf(P_BRIG) === 0 && p.length > P_BRIG.length && p.length <= P_BRIG.length + 60) return 'бригада';
  return p === '' ? '' : null;
}

function savePhotos_(list, d, prefix, files) {
  if (!list.length) return '';
  const folder = stockFolder_(d); const stamp = Utilities.formatDate(new Date(), TZ, 'HHmmss');
  list.forEach(function (p, i) {
    files.push(folder.createFile(Utilities.newBlob(Utilities.base64Decode(p.b64), p.mime || 'image/jpeg', prefix + '_' + d + '_' + stamp + '_' + (i + 1) + (/png/.test(p.mime || '') ? '.png' : '.jpg'))));
  });
  return files.length ? folder.getUrl() : '';
}
const trash_ = files => files.forEach(function (f) { f.setTrashed(true); });

/* ---- стан складу за документами (під блокуванням) ---- */
function docValues_(ss) {
  return {
    rv: ss.getSheetByName(TABS.receipts.name).getDataRange().getValues(),
    mv: ss.getSheetByName(TABS.moves.name).getDataRange().getValues(),
    lv: ss.getSheetByName(TABS.stock.name).getDataRange().getValues()
  };
}
/* залишки за місцями (документи), видано на дах (видача − повернення + старі «Видачі»), бригади з «Руху» */
function docState_(V) {
  const bal = {}, roofIss = {}, brs = [];
  const add = function (m, a, c, q) { const x = m[a] || (m[a] = {}); x[c] = r3_((x[c] || 0) + q); };
  for (let i = 1; i < V.rv.length; i++) if (V.rv[i][0]) add(bal, P_STORE, String(V.rv[i][3]), Number(V.rv[i][5]) || 0);
  for (let i = 1; i < V.mv.length; i++) {
    const r = V.mv[i]; if (!r[0]) continue;
    const type = String(r[2]); const T = MOVE_TYPES[type] || {}; const from = unsafe_(r[3]); const to = unsafe_(r[4]); const o = String(r[5] || ''); const c = String(r[6]); const q = Number(r[8]) || 0;
    if (T.signed || T.opening) add(bal, from, c, q); else { add(bal, from, c, -q); if (to) add(bal, to, c, q); }
    if (type === 'видача' && o) add(roofIss, o, c, q);
    if (type === 'повернення' && o) add(roofIss, o, c, -q);
    [from, to].forEach(function (p) { if (p.indexOf(P_BRIG) === 0) { const b = p.slice(P_BRIG.length); if (brs.indexOf(b) < 0) brs.push(b); } });
  }
  for (let i = 1; i < V.lv.length; i++) {
    const r = V.lv[i]; if (!r[0] || (String(r[9] || '').trim() || 'видача') !== 'видача') continue;
    const c = (CATALOG.legacy[String(r[2])] || {})[String(r[3])]; if (c) add(roofIss, String(r[2]), c, Number(r[5]) || 0);
  }
  return { bal: bal, roofIss: roofIss, brs: brs };
}

/* ---- серійні номери ---- */
function readSerials_(ss) {
  const sh = ss.getSheetByName(TABS.serials.name);
  const vals = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < vals.length; i++) { const sn = unsafe_(vals[i][0]).trim(); if (sn) map[sn] = { row: i + 1, v: [sn, String(vals[i][1]), String(vals[i][2]), unsafe_(vals[i][3]), String(vals[i][4] || ''), String(vals[i][5] || ''), vals[i][6]] }; }
  return { sh: sh, map: map };
}
/* записати змінені/нові серійні номери */
function writeSerials_(S, changes) {
  const add = [];
  const row = v => [safe_(v[0]), v[1], v[2], safe_(v[3]), v[4], v[5], v[6]];
  changes.forEach(function (v) { const x = S.map[v[0]]; if (x) S.sh.getRange(x.row, 1, 1, 7).setValues([row(v)]); else add.push(row(v)); });
  if (add.length) S.sh.getRange(S.sh.getLastRow() + 1, 1, add.length, 7).setValues(add);
}
/* стан «Серійних» з нуля за «Надходження» і «Рух» у порядку запису */
function replaySerials_(V) {
  const ev = [];
  for (let i = 1; i < V.rv.length; i++) if (V.rv[i][0]) splitSerials_(V.rv[i][8]).forEach(function (sn) { ev.push({ t: V.rv[i][11], n: i, k: 0, sn: sn, c: String(V.rv[i][3]), to: P_STORE, o: '', id: String(V.rv[i][0]) }); });
  for (let i = 1; i < V.mv.length; i++) {
    const r = V.mv[i]; if (!r[0]) continue; const T = MOVE_TYPES[String(r[2])] || {};
    splitSerials_(r[9]).forEach(function (sn) { ev.push({ t: r[13], n: i, k: T.opening ? 0 : 1, sn: sn, c: String(r[6]), to: T.opening ? unsafe_(r[3]) : unsafe_(r[4]), o: String(r[5] || ''), id: String(r[0]) }); });
  }
  const tm = v => v instanceof Date ? v.getTime() : (Date.parse(v) || 0);
  ev.sort(function (a, b) { return (tm(a.t) - tm(b.t)) || (a.n - b.n) || (a.k - b.k); });
  const map = {}; const order = [];
  ev.forEach(function (e) {
    const kind = placeKind_(e.to); if (!kind) return;
    if (e.k === 0) { if (!map[e.sn]) order.push(e.sn); map[e.sn] = [e.sn, e.c, SERIAL_STATUS[kind], e.to, e.o, e.id, e.t]; return; }
    const x = map[e.sn]; if (!x) return;
    map[e.sn] = [e.sn, x[1], SERIAL_STATUS[kind], e.to, e.o || x[4], e.id, e.t];
  });
  return order.map(function (sn) { return map[sn]; });
}
function rebuildSerials_(ss, V) {
  const rows = replaySerials_(V || docValues_(ss));
  const sh = ss.getSheetByName(TABS.serials.name);
  const last = sh.getLastRow(); if (last >= 2) sh.getRange(2, 1, last - 1, 7).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 7).setValues(rows.map(function (v) { return [safe_(v[0]), v[1], v[2], safe_(v[3]), v[4], v[5], v[6]]; }));
}
/* «Серійні» не збігаються з документами (обірваний запис, ручна правка) — перебудувати. true — було виправлено */
function repairSerials_(ss, V) {
  const want = replaySerials_(V); const S = readSerials_(ss);
  const keys = Object.keys(S.map);
  let bad = keys.length !== want.length;
  for (let i = 0; !bad && i < want.length; i++) { const x = S.map[want[i][0]]; if (!x || x.v[1] !== want[i][1] || x.v[2] !== want[i][2] || x.v[3] !== want[i][3] || x.v[5] !== want[i][5]) bad = true; }
  if (bad) rebuildSerials_(ss, V);
  return bad;
}

/* Надходження: склад +; серійні номери модулів і щитків — у «Серійні» зі статусом «склад» */
function saveReceipt_(ss, me, req) {
  const d = String(req.d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  const L = cleanLines_(req, false); if (L.error) return { ok: false, error: L.error, message: L.message || '' };
  const photos = photosOf_(req.photos, MAX_DOC_PHOTOS, MAX_PHOTO_B64);
  if (!photos) return { ok: false, error: 'bad_request', message: 'photo_too_big' };
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.receipts.name);
  const dupOf = row => { const lock = LockService.getScriptLock(); lock.waitLock(20000); try { repairSerials_(ss, docValues_(ss)); } finally { lock.releaseLock(); } return { ok: true, dup: true, id: String(row[0]) }; };
  const prev = findCid_(sh, cid, CID_COL.receipts);
  if (prev) return dupOf(prev);
  const doc = safe_(String(req.doc || '').slice(0, 120));
  const id = newId_('N'); const now = new Date(); const files = [];
  /* фото — на Диск до блокування */
  const link = savePhotos_(photos, d, 'Накладна', files);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const again = findCid_(sh, cid, CID_COL.receipts);
    if (again) { trash_(files); repairSerials_(ss, docValues_(ss)); return { ok: true, dup: true, id: String(again[0]) }; }
    let S = readSerials_(ss);
    const taken = () => { for (const l of L.lines) for (const sn of l.serials) if (S.map[sn]) return sn; return ''; };
    let t = taken();
    if (t && repairSerials_(ss, docValues_(ss))) { S = readSerials_(ss); t = taken(); }
    if (t) { trash_(files); return { ok: false, error: 'serial_dup', message: t }; }
    /* спершу серійні, потім рядки документа (обрив між ними виправить repairSerials_ при повторі) */
    const ch = [];
    L.lines.forEach(function (l) { l.serials.forEach(function (sn) { ch.push([sn, l.c, SERIAL_STATUS['склад'], P_STORE, '', id, now]); }); });
    if (ch.length) writeSerials_(S, ch);
    const rows = L.lines.map(function (l) { return [id, d, doc, l.c, l.name, l.q, l.unit, l.owner, safe_(l.serials.join('\n')), link, safe_(me.name), now, cid]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return { ok: true, id: id, photo: link, serials: ch.length };
  } finally { lock.releaseLock(); }
}

/* Рух: видача / повернення / брак / передача на зберігання / інвентаризація / початкові залишки */
function saveMove_(ss, me, req) {
  const d = String(req.d || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: 'bad_date' };
  const type = String(req.type || '').trim(); const T = MOVE_TYPES[type];
  if (!T) return { ok: false, error: 'bad_type' };
  const from = String(req.from || '').trim(); const to = (T.signed || T.opening) ? '' : String(req.to || '').trim();
  const fk = placeKind_(from); const tk = placeKind_(to);
  if (T.from.indexOf(fk) < 0 || T.to.indexOf(tk) < 0) return { ok: false, error: 'bad_place' };
  const o = String(req.o || '');
  if (o && OBJECTS.indexOf(o) < 0) return { ok: false, error: 'bad_object' };
  if (T.roof && !o) return { ok: false, error: 'bad_object' };
  const L = cleanLines_(req, !!T.signed); if (L.error) return { ok: false, error: L.error, message: L.message || '' };
  const reason = safe_(String(req.reason || '').trim().slice(0, 200));
  if (!reason && T.reason) return { ok: false, error: 'need_reason' };
  const act = safe_(String(req.act || '').slice(0, 60));
  let signB64 = '';
  if (req.sign && req.sign.b64) { signB64 = String(req.sign.b64); if (signB64.length > MAX_SIGN_B64) return { ok: false, error: 'bad_request', message: 'sign_too_big' }; }
  const cid = CID_RE.test(String(req.cid || '')) ? String(req.cid) : '';
  const sh = ss.getSheetByName(TABS.moves.name);
  const prev = findCid_(sh, cid, CID_COL.moves);
  if (prev) { const lk = LockService.getScriptLock(); lk.waitLock(20000); try { repairSerials_(ss, docValues_(ss)); } finally { lk.releaseLock(); } return { ok: true, dup: true, id: String(prev[0]) }; }
  const id = newId_(T.prefix);
  const now = new Date(); const files = [];
  /* підпис — на Диск до блокування */
  const sign = signB64 ? savePhotos_([{ b64: signB64, mime: 'image/png' }], d, 'Підпис_' + id, files) : '';
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const fail = (e, m) => { trash_(files); return { ok: false, error: e, message: m || '' }; };
    const again = findCid_(sh, cid, CID_COL.moves);
    if (again) { trash_(files); repairSerials_(ss, docValues_(ss)); return { ok: true, dup: true, id: String(again[0]) }; }
    const V = docValues_(ss); const DS = docState_(V);
    /* бригада — лише з «Доступи» або вже наявна в «Русі» */
    const known = brigades_(ss).list.concat(DS.brs);
    for (const p of [from, to]) if (placeKind_(p) === 'бригада' && known.indexOf(p.slice(P_BRIG.length)) < 0) return fail('bad_place', p);
    /* наявність у місці «звідки» і ліміт даху — рахує сервер; понад — лише з причиною */
    if (!T.signed && !T.opening) {
      const over = [];
      L.lines.forEach(function (l) {
        const avail = (DS.bal[from] || {})[l.c] || 0;
        if (l.q > avail + 1e-9) over.push(l.c + ': є ' + avail);
        if (type === 'видача') { const rem = r3_(((CATALOG.need[o] || {})[l.c] || 0) - ((DS.roofIss[o] || {})[l.c] || 0)); if (l.q > rem + 1e-9) over.push(l.c + ': ліміт ' + Math.max(0, rem)); }
      });
      if (over.length && !reason) return fail('bad_request', 'over_limit: ' + over.join('; '));
    }
    /* серійні: для «початкових залишків» — нові; для руху — саме в місці «звідки» і цієї позиції */
    let S = readSerials_(ss);
    const check = function () {
      const ch = [];
      for (const l of L.lines) for (const sn of l.serials) {
        const x = S.map[sn];
        if (T.opening) { if (x) return { e: 'serial_dup', m: sn }; ch.push([sn, l.c, SERIAL_STATUS[fk], from, o, id, now]); continue; }
        if (!x) return { e: 'serial_unknown', m: sn };
        if (x.v[1] !== l.c || x.v[3] !== from) return { e: 'serial_state', m: sn + ': ' + x.v[2] + ', ' + x.v[3] };
        ch.push([sn, l.c, SERIAL_STATUS[tk], to, o || x.v[4], id, now]);
      }
      return { ch: ch };
    };
    let r = check();
    if (r.e && repairSerials_(ss, V)) { S = readSerials_(ss); r = check(); }
    if (r.e) return fail(r.e, r.m);
    /* спершу серійні, потім рядки документа */
    if (r.ch.length) writeSerials_(S, r.ch);
    const rows = L.lines.map(function (l, i) { return [id, d, type, safe_(from), safe_(to), o, l.c, l.name, l.q, safe_(l.serials.join('\n')), reason, safe_(me.name), i === 0 ? sign : '', now, l.owner, act, cid]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return { ok: true, id: id, sign: sign };
  } finally { lock.releaseLock(); }
}

function deleteRows_(ss, me, req) {
  const kind = ['stock', 'receipts', 'moves'].indexOf(req.kind) >= 0 ? req.kind : 'reports';
  const id = String(req.id || ''); if (!id) return { ok: false, error: 'bad_id' };
  const sh = ss.getSheetByName(TABS[kind].name);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const vals = sh.getDataRange().getValues();
    const idx = []; let author = ''; const sers = [];
    for (let i = 1; i < vals.length; i++) if (String(vals[i][0]) === id) {
      idx.push(i + 1); author = unsafe_(vals[i][WHO_COL[kind]]);
      if (kind === 'receipts') splitSerials_(vals[i][8]).forEach(function (s) { sers.push(s); });
      if (kind === 'moves') splitSerials_(vals[i][9]).forEach(function (s) { sers.push(s); });
    }
    if (!idx.length) return { ok: false, error: 'not_found' };
    const own = author === me.name && ((kind === 'reports' && me.role === 'виконавець') || (kind !== 'reports' && me.role === 'комірник'));
    if (!(me.role === 'адмін' || own)) return { ok: false, error: 'forbidden' };
    /* не можна видалити документ, на серійні номери якого посилається пізніший рух */
    if (sers.length) {
      const mv = kind === 'moves' ? vals : ss.getSheetByName(TABS.moves.name).getDataRange().getValues();
      const after = kind === 'moves' ? idx[idx.length - 1] : 1;
      for (let i = after; i < mv.length; i++) {
        if (String(mv[i][0]) === id) continue;
        const used = splitSerials_(mv[i][9]).filter(function (s) { return sers.indexOf(s) >= 0; });
        if (used.length) return { ok: false, error: 'in_use', message: used.slice(0, 3).join(', ') + ' → ' + String(mv[i][0]) };
      }
    }
    for (let j = idx.length - 1; j >= 0; j--) sh.deleteRow(idx[j]);
    if (sers.length) rebuildSerials_(ss);
  } finally { lock.releaseLock(); }
  return { ok: true };
}
