# Установка в свой GitHub-профиль

## 1. Репозиторий

Форкните этот репозиторий в свой личный аккаунт под именем `commando-activity`. Выберите копирование только default branch: чужая ветка `output` не нужна. README и история автора сохраняются в форке; замените README форка своим описанием. Существующий профиль можно оставить отдельным репозиторием.

Если профиля ещё нет, создайте публичный репозиторий `YOUR_LOGIN/YOUR_LOGIN` с README.md в корне. Генератор будет работать отдельно в `YOUR_LOGIN/commando-activity`. Перезаписывать свой профиль чужим README не нужно.

Альтернатива для разработчика: перенести `scripts/`, `assets/`, `fixtures/`, все `tests*.mjs`, оба `commando-*.json` и `.github/workflows/commando-activity.yml` в существующий личный репозиторий. Сохраните лицензии и [уведомления о правах на графику](../ASSET_RIGHTS.md).

## 2. Секрет календаря

В своём аккаунте откройте **Settings → Developer settings → Personal access tokens → Tokens (classic)**. Создайте PAT с конечным сроком действия и минимальным scope **read:user**. `repo`, `workflow`, административные и write-права этому PAT не нужны. Это проверенный путь; fine-grained PAT отдельно не сертифицирован релизом.

В репозитории генератора: **Settings → Secrets and variables → Actions → New repository secret**. Имя: **COMMANDO_READ_USER_TOKEN**. Значение: PAT владельца вашего личного аккаунта.

Не вставляйте токен в код, JSON, README или Issue. Автоматический `GITHUB_TOKEN` используется отдельно для записи результата в ваш репозиторий. PAT другого пользователя генератор отклонит. При истечении срока замените значение секрета.

## 3. Первый запуск

Откройте **Actions** и включите workflows в форке, если GitHub предлагает это сделать. Если политика репозитория ограничивает запись, проверьте **Settings → Actions → General → Workflow permissions**: workflow необходима запись содержимого. Не включайте передачу write-токенов в pull requests из форков.

Выберите **Commando Activity · ежедневные официальные локации → Run workflow**, default branch. Логин и ветка определятся автоматически. Первый успешный запуск сам создаст `output`; вручную создавать SVG, JSON или ветку не нужно.

Успешный запуск проходит тесты, генерацию, валидацию и публикацию. В `output` должны появиться **оба** файла: `commando-activity.svg` и `commando-state.json`. Не редактируйте их вручную.

## 4. Изображение в профиле

В README профильного репозитория вставьте, заменив `YOUR_LOGIN` и при необходимости имя репозитория генератора:

```markdown
[![Commando Activity](https://raw.githubusercontent.com/YOUR_LOGIN/commando-activity/output/commando-activity.svg)](https://github.com/YOUR_LOGIN/commando-activity)
```

Для генератора внутри профильного репозитория замените `commando-activity` на свой логин. HTML для полной ширины:

```html
<img src="https://raw.githubusercontent.com/YOUR_LOGIN/commando-activity/output/commando-activity.svg" alt="Animated GitHub contributions" width="100%">
```

Сначала откройте прямой URL SVG, затем профиль. GitHub может некоторое время показывать кеш. Ссылка на страницу GitHub с исходным кодом SVG не заменяет прямой URL картинки.

## Неполадки

| Симптом | Проверка |
|---|---|
| Job skipped | Default branch; версия 2.7.0 или новее |
| Нет токена / HTTP 401 | Название секрета, значение и срок PAT |
| Неверный владелец | PAT создан тем же личным аккаунтом, которому принадлежит форк |
| Ошибка scope | Classic PAT с `read:user` |
| Запись отклонена | Actions `contents: write`, политика репозитория, защита output |
| Output changed | Другой запуск опубликовал результат; повторите без force push |
| SVG/state mismatch | См. [восстановление](RELEASING.md); не подменяйте контрольную сумму вручную |
| Картинка 404 | Успешный первый запуск, публичный репозиторий, правильный URL |
| Нет обновлений | Actions, срок PAT, включённое расписание; GitHub может отключать scheduled workflows в неактивных публичных репозиториях |

Запуски планируются на 00:17 и 12:17 Москвы; возможны задержки GitHub. Локация меняется с датой Europe/Moscow, повторный запуск в тот же день сохраняет её.

Справки GitHub: [README профиля](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme), [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [включение workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
