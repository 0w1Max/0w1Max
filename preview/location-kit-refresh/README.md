# Наборы локаций · рабочий предпросмотр

Обновлены три локации официального каталога: Пустынный каньон, Затопленный храм и Штормовое побережье. На каждой — четыре новых препятствия и три платформы. Завод V8.5 сохранён в этой же ветке. Официальный каталог v2.6.0 и ветка `output` не изменены.

## Игровые размеры препятствий

| Локация | Предмет | Размер, px |
| --- | --- | --- |
| Каньон | Слоистый песчаник | 45 × 32 |
| Каньон | Обломок колонны | 44 × 25 |
| Каньон | Полевой груз | 43 × 31 |
| Каньон | Мешки с песком | 44 × 22 |
| Храм | Фрагмент колонны | 36 × 34 |
| Храм | Резная алтарная плита | 44 × 27 |
| Храм | Древний сундук | 39 × 29 |
| Храм | Кладка с корнями | 34 × 29 |
| Побережье | Якорь с цепью | 48 × 27 |
| Побережье | Связка брёвен | 45 × 24 |
| Побережье | Морской груз | 43 × 31 |
| Побережье | Прибрежный базальт | 43 × 27 |

Платформы имеют ширину 138–150 px, верхнюю поверхность на y=310–315; высота сохраняет пропорции исходного предмета. Геометрия препятствий используется и в отрисовке, и при построении безопасных прыжков. Предметы не растягиваются по отдельным осям.

## Просмотр и воспроизводимость

`index.html` переключает три локации и три карты каждой. В сумме эти карты показывают все 21 предмет. Есть перезапуск анимации, увеличение и отдельная ссылка на SVG. `manifest.json` хранит seed, карту и SHA-256 каждого SVG.

Календарь взят из проверенного снимка публикации 2026-11-23: 620 вкладов, 366 дней. Это настоящие данные, а не демо. Снимок не обновляется при открытии предпросмотра.

Исходные атласы: `assets/{desert,temple,coast}-kit-source.png`. Они созданы встроенной генерацией изображений с прозрачным фоном. `scripts/compile-location-kits.py` отделяет семь спрайтов каждого атласа и компилирует их в автономные SVG pixel runs. Фоны не перерисовывались.

Генератор предпросмотров: `scripts/preview-location-kits.mjs`. Основной источник соответствий типов, размеров и названий: `scripts/location-kit-config.mjs`.

## Художественные промпты

Общее для трёх атласов: transparent production sprite atlas, seven isolated complete sprites, four compact ground obstacles on the top row and three long low platforms on the bottom row; crisp hand-pixelled retro side-scroller art, shallow visible top face, dark readable silhouettes, limited color clusters, no text, background scene, detached shadows, overlap or clipping. Match approved factory sprite craft and each location's existing scene palette. Keep practical human-scale obstacles and short platform supports.

- **Desert:** warm ochre sandstone, clay orange, dark brown/plum shadows and pale sand edges; layered boulder, fallen carved pillar drum, reinforced field cargo box, three burlap sandbags; carved sandstone cornice on short corbels, bleached timber walkway with rope-lashed brackets, stratified rock shelf.
- **Temple:** muted jade/turquoise, cream limestone, dark teal contours, sparse green moss and aged bronze; fractured fluted column base, carved altar slab, closed stone-and-bronze reliquary chest, rooted masonry blocks; carved cornice, aqueduct slab, stepped ceremonial stone bridge.
- **Coast:** cold slate, salt-grey highlights, maritime teal, bleached wood, rusty copper and cream ropes; low anchor with chain and coiled rope, lashed driftwood, salvage cargo chest, barnacled basalt; broken fishing-pier decking, seawall capstones, salvaged ship deck with short steel brackets.

## Проверки

`tests-location-kits.mjs` проверяет покрытие всех наборов на 3000 seed, посадку опор над землёй и отсутствие пересечений бойца с препятствиями на 120 реальных маршрутах, используя фактическую интерполяцию 12 ключевых кадров прыжка. Существующий набор проверяет календарь, пули, развороты, завершение и официальную ротацию.

Локальная проверка всего изменения: `node --test tests.mjs tests-location-kits.mjs tests-factory-v8.mjs tests-game-over.mjs tests-profile.mjs`.
