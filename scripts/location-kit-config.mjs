/** Thematic terrain kits; dimensions are also the actual collision footprints. */
export const LOCATION_KITS = Object.freeze({
  desert: {
    title:'Пустынный каньон', version:'7.1',
    obstacles:{'jungle-rock':'obstacle-0','stone-ruin':'obstacle-1','supply-crate':'obstacle-2',sandbags:'obstacle-3'},
    platforms:{'camo-platform':'platform-0','wooden-bridge':'platform-1','mossy-stone':'platform-2'},
    sizes:{'jungle-rock':[45,32],'stone-ruin':[44,25],'supply-crate':[45,38],sandbags:[50,26]},
    obstacleLabels:['Слоистый песчаник','Обломок колонны','Полевой груз','Мешки с песком'],
    platformLabels:['Резной карниз','Деревянный переход','Каменный уступ'],
  },
  temple: {
    title:'Затопленный храм', version:'3.1',
    obstacles:{'stone-ruin':'obstacle-0','jungle-rock':'obstacle-1','supply-crate':'obstacle-2','tree-stump':'obstacle-3'},
    platforms:{'mossy-stone':'platform-0','vine-ledge':'platform-1','wooden-bridge':'platform-2'},
    sizes:{'stone-ruin':[36,34],'jungle-rock':[44,27],'supply-crate':[45,38],'tree-stump':[34,29]},
    obstacleLabels:['Фрагмент колонны','Резная алтарная плита','Древний сундук','Кладка с корнями'],
    platformLabels:['Храмовый карниз','Плита акведука','Каменный переход'],
  },
  coast: {
    title:'Штормовое побережье', version:'3.1',
    obstacles:{sandbags:'obstacle-0','fallen-log':'obstacle-1','supply-crate':'obstacle-2','jungle-rock':'obstacle-3'},
    platforms:{'wooden-bridge':'platform-0','mossy-stone':'platform-1','metal-catwalk':'platform-2'},
    sizes:{sandbags:[39,30],'fallen-log':[55,26],'supply-crate':[45,38],'jungle-rock':[43,27]},
    obstacleLabels:['Швартовая тумба','Связка брёвен','Морской груз','Прибрежный базальт'],
    platformLabels:['Причальный настил','Волнолом','Палубная секция'],
  },
});
export const hasLocationKit = location => Object.hasOwn(LOCATION_KITS,location);
export const usesTerrainClearance = location => location === 'industrial' || hasLocationKit(location);
