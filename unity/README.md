# Файлы для Unity-проекта

Скопируйте папку `Assets/` из этой директории в корень вашего Unity-проекта (содержимое сольётся с существующей `Assets/`).

1. `Project Settings → Player → Resolution and Presentation → WebGL Template → Physlab`
2. `Publishing Settings → Compression Format → Disabled` (на время разработки)
3. В сцене создайте объект **ModuleRoot** и повесьте на него `FrictionModule`.
4. `File → Build Profiles → WebGL → Build`
5. Результат сборки (`index.html` + `Build/`) положите в `physlab/public/modules/<имя-симуляции>/`
   и поменяйте `buildUrl` нужной симуляции (например, `archimedes-sim`) в `content/topics/*.ts`
   с `/modules/placeholder/index.html` на свой путь, затем `npx prisma db seed`.

Описание сцены, параметры `Init(json)` и события для каждой симуляции — на странице темы,
блок «Техническое задание для WebGL (Unity)».

Сверьте переменные `{{{ ... }}}` в шаблоне с шаблоном Minimal вашей версии Unity.
